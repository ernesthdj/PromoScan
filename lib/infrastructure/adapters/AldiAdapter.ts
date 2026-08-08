// lib/infrastructure/adapters/AldiAdapter.ts
//
// Strategy: "html" — US-F1-03. Aldi expose ses promotions en HTML server-rendered classique sur
// `aldi.be/fr/offres.html` (pas de rendu JS nécessaire — confirmé par docs/FOUNDATION.md §9.1).
//
// ============================================================================================
// SELFDOUBT — incertitudes techniques non vérifiables depuis ce poste :
// ============================================================================================
// | Affirmation                                                    | Niveau      | Action |
// |-------------------------------------------------------------------|------------|--------|
// | La page est du HTML server-rendered sans JS nécessaire            | ✅ Certain  | Vérifié par l'Architecte en conditions réelles (FOUNDATION §9.1) |
// | Les sélecteurs CSS ci-dessous correspondent à la structure DOM réelle | ❌ Hypothèse | Aucun accès réseau sortant depuis ce poste pour inspecter le DOM réel — les sélecteurs sont des suppositions basées sur les conventions courantes des sites Aldi internationaux (structure "tuile produit" avec nom/prix/prix-promo). **À ajuster impérativement lors du premier test réel** (US-F1-03 DoD) |
// | Le format des dates de validité affichées (ex. "du 10/08 au 16/08") | ❌ Hypothèse | Regex de parsing best-effort ci-dessous, à ajuster selon le format réel observé |
//
// Respect explicite du robots.txt Aldi (US-F1-08 DoD) : cet adaptateur ne requête que la page
// listée (`/fr/offres.html`), jamais `/mds/`, `?*filters`, `?*jobId=` (chemins/paramètres
// disallow — docs/FOUNDATION.md §9.1).

import * as cheerio from 'cheerio';
import type { RawPromotion, StoreAdapter } from '../../domain/StoreAdapter';
import { fetchWithUserAgent } from './httpClient';

export function createAldiAdapter(baseUrl: string = process.env.ALDI_BASE_URL || ''): StoreAdapter {
  const offresUrl = baseUrl || 'https://www.aldi.be/fr/offres.html';

  return {
    chainSlug: 'aldi',
    strategy: 'html',

    async fetchPromotions(): Promise<RawPromotion[]> {
      const response = await fetchWithUserAgent(offresUrl);
      if (!response.ok) {
        throw new Error(`AldiHttpError_${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      const results: RawPromotion[] = [];

      // Sélecteurs candidats, essayés dans l'ordre — cf. selfdoubt ci-dessus. Les templates Aldi
      // internationaux (Aldi Nord/Süd) utilisent couramment des classes de type "mod-article-tile"
      // ou "tile-item" pour une carte produit en page listing d'offres.
      const candidateSelectors = [
        '.mod-article-tile',
        '.product-tile',
        '.tile-item',
        '[data-testid="product-tile"]',
      ];

      // Sélecteur CSS combiné (union) — évite d'introduire un état mutable typé "vide au départ"
      // uniquement pour choisir le premier sélecteur qui matche ; un seul de ces sélecteurs
      // matchera en pratique sur le DOM réel (ce sont des hypothèses alternatives, pas des
      // sélecteurs destinés à se combiner).
      const $tiles = $(candidateSelectors.join(', '));

      $tiles.each((_, el) => {
        const $el = $(el);

        const rawProductName = firstNonEmpty(
          $el.find('.mod-article-tile__title').text(),
          $el.find('.product-tile__name').text(),
          $el.find('[data-testid="product-name"]').text(),
          $el.find('h3, h2').first().text(),
        );

        const promoPriceText = firstNonEmpty(
          $el.find('.price__value').text(),
          $el.find('.product-tile__price').text(),
          $el.find('[data-testid="price"]').text(),
        );

        const regularPriceText = firstNonEmpty(
          $el.find('.price__previous').text(),
          $el.find('.product-tile__price--old').text(),
        );

        const validityText = firstNonEmpty(
          $el.find('.mod-article-tile__validity').text(),
          $el.find('.product-tile__validity').text(),
          $el.find('[data-testid="validity"]').text(),
        );

        const promoPrice = parsePrice(promoPriceText);
        if (!rawProductName || promoPrice === null) {
          return; // champ obligatoire manquant : rejeté (US-F1-03 DoD)
        }

        const { validFrom, validTo } = parseValidityRange(validityText);

        results.push({
          rawProductName: rawProductName.trim(),
          category: null, // pas de catégorie structurée fiable identifiée sur ce type de listing
          unitLabel: firstNonEmpty($el.find('.mod-article-tile__unit').text()) || null,
          regularPrice: parsePrice(regularPriceText),
          promoPrice,
          discountPercent: computeDiscountPercent(parsePrice(regularPriceText), promoPrice),
          pricePerUnit: null,
          validFrom,
          validTo,
          sourceUrl: offresUrl,
          originLabel: null,
        });
      });

      return results;
    },
  };
}

function firstNonEmpty(...values: string[]): string {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return '';
}

function parsePrice(text: string): number | null {
  if (!text) return null;
  const normalized = text.replace(/[^\d,.\-]/g, '').replace(',', '.');
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
}

function computeDiscountPercent(regular: number | null, promo: number | null): number | null {
  if (!regular || !promo || regular <= 0) return null;
  return Math.round(((regular - promo) / regular) * 100);
}

/**
 * Parsing best-effort d'une plage de validité au format "du DD/MM au DD/MM" (ou variantes).
 * Retombe sur la semaine courante si aucun format reconnu — évite de faire échouer toute
 * l'enseigne pour un format de date inattendu (RG-3 tolérance de panne), au prix d'une date
 * potentiellement imprécise à corriger lors du premier test réel.
 */
function parseValidityRange(text: string): { validFrom: string; validTo: string } {
  const match = text.match(/(\d{1,2})[/.](\d{1,2}).{0,10}(\d{1,2})[/.](\d{1,2})/);
  const year = new Date().getFullYear();

  if (match) {
    const [, fromDay, fromMonth, toDay, toMonth] = match;
    const validFrom = new Date(Date.UTC(year, Number(fromMonth) - 1, Number(fromDay))).toISOString();
    const validTo = new Date(Date.UTC(year, Number(toMonth) - 1, Number(toDay))).toISOString();
    return { validFrom, validTo };
  }

  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { validFrom: now.toISOString(), validTo: in7Days.toISOString() };
}
