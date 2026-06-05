import type { IProductRepository, ProductEntity } from '../../domain/entities';
import { prisma } from '../database/prisma';

export class ProductRepository implements IProductRepository {
  async search(query: string, limit: number = 10): Promise<ProductEntity[]> {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { aliases: { has: query.toLowerCase() } },
        ],
      },
      take: limit,
      orderBy: { name: 'asc' },
    });
    return products.map((p) => this.toDomain(p as Record<string, unknown>));
  }

  async findByName(name: string): Promise<ProductEntity | null> {
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { name: { equals: name, mode: 'insensitive' } },
          { aliases: { has: name.toLowerCase() } },
        ],
      },
    });
    return product ? this.toDomain(product as Record<string, unknown>) : null;
  }

  private toDomain(raw: Record<string, unknown>): ProductEntity {
    return {
      id: raw.id as string,
      name: raw.name as string,
      category: raw.category as ProductEntity['category'],
      aliases: raw.aliases as string[],
      unit: raw.unit as string | null,
      createdAt: raw.createdAt as Date,
    };
  }
}
