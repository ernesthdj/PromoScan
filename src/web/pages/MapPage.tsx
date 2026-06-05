/**
 * MapPage — Carte Leaflet + resume itineraire.
 * Layout split 62/38 desktop (ratio phi), empile mobile.
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useCalculateRoute, useSaveRoute } from '../hooks/useRoutes';
import { useAuthStore } from '../stores/authStore';
import { MapView } from '../components/organisms/MapView';
import { RouteSummary } from '../components/organisms/RouteSummary';
import { EmptyState } from '../components/molecules/EmptyState';
import { Spinner } from '../components/atoms/Spinner';
import { Button } from '../components/atoms/Button';
import type { Brand } from '../../shared/enums';

export function MapPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const storeIdsParam = searchParams.get('stores');

  const calculateRoute = useCalculateRoute();
  const saveRoute = useSaveRoute();
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    if (storeIdsParam) {
      const storeIds = storeIdsParam.split(',');
      calculateRoute.mutate({
        storeIds,
        origin: user?.zoneLatitude && user?.zoneLongitude
          ? { lat: user.zoneLatitude, lng: user.zoneLongitude }
          : undefined,
      });
    }
  }, [storeIdsParam]);

  const route = calculateRoute.data;

  // Centre par defaut : Bruxelles
  const center: [number, number] = [
    user?.zoneLatitude ?? 50.8503,
    user?.zoneLongitude ?? 4.3517,
  ];

  // Erreur
  if (calculateRoute.isError) {
    return (
      <EmptyState
        icon={<AlertTriangle size={48} />}
        title="Service temporairement indisponible"
        description="Le calcul d'itineraire a echoue. Veuillez reessayer."
        ctaLabel="Reessayer"
        ctaAction={() => {
          if (storeIdsParam) {
            calculateRoute.mutate({
              storeIds: storeIdsParam.split(','),
              origin: user?.zoneLatitude && user?.zoneLongitude
                ? { lat: user.zoneLatitude, lng: user.zoneLongitude }
                : undefined,
            });
          }
        }}
        secondaryLabel="Retour aux suggestions"
        secondaryAction={() => navigate('/suggestions')}
      />
    );
  }

  // Pas de stores selectionnes
  if (!storeIdsParam) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-neutral-800">Mon itineraire</h1>
        <div className="h-[400px] sm:h-[500px] rounded-lg overflow-hidden">
          <MapView center={center} markers={[]} />
        </div>
        <EmptyState
          icon={<AlertTriangle size={48} />}
          title="Aucun magasin selectionne"
          description="Selectionnez des magasins depuis les suggestions pour calculer un itineraire."
          ctaLabel="Voir les suggestions"
          ctaAction={() => navigate('/suggestions')}
        />
      </div>
    );
  }

  // Chargement
  if (calculateRoute.isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Spinner size="lg" />
        <p className="text-sm text-neutral-500">Calcul de l'itineraire en cours...</p>
      </div>
    );
  }

  // Markers
  const markers = route?.orderedStores.map((store) => ({
    id: store.id,
    lat: store.latitude,
    lng: store.longitude,
    name: store.name,
    brand: store.brand as Brand,
    articles: store.articles,
  })) ?? [];

  // Route coordinates from GeoJSON
  const routeCoords: [number, number][] = [];
  if (route?.geojson) {
    for (const feature of route.geojson.features) {
      const geom = feature.geometry;
      if (geom.type === 'LineString' && Array.isArray(geom.coordinates)) {
        for (const coord of geom.coordinates as [number, number][]) {
          routeCoords.push([coord[1], coord[0]]); // GeoJSON is lng,lat -> Leaflet needs lat,lng
        }
      }
    }
  }

  function handleSave() {
    if (!route || !storeIdsParam) return;
    saveRoute.mutate(
      {
        storeIds: storeIdsParam.split(','),
        geojson: route.geojson,
        estimatedSavings: route.totalSavings,
        durationMin: route.totalDurationMin,
        distanceKm: route.totalDistanceKm,
      },
      { onSuccess: () => setHasSaved(true) },
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-neutral-800">Mon itineraire</h1>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Carte (62% desktop) */}
        <div className="sm:w-[62%] h-[50vh] sm:h-[70vh] rounded-lg overflow-hidden">
          <MapView
            center={center}
            markers={markers}
            routeCoordinates={routeCoords}
          />
        </div>

        {/* Resume (38% desktop) */}
        <div className="sm:w-[38%]">
          {route && (
            <RouteSummary
              stops={route.orderedStores.map((store, i) => ({
                storeId: store.id,
                storeName: store.name,
                storeBrand: store.brand as Brand,
                items: store.articles.map((a) => ({
                  name: a,
                  discountPct: 0,
                  savings: 0,
                })),
                totalSavings: route.totalSavings / route.orderedStores.length,
                travelTimeMin: route.legs[i]?.durationMin ?? 0,
              }))}
              totalDistanceKm={route.totalDistanceKm}
              totalDurationMin={route.totalDurationMin}
              totalSavings={route.totalSavings}
              returnTimeMin={route.legs[route.legs.length - 1]?.durationMin}
              onSave={hasSaved ? undefined : handleSave}
              isSaving={saveRoute.isPending}
            />
          )}
          {hasSaved && (
            <p className="mt-3 text-sm text-primary-600 font-medium text-center">
              Itineraire sauvegarde !
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
