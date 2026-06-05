/**
 * NominatimCache — Geocoding avec cache BDD.
 *
 * Strategie :
 * 1. Chercher dans la table geocode_cache
 * 2. Si trouve et < 90 jours : retourner le cache
 * 3. Sinon : appeler Nominatim, stocker, retourner
 *
 * Rate limit Nominatim : 1 req/s, User-Agent obligatoire.
 */

import type { GeocodeCacheEntry, IGeocodeCache } from '../../domain/entities';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const CACHE_TTL_DAYS = 90;
const USER_AGENT = 'PromoScan/1.0 (contact@promoscan.be)';

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

export class NominatimCacheService {
  constructor(private geocodeCache: IGeocodeCache) {}

  /**
   * Geocode un code postal belge. Utilise le cache en priorite.
   */
  async geocode(postalCode: string): Promise<GeocodeCacheEntry | null> {
    // 1. Chercher dans le cache
    const cached = await this.geocodeCache.findByPostalCode(postalCode);

    if (cached) {
      const cacheAge = Date.now() - cached.cachedAt.getTime();
      const ttlMs = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;

      if (cacheAge < ttlMs) {
        return cached;
      }
    }

    // 2. Appeler Nominatim
    const result = await this.fetchNominatim(postalCode);

    if (!result) {
      return null;
    }

    // 3. Stocker dans le cache
    const entry: GeocodeCacheEntry = {
      postalCode,
      commune: result.commune,
      latitude: result.latitude,
      longitude: result.longitude,
      cachedAt: new Date(),
    };

    await this.geocodeCache.upsert(entry);

    return entry;
  }

  /**
   * Recherche des codes postaux belges (autocompletion).
   */
  async searchPostalCodes(query: string) {
    return this.geocodeCache.searchPostalCodes(query);
  }

  /**
   * Appelle Nominatim pour geocoder un code postal belge.
   */
  private async fetchNominatim(
    postalCode: string,
  ): Promise<{ commune: string; latitude: number; longitude: number } | null> {
    const url = new URL('/search', NOMINATIM_BASE_URL);
    url.searchParams.set('postalcode', postalCode);
    url.searchParams.set('country', 'Belgium');
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');

    const response = await fetch(url.toString(), {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return null;
    }

    const results = (await response.json()) as NominatimResult[];

    if (results.length === 0) {
      return null;
    }

    const first = results[0];
    // Extraire la commune du display_name (format : "code, commune, province, Belgium")
    const parts = first.display_name.split(',').map((p) => p.trim());
    const commune = parts.length > 1 ? parts[1] : parts[0];

    return {
      commune,
      latitude: parseFloat(first.lat),
      longitude: parseFloat(first.lon),
    };
  }
}
