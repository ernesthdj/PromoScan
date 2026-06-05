/**
 * OpenRouteService Client — API routing pour calcul d'itineraires.
 * Documentation : https://openrouteservice.org/dev/#/api-docs
 *
 * Utilise l'endpoint /v2/directions/driving-car pour les itineraires voiture.
 * Free tier : 2500 requetes/jour.
 */

import { env } from '../../config/env';

interface OrsCoordinate {
  lat: number;
  lng: number;
}

interface OrsDirectionsResponse {
  type: string;
  features: Array<{
    type: string;
    geometry: {
      type: string;
      coordinates: number[][];
    };
    properties: {
      segments: Array<{
        distance: number; // metres
        duration: number; // secondes
      }>;
      summary: {
        distance: number;
        duration: number;
      };
    };
  }>;
}

export interface RouteDirections {
  geojson: {
    type: 'FeatureCollection';
    features: unknown[];
  };
  totalDistanceKm: number;
  totalDurationMin: number;
  legs: Array<{
    distanceKm: number;
    durationMin: number;
  }>;
}

const ORS_BASE_URL = 'https://api.openrouteservice.org';

/**
 * Calcule un itineraire entre plusieurs points via OpenRouteService.
 *
 * @param waypoints - Liste ordonnee de coordonnees (min 2 points)
 * @returns GeoJSON de l'itineraire + distance + duree par troncon
 */
export async function getDirections(waypoints: OrsCoordinate[]): Promise<RouteDirections> {
  if (waypoints.length < 2) {
    throw new Error('Au moins 2 waypoints requis pour calculer un itineraire');
  }

  // ORS attend les coordonnees en [lng, lat] (pas [lat, lng])
  const coordinates = waypoints.map((w) => [w.lng, w.lat]);

  const response = await fetch(`${ORS_BASE_URL}/v2/directions/driving-car/geojson`, {
    method: 'POST',
    headers: {
      Authorization: env.ORS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ coordinates }),
    signal: AbortSignal.timeout(15000), // 15s timeout
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouteService error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as OrsDirectionsResponse;

  if (!data.features || data.features.length === 0) {
    throw new Error('Aucun itineraire trouve par OpenRouteService');
  }

  const feature = data.features[0];
  const segments = feature.properties.segments;

  return {
    geojson: {
      type: 'FeatureCollection',
      features: data.features,
    },
    totalDistanceKm: feature.properties.summary.distance / 1000,
    totalDurationMin: feature.properties.summary.duration / 60,
    legs: segments.map((seg) => ({
      distanceKm: seg.distance / 1000,
      durationMin: seg.duration / 60,
    })),
  };
}
