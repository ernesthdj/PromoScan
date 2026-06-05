import type {
  IPromotionRepository,
  PromotionEntity,
  PromotionQueryFilters,
  PromotionWithStoreEntity,
} from '../../domain/entities';
import { prisma } from '../database/prisma';

export class PromotionRepository implements IPromotionRepository {
  async findActive(filters: PromotionQueryFilters): Promise<{ items: PromotionEntity[]; total: number }> {
    const now = new Date();
    const where = {
      startDate: { lte: now },
      endDate: { gte: now },
      ...(filters.category && { category: filters.category }),
      ...(filters.brand && { store: { brand: filters.brand } }),
    };

    const [items, total] = await Promise.all([
      prisma.promotion.findMany({
        where,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        orderBy: { startDate: 'desc' },
        include: { store: true },
      }),
      prisma.promotion.count({ where }),
    ]);

    return {
      items: items.map((p) => this.toDomain(p as Record<string, unknown>)),
      total,
    };
  }

  async findById(id: string): Promise<PromotionWithStoreEntity | null> {
    const promo = await prisma.promotion.findUnique({
      where: { id },
      include: { store: true },
    });
    return promo ? this.toWithStoreDomain(promo as Record<string, unknown>) : null;
  }

  async findActiveByCategory(categories?: string[]): Promise<PromotionWithStoreEntity[]> {
    const now = new Date();
    const promos = await prisma.promotion.findMany({
      where: {
        startDate: { lte: now },
        endDate: { gte: now },
        ...(categories && categories.length > 0 && { category: { in: categories } }),
      },
      include: { store: true },
    });
    return promos.map((p) => this.toWithStoreDomain(p as Record<string, unknown>));
  }

  async findActiveForMatching(): Promise<PromotionWithStoreEntity[]> {
    const now = new Date();
    const promos = await prisma.promotion.findMany({
      where: {
        startDate: { lte: now },
        endDate: { gte: now },
        store: { isActive: true },
      },
      include: { store: true },
    });
    return promos.map((p) => this.toWithStoreDomain(p as Record<string, unknown>));
  }

  private toDomain(raw: Record<string, unknown>): PromotionEntity {
    return {
      id: raw.id as string,
      storeId: raw.storeId as string,
      productId: raw.productId as string | null,
      scanJobId: raw.scanJobId as string,
      productName: raw.productName as string,
      category: raw.category as PromotionEntity['category'],
      originalPrice: raw.originalPrice !== null ? Number(raw.originalPrice) : null,
      promoPrice: Number(raw.promoPrice),
      discountPct: raw.discountPct as number | null,
      startDate: raw.startDate as Date,
      endDate: raw.endDate as Date,
      sourceUrl: raw.sourceUrl as string | null,
      rawText: raw.rawText as string | null,
      createdAt: raw.createdAt as Date,
    };
  }

  private toWithStoreDomain(raw: Record<string, unknown>): PromotionWithStoreEntity {
    const store = raw.store as Record<string, unknown>;
    return {
      ...this.toDomain(raw),
      store: {
        id: store.id as string,
        name: store.name as string,
        brand: store.brand as PromotionWithStoreEntity['store']['brand'],
        address: store.address as string,
        latitude: store.latitude as number,
        longitude: store.longitude as number,
        openingHours: store.openingHours as Record<string, string> | null,
        isActive: store.isActive as boolean,
        createdAt: store.createdAt as Date,
      },
    };
  }
}
