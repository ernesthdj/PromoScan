/**
 * usePromotions — Fetch des promotions actives avec filtres et pagination.
 * Utilise TanStack Query avec cache 5 minutes (promos changent peu en journee).
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '../config/api';
import type { Promotion, PromotionWithStore } from '../../shared/types/index';
import type { PaginatedData } from '../../shared/types/api';
import type { Brand, ProductCategory } from '../../shared/enums';

interface PromotionQueryParams {
  category?: ProductCategory;
  brand?: Brand;
  page?: number;
  limit?: number;
}

const promoKeys = {
  all: ['promotions'] as const,
  list: (params: PromotionQueryParams) => ['promotions', 'list', params] as const,
  detail: (id: string) => ['promotions', id] as const,
};

/** Fetch des promotions actives avec filtres et pagination */
export function usePromotions(params: PromotionQueryParams = {}) {
  const queryParams = new URLSearchParams();

  if (params.category) queryParams.set('category', params.category);
  if (params.brand) queryParams.set('brand', params.brand);
  if (params.page) queryParams.set('page', String(params.page));
  if (params.limit) queryParams.set('limit', String(params.limit));

  const queryString = queryParams.toString();
  const endpoint = `/promotions${queryString ? `?${queryString}` : ''}`;

  return useQuery({
    queryKey: promoKeys.list(params),
    queryFn: () => api.get<PaginatedData<Promotion>>(endpoint),
    staleTime: 5 * 60_000, // 5 minutes
  });
}

/** Fetch le detail d'une promotion avec son magasin */
export function usePromotionDetail(id: string | undefined) {
  return useQuery({
    queryKey: promoKeys.detail(id ?? ''),
    queryFn: () => api.get<PromotionWithStore>(`/promotions/${id}`),
    enabled: !!id,
    staleTime: 5 * 60_000,
  });
}

/** Recherche autocompletion produits (min 2 chars) */
export function useProductSearch(query: string) {
  return useQuery({
    queryKey: ['products', 'search', query],
    queryFn: () =>
      api.get<Array<{ id: string; name: string; category: string }>>(
        `/products/search?q=${encodeURIComponent(query)}`,
      ),
    enabled: query.length >= 2,
    staleTime: 60_000,
  });
}
