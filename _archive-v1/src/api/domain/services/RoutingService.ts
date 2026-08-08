/**
 * RoutingService — TSP (Travelling Salesman Problem) heuristique nearest neighbor.
 *
 * Optimise l'ordre de visite de 2-6 magasins pour minimiser la distance.
 * Complexite : O(n^2) avec n = nombre de magasins — instantane pour n <= 6.
 *
 * Aucune dependance framework — logique pure.
 */

export interface RoutablePoint {
  id: string;
  lat: number;
  lng: number;
}

/**
 * Formule de Haversine : calcule la distance en km entre deux points GPS.
 */
export function haversine(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371; // Rayon de la Terre en km
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/**
 * Nearest Neighbor TSP — ordonne les magasins par proximite en partant de l'origine.
 *
 * L'algorithme est glouton : a chaque etape, on visite le magasin non visite le plus proche.
 * Le ratio d'approximation est ~1.5x l'optimum, mais pour 2-6 stops la difference est negligeable.
 *
 * @param origin - Point de depart (domicile de l'utilisateur)
 * @param stores - Liste des magasins a visiter (2-6)
 * @returns Magasins dans l'ordre de visite optimal (heuristique)
 */
export function nearestNeighborTSP<T extends RoutablePoint>(
  origin: { lat: number; lng: number },
  stores: T[],
): T[] {
  if (stores.length <= 1) return [...stores];

  const unvisited = [...stores];
  const ordered: T[] = [];
  let current = origin;

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const d = haversine(current, unvisited[i]);
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    }

    const nearest = unvisited[nearestIdx];
    ordered.push(nearest);
    current = { lat: nearest.lat, lng: nearest.lng };
    unvisited.splice(nearestIdx, 1);
  }

  return ordered;
}

/**
 * Calcule la distance totale d'un parcours (sans retour a l'origine).
 */
export function totalRouteDistance(
  origin: { lat: number; lng: number },
  orderedStores: RoutablePoint[],
): number {
  if (orderedStores.length === 0) return 0;

  let total = haversine(origin, orderedStores[0]);

  for (let i = 0; i < orderedStores.length - 1; i++) {
    total += haversine(orderedStores[i], orderedStores[i + 1]);
  }

  return total;
}
