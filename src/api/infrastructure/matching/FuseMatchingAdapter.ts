/**
 * FuseMatchingAdapter — Implementation IFuzzyMatcher avec Fuse.js.
 *
 * Adaptateur infrastructure : la dependance fuse.js reste ici,
 * le domain ne connait que l'interface IFuzzyMatcher.
 */

import Fuse from 'fuse.js';
import type { IFuzzyMatcher, FuzzySearchResult } from '../../domain/services/MatchingService';
import type { PromotionWithStoreEntity } from '../../domain/entities';

const FUSE_OPTIONS: Fuse.IFuseOptions<PromotionWithStoreEntity> = {
  keys: [
    { name: 'productName', weight: 0.7 },
  ],
  distance: 100,
  isCaseSensitive: false,
  useExtendedSearch: true,
  includeScore: true,
  minMatchCharLength: 2,
};

export class FuseMatchingAdapter implements IFuzzyMatcher<PromotionWithStoreEntity> {
  search(
    items: PromotionWithStoreEntity[],
    query: string,
    threshold: number,
  ): FuzzySearchResult<PromotionWithStoreEntity>[] {
    const fuse = new Fuse(items, { ...FUSE_OPTIONS, threshold });

    return fuse
      .search(query)
      .filter((r) => r.score !== undefined && r.score <= threshold)
      .map((r) => ({
        item: r.item,
        score: r.score ?? 1,
      }));
  }
}
