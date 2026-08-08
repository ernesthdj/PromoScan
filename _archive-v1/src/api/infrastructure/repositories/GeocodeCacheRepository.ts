import type { GeocodeCacheEntry, IGeocodeCache, PostalCodeEntry } from '../../domain/entities';
import { prisma } from '../database/prisma';

export class GeocodeCacheRepository implements IGeocodeCache {
  async findByPostalCode(postalCode: string): Promise<GeocodeCacheEntry | null> {
    const entry = await prisma.geocodeCache.findUnique({
      where: { postalCode },
    });
    return entry ? this.toDomain(entry as Record<string, unknown>) : null;
  }

  async upsert(data: GeocodeCacheEntry): Promise<void> {
    await prisma.geocodeCache.upsert({
      where: { postalCode: data.postalCode },
      update: {
        commune: data.commune,
        latitude: data.latitude,
        longitude: data.longitude,
        cachedAt: data.cachedAt,
      },
      create: {
        postalCode: data.postalCode,
        commune: data.commune,
        latitude: data.latitude,
        longitude: data.longitude,
      },
    });
  }

  async searchPostalCodes(query: string): Promise<PostalCodeEntry[]> {
    const results = await prisma.geocodeCache.findMany({
      where: {
        OR: [
          { postalCode: { startsWith: query } },
          { commune: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 10,
      orderBy: { postalCode: 'asc' },
    });

    return results.map((r) => ({
      postalCode: r.postalCode,
      commune: r.commune,
    }));
  }

  private toDomain(raw: Record<string, unknown>): GeocodeCacheEntry {
    return {
      postalCode: raw.postalCode as string,
      commune: raw.commune as string,
      latitude: raw.latitude as number,
      longitude: raw.longitude as number,
      cachedAt: raw.cachedAt as Date,
    };
  }
}
