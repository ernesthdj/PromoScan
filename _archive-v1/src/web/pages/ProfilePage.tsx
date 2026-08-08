/**
 * ProfilePage — Profil utilisateur, zone geo, preferences.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../stores/authStore';
import { useUpdateZone } from '../hooks/useGeolocation';
import { useAuth } from '../hooks/useAuth';
import { useSavedRoutes, useDeleteRoute } from '../hooks/useRoutes';
import { Button } from '../components/atoms/Button';
import { Input } from '../components/atoms/Input';
import { Checkbox } from '../components/atoms/Checkbox';
import { formatPrice, formatDateShort } from '../utils/formatters';
import { ALL_BRANDS, BRAND_LABELS } from '../utils/constants';
import { api } from '../config/api';
import type { UserPublic } from '../../shared/types/api';

const zoneSchema = z.object({
  zoneCodePostal: z.string().regex(/^[1-9]\d{3}$/, 'Code postal belge invalide'),
});

type ZoneFormData = z.infer<typeof zoneSchema>;

export function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { setUser } = useAuthStore();
  const { logout } = useAuth();
  const updateZone = useUpdateZone();
  const { data: savedRoutes } = useSavedRoutes();
  const deleteRoute = useDeleteRoute();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ZoneFormData>({
    resolver: zodResolver(zoneSchema),
    defaultValues: { zoneCodePostal: user?.zoneCodePostal ?? '' },
  });

  function onZoneSubmit(data: ZoneFormData) {
    updateZone.mutate({ zoneCodePostal: data.zoneCodePostal });
  }

  async function handleDeleteAccount() {
    const password = prompt('Entrez votre mot de passe pour confirmer la suppression');
    if (!password) return;

    try {
      await api.delete<null>('/users/me', { password });
      useAuthStore.getState().clearAuth();
      navigate('/');
    } catch {
      // Error handled by api client
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <h1 className="text-2xl font-bold text-neutral-800">Mon profil</h1>

      {/* Zone geographique */}
      <section className="p-4 bg-white rounded-lg border border-neutral-200">
        <h2 className="text-lg font-semibold text-neutral-800 mb-3">Zone geographique</h2>
        <form onSubmit={handleSubmit(onZoneSubmit)} className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              label="Code postal"
              maxLength={4}
              inputMode="numeric"
              error={errors.zoneCodePostal?.message}
              {...register('zoneCodePostal')}
            />
          </div>
          <Button type="submit" size="sm" loading={updateZone.isPending}>
            Modifier
          </Button>
        </form>
        {user?.zoneCommune && (
          <p className="mt-2 text-sm text-neutral-500">
            Commune : {user.zoneCommune}
          </p>
        )}
      </section>

      {/* Preferences */}
      <section className="p-4 bg-white rounded-lg border border-neutral-200">
        <h2 className="text-lg font-semibold text-neutral-800 mb-3">Preferences</h2>
        <p className="text-sm text-neutral-500 mb-3">
          Priorite du scoring : Budget ({(user?.preferences.w1 ?? 0.5) * 100}%) /
          Distance ({(user?.preferences.w2 ?? 0.3) * 100}%) /
          Couverture ({(user?.preferences.w3 ?? 0.2) * 100}%)
        </p>
      </section>

      {/* Compte */}
      <section className="p-4 bg-white rounded-lg border border-neutral-200">
        <h2 className="text-lg font-semibold text-neutral-800 mb-3">Compte</h2>
        <p className="text-sm text-neutral-600 mb-3">
          Email : {user?.email}
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigate('/profile')}>
            Changer l'email
          </Button>
          <Button variant="secondary" size="sm" onClick={() => navigate('/profile')}>
            Changer le mot de passe
          </Button>
        </div>
      </section>

      {/* Itineraires sauvegardes */}
      <section className="p-4 bg-white rounded-lg border border-neutral-200">
        <h2 className="text-lg font-semibold text-neutral-800 mb-3">
          Itineraires sauvegardes
        </h2>
        {savedRoutes?.items && savedRoutes.items.length > 0 ? (
          <ul className="divide-y divide-neutral-100">
            {savedRoutes.items.slice(0, 3).map((route) => (
              <li key={route.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-neutral-700">
                  {formatDateShort(route.createdAt)} —{' '}
                  {route.stores.length} magasins —{' '}
                  {formatPrice(route.estimatedSavings)}
                </span>
                <button
                  onClick={() => deleteRoute.mutate(route.id)}
                  className="text-neutral-400 hover:text-error-500 text-xs"
                >
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-500">Aucun itineraire sauvegarde.</p>
        )}
      </section>

      {/* Danger zone */}
      <section className="p-4 bg-red-50 rounded-lg border border-red-200">
        <h2 className="text-lg font-semibold text-red-800 mb-2">Zone de danger</h2>
        <p className="text-sm text-red-700 mb-3">
          Toutes vos donnees seront definitivement supprimees.
        </p>
        <Button variant="danger" size="sm" onClick={handleDeleteAccount}>
          Supprimer mon compte
        </Button>
      </section>

      <Button variant="ghost" onClick={logout} className="self-start">
        Se deconnecter
      </Button>
    </div>
  );
}
