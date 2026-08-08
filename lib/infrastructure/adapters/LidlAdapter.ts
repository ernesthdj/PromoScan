// lib/infrastructure/adapters/LidlAdapter.ts
//
// Strategy: "headless" — US-F1-04. Lidl affiche des données riches (prix, %, prix/kg, dates,
// origine) via des composants JS rendus côté client, sans API interne clairement identifiée par
// le brainstorm (contrairement à Delhaize) — approche retenue : lecture du DOM rendu après
// hydratation JS (docs/FOUNDATION.md §9.1 : "hypothèse initiale de blocage infirmée, rendu
// headless (Playwright)").
//
// ============================================================================================
// SELFDOUBT — incertitudes non vérifiables depuis ce poste :
// ============================================================================================
// | Affirmation                                                        | Niveau      | Action |
// |------------------------------------------------------------------------|------------|--------|
// | Lidl.be affiche des données promo riches en conditions réelles         | ✅ Certain  | Constaté par l'Architecte (FOUNDATION §9.1) |
// | Les sélecteurs CSS ci-dessous correspondent au DOM réel                | ❌ Hypothèse| Aucun accès réseau sortant depuis ce poste — sélecteurs basés sur des conventions courantes (data-testid, classes BEM "product-grid-box") observées sur les sites Lidl internationaux à date de connaissance, non garantis pour lidl.be spécifiquement. **À ajuster impérativement au premier test réel** (US-F1-04 DoD) |
// | L'URL de la page listing promotions ci-dessous                        | ❌ Hypothèse| À confirmer/ajuster |
//
// US-F1-04 DoD ("Au moins une des deux enseignes headless testée de bout en bout") peut être
// satisfait par Delhaize OU Lidl selon le DoD FOUNDATION §9.1 — cette implémentation Lidl est
// donc un complément, pas un blocant si elle nécessite plus d'ajustement au premier test réel.
//
// Chemins disallow robots.txt Lidl (`*search?q=*`, `?offset=*`, `*sort=*`, `*id=*`, `*pageId=*`)
// jamais utilisés — seule l'URL de listing "segment de chemin" (vérifiée non-bloquante par
// l'Architecte, FOUNDATION §9.1) est navigée (US-F1-08).

import type { RawPromotion, StoreAdapter } from '../../domain/StoreAdapter';
import { closeHeadlessSession, launchHeadlessSession } from './headlessBrowser';

const PROMOTIONS_PATH = '/c/promotions-de-la-semaine/a10008067';
const NAVIGATION_TIMEOUT_MS = 45_000;
const RENDER_WAIT_MS = 5_000;

interface DomExtractedTile {
  name: string | null;
  promoPriceText: string | null;
  regularPriceText: string | null;
  pricePerUnitText: string | null;
  validityText: string | null;
  originText: string | null;
}

export function createLidlAdapter(baseUrl: string = process.env.LIDL_BASE_URL || ''): StoreAdapter {
  const rootUrl = baseUrl || 'https://www.lidl.be';

  return {
    chainSlug: 'lidl',
    strategy: 'headless',

    async fetchPromotions(): Promise<RawPromotion[]> {
      const session = await launchHeadlessSession(NAVIGATION_TIMEOUT_MS);

      try {
        await session.page.goto(`${rootUrl}${PROMOTIONS_PATH}`, {
          waitUntil: 'domcontentloaded',
          timeout: NAVIGATION_TIMEOUT_MS,
        });

        // Laisse le temps à l'hydratation JS de peupler la grille produit — pas d'attente
        // infinie, timeout explicite comme pour Delhaize (ARCHITECTURE §7).
        await session.page.waitForTimeout(RENDER_WAIT_MS);

        const tiles = await session.page.evaluate(extractTilesFromDom);

        return tiles
          .map((tile) => mapLidlTile(tile, rootUrl))
          .filter((item): item is RawPromotion => item !== null);
      } finally {
        await closeHeadlessSession(session);
      }
    },
  };
}

/**
 * Exécutée dans le contexte de la page (page.evaluate) — lecture seule du DOM déjà rendu par le
 * site lui-même, aucun script tiers/arbitraire injecté (US-F1-04 DoD : "seule la lecture des
 * données est effectuée").
 */
function extractTilesFromDom(): DomExtractedTile[] {
  const candidateSelectors = [
    '[data-testid="product-grid-box"]',
    '.product-grid-box',
    '.ret-o-card',
    '.product-item',
  ];

  let tiles: Element[] = [];
  for (const selector of candidateSelectors) {
    const found = Array.from(document.querySelectorAll(selector));
    if (found.length > 0) {
      tiles = found;
      break;
    }
  }

  return tiles.map((el) => {
    const text = (selector: string): string | null =>
      el.querySelector(selector)?.textContent?.trim() || null;

    return {
      name: text('[data-testid="product-title"]') || text('.product-grid-box__title') || text('h3'),
      promoPriceText:
        text('[data-testid="price-value"]') || text('.ret-o-price__value') || text('.price'),
      regularPriceText:
        text('[data-testid="price-strikethrough"]') || text('.ret-o-price__previous'),
      pricePerUnitText: text('[data-testid="price-per-unit"]') || text('.ret-o-price__unit'),
      validityText: text('[data-testid="validity"]') || text('.product-grid-box__validity'),
      originText: text('[data-testid="origin"]') || text('.product-grid-box__origin'),
    };
  });
}

function mapLidlTile(tile: DomExtractedTile, rootUrl: string): RawPromotion | null {
  const promoPrice = parsePrice(tile.promoPriceText);
  if (!tile.name || promoPrice === null) {
    return null;
  }

  const regularPrice = parsePrice(tile.regularPriceText);
  const { validFrom, validTo } = parseValidityRange(tile.validityText);

  return {
    rawProductName: tile.name,
    category: null,
    unitLabel: null,
    regularPrice,
    promoPrice,
    discountPercent: computeDiscountPercent(regularPrice, promoPrice),
    pricePerUnit: parsePrice(tile.pricePerUnitText),
    validFrom,
    validTo,
    sourceUrl: `${rootUrl}${PROMOTIONS_PATH}`,
    originLabel: tile.originText,
  };
}

function parsePrice(text: string | null): number | null {
  if (!text) return null;
  const normalized = text.replace(/[^\d,.\-]/g, '').replace(',', '.');
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
}

function computeDiscountPercent(regular: number | null, promo: number | null): number | null {
  if (!regular || !promo || regular <= 0) return null;
  return Math.round(((regular - promo) / regular) * 100);
}

function parseValidityRange(text: string | null): { validFrom: string; validTo: string } {
  const now = new Date();
  if (!text) {
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return { validFrom: now.toISOString(), validTo: in7Days.toISOString() };
  }

  const match = text.match(/(\d{1,2})[/.](\d{1,2}).{0,10}(\d{1,2})[/.](\d{1,2})/);
  if (match) {
    const [, fromDay, fromMonth, toDay, toMonth] = match;
    const year = now.getFullYear();
    return {
      validFrom: new Date(Date.UTC(year, Number(fromMonth) - 1, Number(fromDay))).toISOString(),
      validTo: new Date(Date.UTC(year, Number(toMonth) - 1, Number(toDay))).toISOString(),
    };
  }

  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { validFrom: now.toISOString(), validTo: in7Days.toISOString() };
}
