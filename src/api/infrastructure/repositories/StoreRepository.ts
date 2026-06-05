import type { IStoreRepository, StoreEntity } from '../../domain/entities';
import type { Brand } from '../../../shared/enums';
import { prisma } from '../database/prisma';

export class StoreRepository implements IStoreRepository {
  async findById(id: string): Promise<StoreEntity | null> {
    const store = await prisma.store.findUnique({ where: { id } });
    return store ? this.toDomain(store as Record<string, unknown>) : null;
  }

  async findByIds(ids: string[]): Promise<StoreEntity[]> {
    const stores = await prisma.store.findMany({
      where: { id: { in: ids }, isActive: true },
    });
    return stores.map((s) => this.toDomain(s as Record<string, unknown>));
  }

  async findByBrand(brand: Brand): Promise<StoreEntity[]> {
    const stores = await prisma.store.findMany({
      where: { brand, isActive: true },
    });
    return stores.map((s) => this.toDomain(s as Record<string, unknown>));
  }

  async findNearby(lat: number, lng: number, radiusKm: number): Promise<StoreEntity[]> {
    // PostGIS ST_DWithin pour la recherche par rayon.
    // Fallback : calcul Haversine en SQL si PostGIS n'est pas disponible.
    const stores = await prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT *
      FROM "Store"
      WHERE "isActive" = true
        AND (
          6371 * acos(
            cos(radians(${lat}))
            * cos(radians("latitude"))
            * cos(radians("longitude") - radians(${lng}))
            + sin(radians(${lat}))
            * sin(radians("latitude"))
          )
        ) <= ${radiusKm}
      ORDER BY (
        6371 * acos(
          cos(radians(${lat}))
          * cos(radians("latitude"))
          * cos(radians("longitude") - radians(${lng}))
          + sin(radians(${lat}))
          * sin(radians("latitude"))
        )
      ) ASC
    `;
    return stores.map((s) => this.toDomain(s));
  }

  private toDomain(raw: Record<string, unknown>): StoreEntity {
    return {
      id: raw.id as string,
      name: raw.name as string,
      brand: raw.brand as StoreEntity['brand'],
      address: raw.address as string,
      latitude: raw.latitude as number,
      longitude: raw.longitude as number,
      openingHours: raw.openingHours as Record<string, string> | null,
      isActive: raw.isActive as boolean,
      createdAt: raw.createdAt as Date,
    };
  }
}
