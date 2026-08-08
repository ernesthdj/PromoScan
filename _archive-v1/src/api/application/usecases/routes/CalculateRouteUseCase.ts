/**
 * CalculateRouteUseCase — Calcul d'itineraire optimise multi-magasins.
 *
 * Couvre US-021 (calcul TSP), US-022 (GeoJSON pour Leaflet), US-023 (resume).
 */

import type { IStoreRepository, IUserRepository, StoreEntity } from '../../../domain/entities';
import { nearestNeighborTSP } from '../../../domain/services/RoutingService';
import { getDirections, type RouteDirections } from '../../../infrastructure/external/OpenRouteService';
import { AppError } from '../../../middleware/errorHandler';
import type { CalculateRouteInput } from '../../../../shared/schemas';

export interface CalculateRouteResult {
  orderedStores: (StoreEntity & { articles: string[] })[];
  totalSavings: number;
  totalDurationMin: number;
  totalDistanceKm: number;
  geojson: RouteDirections['geojson'];
  legs: Array<{
    from: string;
    to: string;
    durationMin: number;
    distanceKm: number;
  }>;
}

export class CalculateRouteUseCase {
  constructor(
    private storeRepo: IStoreRepository,
    private userRepo: IUserRepository,
  ) {}

  async execute(userId: string, input: CalculateRouteInput): Promise<CalculateRouteResult> {
    // 1. Recuperer les magasins
    const stores = await this.storeRepo.findByIds(input.storeIds);

    if (stores.length === 0) {
      throw new AppError(400, 'Aucun magasin valide trouve');
    }

    // Exclure les magasins avec coordonnees manquantes (US-025)
    const validStores = stores.filter((s) => s.latitude && s.longitude);

    if (validStores.length === 0) {
      throw new AppError(400, 'Aucun magasin avec coordonnees valides');
    }

    // 2. Determiner l'origine (domicile ou coordonnees fournies)
    let origin = input.origin;

    if (!origin) {
      const user = await this.userRepo.findById(userId);
      if (!user || !user.zoneLatitude || !user.zoneLongitude) {
        throw new AppError(400, 'Zone geographique non definie. Renseignez votre code postal.');
      }
      origin = { lat: user.zoneLatitude, lng: user.zoneLongitude };
    }

    // 3. Optimiser l'ordre de visite (TSP nearest neighbor)
    const routableStores = validStores.map((s) => ({
      ...s,
      id: s.id,
      lat: s.latitude,
      lng: s.longitude,
    }));

    const orderedStores = nearestNeighborTSP(origin, routableStores);

    // 4. Calculer l'itineraire via OpenRouteService
    // Waypoints : domicile -> stores ordonnes -> domicile (retour)
    const waypoints = [
      origin,
      ...orderedStores.map((s) => ({ lat: s.latitude, lng: s.longitude })),
      origin, // Retour au domicile
    ];

    let directions: RouteDirections;
    try {
      directions = await getDirections(waypoints);
    } catch {
      throw new AppError(503, 'Service de calcul d\'itineraire temporairement indisponible. Reessayez dans quelques minutes.');
    }

    // 5. Construire les troncons (legs)
    const legs: CalculateRouteResult['legs'] = [];
    const waypointNames = [
      'Domicile',
      ...orderedStores.map((s) => s.name),
      'Domicile',
    ];

    for (let i = 0; i < directions.legs.length; i++) {
      legs.push({
        from: waypointNames[i],
        to: waypointNames[i + 1],
        durationMin: Math.round(directions.legs[i].durationMin * 10) / 10,
        distanceKm: Math.round(directions.legs[i].distanceKm * 10) / 10,
      });
    }

    return {
      orderedStores: orderedStores.map((s) => ({
        ...s,
        articles: [], // Rempli par le frontend a partir des suggestions
      })),
      totalSavings: 0, // Calcule par le frontend a partir des suggestions
      totalDurationMin: Math.round(directions.totalDurationMin * 10) / 10,
      totalDistanceKm: Math.round(directions.totalDistanceKm * 10) / 10,
      geojson: directions.geojson,
      legs,
    };
  }
}
