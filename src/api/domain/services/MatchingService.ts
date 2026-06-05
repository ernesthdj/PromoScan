/**
 * MatchingService — Fuzzy matching entre articles de la liste et promotions actives.
 *
 * Utilise fuse.js pour la correspondance approximative.
 * Ex : "poulet" matche "filet de poulet", "blanc de poulet".
 *
 * Dependance : fuse.js (librairie pure, pas un framework).
 */

import Fuse from 'fuse.js';
import type { PromotionWithStoreEntity, ShoppingListItemEntity, StoreEntity } from '../entities';

export interface MatchedPromotion {
  promotion: PromotionWithStoreEntity;
  store: StoreEntity;
  fuzzyScore: number;
}

export interface ItemMatchResult {
  listItem: {
    id: string;
    productName: string;
    category: string;
  };
  matches: MatchedPromotion[];
}

/** Seuil de matching par defaut (0 = exact, 1 = tout matche) */
const DEFAULT_THRESHOLD = 0.4;

const FUSE_OPTIONS: Fuse.IFuseOptions<PromotionWithStoreEntity> = {
  keys: [
    { name: 'productName', weight: 0.7 },
  ],
  threshold: DEFAULT_THRESHOLD,
  distance: 100,
  isCaseSensitive: false,
  useExtendedSearch: true,
  includeScore: true,
  minMatchCharLength: 2,
};

/**
 * Matche les articles d'une liste de courses avec les promotions actives.
 * Retourne pour chaque article les promotions qui correspondent.
 */
export function matchPromotions(
  listItems: ShoppingListItemEntity[],
  activePromotions: PromotionWithStoreEntity[],
  threshold: number = DEFAULT_THRESHOLD,
): ItemMatchResult[] {
  const options = { ...FUSE_OPTIONS, threshold };
  const fuse = new Fuse(activePromotions, options);

  return listItems.map((item) => ({
    listItem: {
      id: item.id,
      productName: item.productName,
      category: item.category,
    },
    matches: fuse
      .search(item.productName)
      .filter((r) => r.score !== undefined && r.score <= threshold)
      .map((r) => ({
        promotion: r.item,
        store: r.item.store,
        fuzzyScore: 1 - (r.score ?? 1), // Inverser : 1 = correspondance parfaite
      })),
  }));
}

/**
 * Agrege les matchs par magasin.
 * Retourne pour chaque magasin : le nombre d'articles matches et l'economie totale.
 */
export function aggregateMatchesByStore(
  matchResults: ItemMatchResult[],
): Map<string, { storeId: string; matchedItems: number; totalSavings: number; promotionIds: string[] }> {
  const storeMap = new Map<
    string,
    { storeId: string; matchedItems: number; totalSavings: number; promotionIds: string[] }
  >();

  for (const result of matchResults) {
    // Pour chaque article, on prend la meilleure promo par magasin (eviter les doublons)
    const bestByStore = new Map<string, MatchedPromotion>();
    for (const match of result.matches) {
      const existing = bestByStore.get(match.store.id);
      if (!existing || match.fuzzyScore > existing.fuzzyScore) {
        bestByStore.set(match.store.id, match);
      }
    }

    for (const [storeId, match] of bestByStore) {
      const entry = storeMap.get(storeId) ?? {
        storeId,
        matchedItems: 0,
        totalSavings: 0,
        promotionIds: [],
      };

      entry.matchedItems += 1;

      if (match.promotion.originalPrice !== null) {
        entry.totalSavings += match.promotion.originalPrice - match.promotion.promoPrice;
      }

      entry.promotionIds.push(match.promotion.id);
      storeMap.set(storeId, entry);
    }
  }

  return storeMap;
}
