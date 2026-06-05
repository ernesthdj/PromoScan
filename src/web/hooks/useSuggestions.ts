/**
 * useSuggestions — Fetch suggestions matching promos/liste de courses.
 * POST vers /suggestions/match et /suggestions/recommend.
 */

import { useMutation } from '@tanstack/react-query';
import { api } from '../config/api';
import type {
  MatchRequest,
  MatchResult,
  RecommendRequest,
  StoreRecommendation,
} from '../../shared/types/api';

/** Matching : renvoie les promos trouvees pour chaque article de la liste */
export function useMatchSuggestions() {
  return useMutation({
    mutationFn: (data: MatchRequest) =>
      api.post<MatchResult[]>('/suggestions/match', data),
  });
}

/** Recommandation : scoring par enseigne avec tri */
export function useRecommendSuggestions() {
  return useMutation({
    mutationFn: (data: RecommendRequest) =>
      api.post<StoreRecommendation[]>('/suggestions/recommend', data),
  });
}
