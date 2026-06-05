import type { CreateRouteData, IRouteRepository, SavedRouteEntity } from '../../domain/entities';
import { prisma } from '../database/prisma';

export class RouteRepository implements IRouteRepository {
  async findByUserId(userId: string, page: number, limit: number): Promise<{ items: SavedRouteEntity[]; total: number }> {
    const [items, total] = await Promise.all([
      prisma.savedRoute.findMany({
        where: { userId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.savedRoute.count({ where: { userId } }),
    ]);

    return {
      items: items.map((r) => this.toDomain(r as Record<string, unknown>)),
      total,
    };
  }

  async countByUserId(userId: string): Promise<number> {
    return prisma.savedRoute.count({ where: { userId } });
  }

  async create(data: CreateRouteData): Promise<SavedRouteEntity> {
    const route = await prisma.savedRoute.create({
      data: {
        userId: data.userId,
        name: data.name ?? null,
        stores: data.stores as object,
        estimatedSavings: data.estimatedSavings,
        geojson: data.geojson as object,
        estimatedDurationMin: data.estimatedDurationMin,
        estimatedDistanceKm: data.estimatedDistanceKm,
      },
    });
    return this.toDomain(route as Record<string, unknown>);
  }

  async delete(id: string): Promise<void> {
    await prisma.savedRoute.delete({ where: { id } });
  }

  async findById(id: string): Promise<SavedRouteEntity | null> {
    const route = await prisma.savedRoute.findUnique({ where: { id } });
    return route ? this.toDomain(route as Record<string, unknown>) : null;
  }

  private toDomain(raw: Record<string, unknown>): SavedRouteEntity {
    return {
      id: raw.id as string,
      userId: raw.userId as string,
      name: raw.name as string | null,
      stores: raw.stores as unknown,
      estimatedSavings: Number(raw.estimatedSavings),
      geojson: raw.geojson as unknown,
      estimatedDurationMin: raw.estimatedDurationMin as number | null,
      estimatedDistanceKm: raw.estimatedDistanceKm !== null ? Number(raw.estimatedDistanceKm) : null,
      createdAt: raw.createdAt as Date,
    };
  }
}
