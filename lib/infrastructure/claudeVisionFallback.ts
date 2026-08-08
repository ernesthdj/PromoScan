// lib/infrastructure/claudeVisionFallback.ts
//
// US-F1-05 (P1) — Fallback d'extraction par IA pour documents non structurés (PDF/image).
// Aucune des 4 enseignes actuelles ne l'exige en usage nominal (toutes ont une source HTML/API
// exploitable — cf. docs/USER-STORIES.md), mais implémenté car explicitement demandé par la
// tâche et couvert par le DoD FOUNDATION §9.1 ("au moins un cas PDF/image traité").
//
// Ce fichier importe le SDK Anthropic — vit donc en infrastructure/, jamais en domain/.
//
// SELFDOUBT :
// | Affirmation                                                        | Niveau      |
// |------------------------------------------------------------------------|------------|
// | Modèle choisi : claude-opus-5                                          | ⚠️ Probable | Un modèle Sonnet serait vraisemblablement suffisant et nettement moins coûteux pour une tâche d'extraction structurée mécanique (pas de raisonnement long horizon), et ce chemin de code n'est déclenché qu'en secours rare (P1, aucune des 4 enseignes actuelles ne l'utilise en usage nominal). Opus 5 est néanmoins retenu ici en suivant la garde-fou explicite du skill claude-api ("ALWAYS use claude-opus-5 unless explicitly told otherwise... never downgrade for cost"). **Signalé à mentalyas** : envisager `claude-sonnet-5` (moins cher) si ce chemin devient utilisé plus fréquemment ou si le coût devient un sujet — changement d'une seule ligne (`FALLBACK_MODEL`).
// | Jamais testé contre un vrai document PDF/image dans cet environnement | ❌ Hypothèse | Aucun accès réseau sortant depuis ce poste de développement pour appeler l'API Claude réellement. US-F1-05 DoD ("au moins un cas PDF/image réel traité") reste non cochable depuis ce poste — à valider au premier déploiement réel avec une clé API valide.

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import type { RawPromotion } from '../domain/StoreAdapter';

// Cf. selfdoubt ci-dessus : à reconsidérer vers un modèle moins coûteux si ce chemin de secours
// devient fréquemment emprunté en production.
const FALLBACK_MODEL = 'claude-opus-5';

const EXTRACTION_PROMPT = `Tu es un système d'extraction de données. Analyse ce document promotionnel
(folder papier scanné, PDF ou capture d'écran) d'une enseigne alimentaire belge et extrait chaque
promotion produit visible.

Pour chaque produit en promotion, extrait :
- rawProductName : nom du produit tel qu'affiché (obligatoire)
- category : catégorie du produit si déductible (ex. "viande", "frais", "épicerie"), sinon null
- unitLabel : unité/conditionnement (ex. "1 kg", "x8"), sinon null
- regularPrice : prix normal (barré) en euros, nombre, sinon null
- promoPrice : prix promotionnel en euros, nombre (obligatoire)
- discountPercent : pourcentage de remise si affiché, sinon null
- pricePerUnit : prix au kilo/litre si affiché, sinon null
- validFrom : date de début de validité au format ISO 8601 (YYYY-MM-DD) si déductible, sinon la date du jour
- validTo : date de fin de validité au format ISO 8601 (YYYY-MM-DD) si déductible, sinon 7 jours après validFrom
- originLabel : origine/provenance si affichée, sinon null

Retourne UNIQUEMENT les produits clairement identifiables avec un prix promotionnel. N'invente aucune
donnée non visible sur le document.`;

// Schéma JSON pour output_config.format (structured outputs) — garantit une réponse JSON valide
// conforme, évite le parsing fragile de texte libre.
const EXTRACTION_JSON_SCHEMA = {
  type: 'object',
  properties: {
    promotions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          rawProductName: { type: 'string' },
          category: { type: ['string', 'null'] },
          unitLabel: { type: ['string', 'null'] },
          regularPrice: { type: ['number', 'null'] },
          promoPrice: { type: 'number' },
          discountPercent: { type: ['number', 'null'] },
          pricePerUnit: { type: ['number', 'null'] },
          validFrom: { type: 'string' },
          validTo: { type: 'string' },
          originLabel: { type: ['string', 'null'] },
        },
        required: [
          'rawProductName',
          'category',
          'unitLabel',
          'regularPrice',
          'promoPrice',
          'discountPercent',
          'pricePerUnit',
          'validFrom',
          'validTo',
          'originLabel',
        ],
        additionalProperties: false,
      },
    },
  },
  required: ['promotions'],
  additionalProperties: false,
} as const;

// Validation locale de la forme retournue par Claude, avant reconstruction en RawPromotion complet
// (sourceUrl n'est pas demandé au modèle : il est connu côté appelant, pas dans le document).
const claudeExtractedItemSchema = z.object({
  rawProductName: z.string().min(1),
  category: z.string().nullable(),
  unitLabel: z.string().nullable(),
  regularPrice: z.number().nullable(),
  promoPrice: z.number(),
  discountPercent: z.number().nullable(),
  pricePerUnit: z.number().nullable(),
  validFrom: z.string(),
  validTo: z.string(),
  originLabel: z.string().nullable(),
});

const claudeExtractionResponseSchema = z.object({
  promotions: z.array(claudeExtractedItemSchema),
});

export type ClaudeVisionMediaType = 'application/pdf' | 'image/png' | 'image/jpeg' | 'image/webp';

export interface ExtractPromotionsFromDocumentInput {
  /** Contenu du document encodé en base64 (sans préfixe data URI). */
  base64Data: string;
  mediaType: ClaudeVisionMediaType;
  /** URL/référence source à reporter sur chaque RawPromotion produit (non demandée au modèle). */
  sourceUrl: string;
}

/**
 * Envoie un document non-HTML (PDF/image) à Claude Vision pour extraction structurée, valide la
 * réponse contre le même contrat que les autres adaptateurs (RawPromotion), et ne retourne jamais
 * de donnée non conforme au schéma (US-F1-05 DoD : "réponse non conforme rejetée et loguée, sans
 * insertion de données invalides").
 *
 * Retry avec backoff (US-F1-05 DoD) : délégué au client Anthropic officiel (`maxRetries`), qui
 * retente automatiquement les erreurs 429/5xx/réseau avec backoff exponentiel — pas de logique de
 * retry maison, conformément à la règle "ne pas réimplémenter ce que le SDK fait déjà".
 */
export async function extractPromotionsFromDocument(
  input: ExtractPromotionsFromDocumentInput,
): Promise<RawPromotion[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ClaudeVisionApiKeyMissing');
  }

  const client = new Anthropic({ apiKey, maxRetries: 3 });

  const contentBlock =
    input.mediaType === 'application/pdf'
      ? {
          type: 'document' as const,
          source: { type: 'base64' as const, media_type: input.mediaType, data: input.base64Data },
        }
      : {
          type: 'image' as const,
          source: { type: 'base64' as const, media_type: input.mediaType, data: input.base64Data },
        };

  const response = await client.messages.create({
    model: FALLBACK_MODEL,
    max_tokens: 8192,
    output_config: {
      effort: 'low', // extraction mécanique, pas de raisonnement complexe requis
      format: { type: 'json_schema', schema: EXTRACTION_JSON_SCHEMA },
    },
    messages: [
      {
        role: 'user',
        content: [contentBlock, { type: 'text', text: EXTRACTION_PROMPT }],
      },
    ],
  });

  if (response.stop_reason === 'refusal') {
    throw new Error('ClaudeVisionRefusal');
  }

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('ClaudeVisionNoTextResponse');
  }

  let rawJson: unknown;
  try {
    rawJson = JSON.parse(textBlock.text);
  } catch {
    throw new Error('ClaudeVisionInvalidJson');
  }

  const parsed = claudeExtractionResponseSchema.safeParse(rawJson);
  if (!parsed.success) {
    // Réponse non conforme au schéma : rejetée intégralement, aucune insertion (US-F1-05 DoD).
    throw new Error('ClaudeVisionSchemaMismatch');
  }

  return parsed.data.promotions.map((item) => ({
    rawProductName: item.rawProductName,
    category: item.category,
    unitLabel: item.unitLabel,
    regularPrice: item.regularPrice,
    promoPrice: item.promoPrice,
    discountPercent: item.discountPercent,
    pricePerUnit: item.pricePerUnit,
    validFrom: item.validFrom,
    validTo: item.validTo,
    sourceUrl: input.sourceUrl,
    originLabel: item.originLabel,
  }));
}
