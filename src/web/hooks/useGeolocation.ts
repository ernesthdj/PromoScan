/**
 * useGeolocation — Hook pour la zone geographique utilisateur.
 * Recherche de codes postaux belges et geocoding.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../config/api';
import { useAuthStore } from '../stores/authStore';
import type {
  GeocodeResult,
  PostalCodeResult,
  UpdateProfileRequest,
} from '../../shared/types/api';
import type { UserPublic } from '../../shared/types/api';

/** Recherche de codes postaux belges (autocompletion) */
export function usePostalCodeSearch(query: string) {
  return useQuery({
    queryKey: ['geo', 'postal-codes', query],
    queryFn: () =>
      api.get<PostalCodeResult[]>(
        `/geo/postal-codes?q=${encodeURIComponent(query)}`,
      ),
    enabled: query.length >= 2,
    staleTime: 5 * 60_000,
  });
}

/** Geocoder un code postal vers coordonnees */
export function useGeocode(postalCode: string | undefined) {
  return useQuery({
    queryKey: ['geo', 'geocode', postalCode],
    queryFn: () =>
      api.get<GeocodeResult>(`/geo/geocode?postal_code=${postalCode}`),
    enabled: !!postalCode && postalCode.length === 4,
    staleTime: 24 * 60 * 60_000, // 24h — codes postaux ne bougent pas
  });
}

/** Mettre a jour la zone geographique du profil */
export function useUpdateZone() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) =>
      api.patch<UserPublic>('/users/me', data),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['geo'] });
    },
  });
}
