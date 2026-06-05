/**
 * GetSuggestionsUseCase — Matching promos/liste + recommandation par enseigne.
 *
 * Couvre US-017 (matching fuzzy), US-018 (scoring multi-criteres), US-019 (filtres).
 */

import type {
  IShoppingListRepository,
  IPromotionRepository,
  IStoreRepository,
  IUserRepository,
  PromotionWithStoreEntity,
} from '../../../domain/entities';
import { matchPromotions, aggregateMatchesByStore, type ItemMatchResult } from '../../../domain/services/MatchingService';
import { rankStores, type ScoringWeights, type StoreScore } from '../../../domain/services/ScoringService';
import { haversine } from '../../../domain/services/RoutingService';
import { AppError } from '../../../middleware/errorHandler';
import type { SuggestionFilters } from '../../../../shared/types/api';

export interface SuggestionMatchResult {
  listItem: { id: string; productName: string; category: string };
  matches: {
    promotion: PromotionWithStoreEntity;
    store: { id: string; name: string; brand: string; address: string };
    fuzzyScore: number;
  }[];
}

export interface StoreRecommendationResult {
  store: { id: string; name: string; brand: string; address: string; latitude: number; longitude: number };
  matchedItems: number;
  totalSavings: number;
  distanceKm: number;
  score: number;
  promotions: PromotionWithStoreEntity[];
}

export class GetSuggestionsUseCase {
  constructor(
    private userRepo: IUserRepository,
    private listRepo: IShoppingListRepository,
    private promotionRepo: IPromotionRepository,
    private storeRepo: IStoreRepository,
  ) {}

  /**
   * Matching : retourne pour chaque article de la liste les promos qui correspondent.
   */
  async match(userId: string, listId: string, filters?: SuggestionFilters): Promise<ItemMatchResult[]> {
    // Verifier l'ownership de la liste
    const list = await this.listRepo.findByIdWithItems(listId);
    if (!list || list.userId !== userId) {
      throw new AppError(404, 'Liste introuvable');
    }

    if (list.items.length === 0) {
      return [];
    }

    // Recuperer les promos actives (avec filtres optionnels)
    let promos = await this.promotionRepo.findActiveForMatching();

    // Appliquer les filtres
    if (filters?.categories && filters.categories.length > 0) {
      promos = promos.filter((p) => filters.categories!.includes(p.category));
    }
    if (filters?.brands && filters.brands.length > 0) {
      promos = promos.filter((p) => filters.brands!.includes(p.store.brand));
    }
    if (filters?.day) {
      const dayDate = new Date(filters.day);
      promos = promos.filter(
        (p) => p.startDate <= dayDate && p.endDate >= dayDate,
      );
    }

    // Fuzzy matching
    return matchPromotions(list.items, promos);
  }

  /**
   * Recommandation : scoring par enseigne avec distance, economies, couverture.
   */
  async recommend(
    userId: string,
    listId: string,
    filters?: SuggestionFilters,
  ): Promise<StoreRecommendationResult[]> {
    // Recuperer les matchs
    const matchResults = await this.match(userId, listId, filters);

    // Recuperer l'utilisateur pour ses coordonnees et preferences
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError(404, 'Utilisateur introuvable');
    }

    if (!user.zoneLatitude || !user.zoneLongitude) {
      throw new AppError(400, 'Zone geographique non definie. Renseignez votre code postal dans votre profil.');
    }

    const list = await this.listRepo.findByIdWithItems(listId);
    if (!list) {
      throw new AppError(404, 'Liste introuvable');
    }

    // Agreger par magasin
    const storeAggregation = aggregateMatchesByStore(matchResults);

    if (storeAggregation.size === 0) {
      return [];
    }

    // Calculer les distances et scores
    const userCoords = { lat: user.zoneLatitude, lng: user.zoneLongitude };
    const weights: ScoringWeights = user.preferences;

    // Recuperer les stores complets
    const storeIds = Array.from(storeAggregation.keys());
    const stores = await this.storeRepo.findByIds(storeIds);
    const storeMap = new Map(stores.map((s) => [s.id, s]));

    // Preparer les inputs de scoring
    const scoringInputs = Array.from(storeAggregation.entries())
      .filter(([storeId]) => storeMap.has(storeId))
      .map(([storeId, agg]) => {
        const store = storeMap.get(storeId)!;
        const distance = haversine(userCoords, { lat: store.latitude, lng: store.longitude });

        return {
          storeId,
          savings: agg.totalSavings,
          distanceKm: distance,
          matchedItems: agg.matchedItems,
        };
      });

    const ranked = rankStores(scoringInputs, list.items.length, weights);

    // Construire la reponse
    const allPromos = await this.promotionRepo.findActiveForMatching();
    const promoMap = new Map(allPromos.map((p) => [p.id, p]));

    return ranked.map((r: StoreScore) => {
      const store = storeMap.get(r.storeId)!;
      const agg = storeAggregation.get(r.storeId)!;
      const promos = agg.promotionIds
        .map((id) => promoMap.get(id))
        .filter((p): p is PromotionWithStoreEntity => p !== undefined);

      return {
        store: {
          id: store.id,
          name: store.name,
          brand: store.brand,
          address: store.address,
          latitude: store.latitude,
          longitude: store.longitude,
        },
        matchedItems: r.matchedItems,
        totalSavings: r.savings,
        distanceKm: r.distanceKm,
        score: r.score,
        promotions: promos,
      };
    });
  }
}
