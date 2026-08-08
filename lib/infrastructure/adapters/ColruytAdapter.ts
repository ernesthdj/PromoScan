// lib/infrastructure/adapters/ColruytAdapter.ts
//
// Strategy: "api" — US-F1-02. Colruyt expose ses promotions via une API JSON interne
// (`ecgproductmw.colruyt.be`), documentée publiquement par la communauté dev (pas une API
// officiellement contractuelle), authentifiée par un header `X-CG-APIKEY` extrait dynamiquement
// du HTML/JS de la page publique de promotions (jamais codée en dur — US-F1-02 DoD).
//
// ============================================================================================
// SELFDOUBT — incertitudes techniques non vérifiables depuis ce poste (protocole /selfdoubt) :
// ============================================================================================
// | Affirmation                                                          | Niveau      | Action |
// |-----------------------------------------------------------------------|------------|--------|
// | L'endpoint ecgproductmw.colruyt.be existe et sert du JSON promo        | ✅ Certain  | Confirmé par docs/FOUNDATION.md §9.1 (vérifié par l'Architecte en conditions réelles) |
// | Le nom exact du endpoint/chemin de requête (ex. `/pricing/v1/...`)     | ❌ Hypothèse| Non figé par le brainstorm — chemin ci-dessous est une estimation raisonnable à ajuster contre le trafic réseau réel observé dans un navigateur |
// | Le regex d'extraction de la clé X-CG-APIKEY dans le HTML/JS public    | ❌ Hypothèse| Aucune garantie que le motif choisi corresponde au bundle JS actuel de colruyt.be — à ajuster dès le premier test réel |
// | La forme exacte du JSON de réponse (noms de champs)                   | ❌ Hypothèse| Mapping défensif ci-dessous (optional chaining partout) pour ne pas crasher sur un champ manquant, mais les noms de clés sont des suppositions |
// | La pagination (paramètres, taille de page)                            | ❌ Hypothèse| Implémentée de façon générique (page/pageSize), à confirmer/adapter |
//
// Cette implémentation n'a jamais été exécutée contre le site réel dans cet environnement
// (pas d'accès réseau sortant depuis ce poste de développement). Elle représente la meilleure
// estimation raisonnable à partir du contrat documenté par l'Architecte — **doit être validée et
// ajustée lors du premier test réel** (US-F1-02 DoD : "Testé de bout en bout avec des données
// Colruyt réelles, vérifiées manuellement" — non cochable depuis ce poste).

import type { RawPromotion, StoreAdapter } from '../../domain/StoreAdapter';
import { CrawlDelayLimiter, fetchWithUserAgent } from './httpClient';

const PUBLIC_PROMO_PAGE = 'https://www.colruyt.be/fr/promotions';
// Chemin d'API estimé — voir tableau selfdoubt ci-dessus. À ajuster contre le trafic réseau réel.
const API_PATH = '/ecgproductmw-services-web/v2/products/promotions';

interface ColruytApiProductGuess {
  name?: string;
  productName?: string;
  category?: string;
  categoryName?: string;
  unit?: string;
  packagingText?: string;
  regularPrice?: number;
  priceBeforeDiscount?: number;
  price?: number;
  promoPrice?: number;
  discountPercentage?: number;
  pricePerUnit?: number;
  unitPrice?: number;
  validFrom?: string;
  promotionStartDate?: string;
  validTo?: string;
  promotionEndDate?: string;
  origin?: string;
  countryOfOrigin?: string;
  url?: string;
}

interface ColruytApiResponseGuess {
  products?: ColruytApiProductGuess[];
  items?: ColruytApiProductGuess[];
  totalPages?: number;
  totalCount?: number;
}

export function createColruytAdapter(baseUrl: string = process.env.COLRUYT_BASE_URL || ''): StoreAdapter {
  const apiBaseUrl = baseUrl || 'https://ecgproductmw.colruyt.be';
  const crawlDelay = new CrawlDelayLimiter(5000); // 5s minimum chez Colruyt (US-F1-08 DoD)

  return {
    chainSlug: 'colruyt',
    strategy: 'api',

    async fetchPromotions(): Promise<RawPromotion[]> {
      const apiKey = await extractApiKey();
      const results: RawPromotion[] = [];

      let page = 0;
      const pageSize = 100;
      let totalPages = 1;

      do {
        await crawlDelay.wait();

        const url = new URL(API_PATH, apiBaseUrl);
        url.searchParams.set('page', String(page));
        url.searchParams.set('pageSize', String(pageSize));

        const response = await fetchWithUserAgent(url.toString(), {
          headers: { 'X-CG-APIKEY': apiKey, Accept: 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`ColruytApiError_${response.status}`);
        }

        const body = (await response.json()) as ColruytApiResponseGuess;
        const products = body.products ?? body.items ?? [];

        for (const product of products) {
          const mapped = mapColruytProduct(product, apiBaseUrl);
          if (mapped) {
            results.push(mapped);
          }
        }

        totalPages = body.totalPages ?? 1;
        page += 1;
      } while (page < totalPages);

      return results;
    },
  };
}

async function extractApiKey(): Promise<string> {
  const response = await fetchWithUserAgent(PUBLIC_PROMO_PAGE);
  if (!response.ok) {
    throw new Error(`ColruytApiKeyPageError_${response.status}`);
  }
  const html = await response.text();

  // Motif estimé — la clé est vraisemblablement injectée dans un <script> inline ou un attribut
  // data-* de la page publique. Plusieurs motifs candidats sont essayés dans l'ordre.
  const patterns = [
    /X-CG-APIKEY["']?\s*[:=]\s*["']([a-zA-Z0-9-_]+)["']/,
    /"apiKey"\s*:\s*"([a-zA-Z0-9-_]+)"/,
    /data-cg-apikey=["']([a-zA-Z0-9-_]+)["']/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  throw new Error('ColruytApiKeyExtractionFailed');
}

function mapColruytProduct(
  product: ColruytApiProductGuess,
  sourceBaseUrl: string,
): RawPromotion | null {
  const rawProductName = product.name ?? product.productName;
  const promoPrice = product.promoPrice ?? product.price;

  if (!rawProductName || promoPrice === undefined || promoPrice === null) {
    // Champ obligatoire manquant : rejeté ici (avant même Zod) car on ne peut pas construire de
    // RawPromotion valide. Compté comme rejet par l'appelant via la validation Zod si on le
    // laissait passer avec des valeurs factices — préférable de filtrer au plus tôt.
    return null;
  }

  return {
    rawProductName,
    category: product.category ?? product.categoryName ?? null,
    unitLabel: product.unit ?? product.packagingText ?? null,
    regularPrice: product.regularPrice ?? product.priceBeforeDiscount ?? null,
    promoPrice,
    discountPercent: product.discountPercentage ?? null,
    pricePerUnit: product.pricePerUnit ?? product.unitPrice ?? null,
    validFrom: product.validFrom ?? product.promotionStartDate ?? new Date().toISOString(),
    validTo: product.validTo ?? product.promotionEndDate ?? new Date().toISOString(),
    sourceUrl: product.url ?? sourceBaseUrl,
    originLabel: product.origin ?? product.countryOfOrigin ?? null,
  };
}
