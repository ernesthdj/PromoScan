/**
 * useRoutes — Calcul et sauvegarde d'itineraires optimises.
 * POST /routes/calculate, GET/POST/DELETE /routes/saved.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../config/api';
import type {
  CalculateRouteRequest,
  RouteResult,
  SaveRouteRequest,
  PaginatedData,
} from '../../shared/types/api';
import type { SavedRoute } from '../../shared/types/index';

const routeKeys = {
  saved: ['routes', 'saved'] as const,
};

/** Calculer un itineraire optimise (TSP + OpenRouteService) */
export function useCalculateRoute() {
  return useMutation({
    mutationFn: (data: CalculateRouteRequest) =>
      api.post<RouteResult>('/routes/calculate', data),
  });
}

/** Fetch itineraires sauvegardes (pagine) */
export function useSavedRoutes(page = 1, limit = 20) {
  return useQuery({
    queryKey: [...routeKeys.saved, { page, limit }],
    queryFn: () =>
      api.get<PaginatedData<SavedRoute>>(
        `/routes/saved?page=${page}&limit=${limit}`,
      ),
    staleTime: 60_000,
  });
}

/** Sauvegarder un itineraire */
export function useSaveRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SaveRouteRequest) =>
      api.post<SavedRoute>('/routes/saved', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: routeKeys.saved });
    },
  });
}

/** Supprimer un itineraire sauvegarde */
export function useDeleteRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<null>(`/routes/saved/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: routeKeys.saved });
    },
  });
}
