// lib/infrastructure/adapters/DelhaizeAdapter.ts
//
// Strategy: "headless" — US-F1-04. Delhaize charge ses données produit via un appel interne
// (`delhaize.be/api/v1/...`, composant `CmsProductList`) plutôt que dans le HTML brut initial
// (docs/FOUNDATION.md §9.1). Approche retenue : Playwright navigue la page publique et
// **intercepte les réponses réseau** correspondant à ce pattern d'API plutôt que de parser le DOM
// rendu — plus robuste aux changements de mise en page CSS, mais dépendant de la stabilité du
// contrat JSON interne.
//
// ============================================================================================
// SELFDOUBT — incertitudes non vérifiables depuis ce poste :
// ============================================================================================
// | Affirmation                                                        | Niveau      | Action |
// |------------------------------------------------------------------------|------------|--------|
// | Delhaize charge ~1000+ produits via une API interne `/api/v1/...`      | ✅ Certain  | Constaté par l'Architecte en conditions réelles (FOUNDATION §9.1 : "1062 produits") |
// | Le chemin exact du pattern d'URL intercepté ci-dessous                 | ❌ Hypothèse| Estimation ("api/v1/product" contenant "promotion" ou similaire) — à ajuster contre le trafic réseau réel capturé dans un navigateur (DevTools > Network) |
// | La forme exacte du JSON retourné (noms de champs)                      | ❌ Hypothèse| Mapping défensif ci-dessous, noms de clés supposés |
// | Le temps d'exécution réel de cette collecte (impact sur maxDuration)   | ❌ Hypothèse| Alerte Architecte §8 à Backend : "mesurer en conditions réelles la durée d'exécution" — non mesurable depuis ce poste sans accès réseau sortant |
//
// Cette implémentation n'a jamais été exécutée contre delhaize.be réel dans cet environnement.
// US-F1-04 DoD ("Au moins une des deux enseignes headless testée de bout en bout... vérifiées
// manuellement") reste donc non cochable depuis ce poste — à valider au premier déploiement réel.
//
// Conformité sécurité : aucun script arbitraire n'est injecté dans la page (US-F1-04 DoD) — on se
// contente d'observer les réponses réseau déjà émises par la page pour son propre fonctionnement.
// Chemins disallow robots.txt Delhaize (`*/search/*`, `*/customerhub/quick-shop/*`) jamais
// navigués directement (US-F1-08).

import type { RawPromotion, StoreAdapter } from '../../domain/StoreAdapter';
import { closeHeadlessSession, launchHeadlessSession } from './headlessBrowser';

const PROMOTIONS_PAGE = 'https://www.delhaize.be/fr/shop/Promotions';
// Motif d'URL interceptée — voir selfdoubt ci-dessus. Ajusté au premier test réel.
const API_URL_PATTERN = /\/api\/v1\/.*(product|promotion)/i;
const NAVIGATION_TIMEOUT_MS = 45_000;
const NETWORK_IDLE_WAIT_MS = 8_000;

interface DelhaizeApiProductGuess {
  name?: string;
  title?: string;
  category?: { name?: string } | string;
  packagingText?: string;
  unit?: string;
  regularPrice?: number;
  priceWas?: number;
  price?: { value?: number } | number;
  promoPrice?: number;
  discount?: { percentage?: number } | number;
  pricePerUnit?: number;
  validityStart?: string;
  validityEnd?: string;
  origin?: string;
  url?: string;
  slug?: string;
}

export function createDelhaizeAdapter(
  baseUrl: string = process.env.DELHAIZE_BASE_URL || '',
): StoreAdapter {
  const rootUrl = baseUrl || 'https://www.delhaize.be';

  return {
    chainSlug: 'delhaize',
    strategy: 'headless',

    async fetchPromotions(): Promise<RawPromotion[]> {
      const session = await launchHeadlessSession(NAVIGATION_TIMEOUT_MS);
      const captured: DelhaizeApiProductGuess[] = [];

      try {
        session.page.on('response', (response) => {
          const url = response.url();
          if (!API_URL_PATTERN.test(url)) return;

          // Fire-and-forget volontaire : on ne bloque pas le pipeline réseau de la page pour
          // chaque réponse capturée. Erreurs de parsing silencieusement ignorées (réponse non-JSON
          // ou non pertinente) — ne doit jamais faire planter la collecte globale (RG-3).
          response
            .json()
            .then((body) => {
              const items = extractProductArray(body);
              captured.push(...items);
            })
            .catch(() => {
              /* réponse non-JSON ou non pertinente, ignorée */
            });
        });

        await session.page.goto(`${rootUrl}${new URL(PROMOTIONS_PAGE).pathname}`, {
          waitUntil: 'domcontentloaded',
          timeout: NAVIGATION_TIMEOUT_MS,
        });

        // Laisse le temps aux appels XHR/fetch du composant CmsProductList de se déclencher et
        // d'être interceptés. Pas d'attente réseau infinie (timeout explicite, ARCHITECTURE §7).
        await session.page.waitForTimeout(NETWORK_IDLE_WAIT_MS);

        return captured
          .map((item) => mapDelhaizeProduct(item, rootUrl))
          .filter((item): item is RawPromotion => item !== null);
      } finally {
        await closeHeadlessSession(session);
      }
    },
  };
}

function extractProductArray(body: unknown): DelhaizeApiProductGuess[] {
  if (Array.isArray(body)) return body as DelhaizeApiProductGuess[];
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    for (const key of ['products', 'items', 'results', 'content']) {
      const value = record[key];
      if (Array.isArray(value)) return value as DelhaizeApiProductGuess[];
    }
  }
  return [];
}

function mapDelhaizeProduct(
  product: DelhaizeApiProductGuess,
  rootUrl: string,
): RawPromotion | null {
  const rawProductName = product.name ?? product.title;
  const promoPrice =
    product.promoPrice ?? (typeof product.price === 'number' ? product.price : product.price?.value);

  if (!rawProductName || promoPrice === undefined || promoPrice === null) {
    return null;
  }

  const category = typeof product.category === 'string' ? product.category : product.category?.name;
  const discountPercent =
    typeof product.discount === 'number' ? product.discount : product.discount?.percentage;

  return {
    rawProductName,
    category: category ?? null,
    unitLabel: product.unit ?? product.packagingText ?? null,
    regularPrice: product.regularPrice ?? product.priceWas ?? null,
    promoPrice,
    discountPercent: discountPercent ?? null,
    pricePerUnit: product.pricePerUnit ?? null,
    validFrom: product.validityStart ?? new Date().toISOString(),
    validTo: product.validityEnd ?? new Date().toISOString(),
    sourceUrl: product.url ? `${rootUrl}${product.url}` : product.slug ? `${rootUrl}/${product.slug}` : rootUrl,
    originLabel: product.origin ?? null,
  };
}
