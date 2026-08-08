import type {
  IShoppingListRepository,
  ShoppingListEntity,
  ShoppingListWithItemsEntity,
} from '../../domain/entities';
import { prisma } from '../database/prisma';

export class ShoppingListRepository implements IShoppingListRepository {
  async findById(id: string): Promise<ShoppingListEntity | null> {
    const list = await prisma.shoppingList.findUnique({ where: { id } });
    return list ? this.toDomain(list) : null;
  }

  async findByIdWithItems(id: string): Promise<ShoppingListWithItemsEntity | null> {
    const list = await prisma.shoppingList.findUnique({
      where: { id },
      include: {
        items: { orderBy: [{ checked: 'asc' }, { createdAt: 'desc' }] },
      },
    });

    if (!list) return null;

    return {
      ...this.toDomain(list),
      items: (list.items as Record<string, unknown>[]).map((item) => ({
        id: item.id as string,
        listId: item.listId as string,
        productName: item.productName as string,
        category: item.category as ShoppingListWithItemsEntity['items'][0]['category'],
        quantity: item.quantity as number,
        checked: item.checked as boolean,
        createdAt: item.createdAt as Date,
      })),
    };
  }

  async findByUserId(userId: string): Promise<ShoppingListEntity[]> {
    const lists = await prisma.shoppingList.findMany({
      where: { userId, isArchived: false },
      orderBy: { updatedAt: 'desc' },
    });
    return lists.map((l) => this.toDomain(l as Record<string, unknown>));
  }

  async countByUserId(userId: string): Promise<number> {
    return prisma.shoppingList.count({
      where: { userId, isArchived: false },
    });
  }

  async create(data: { userId: string; name: string }): Promise<ShoppingListEntity> {
    const list = await prisma.shoppingList.create({
      data: { userId: data.userId, name: data.name },
    });
    return this.toDomain(list as Record<string, unknown>);
  }

  async update(id: string, data: { name?: string; isArchived?: boolean }): Promise<ShoppingListEntity> {
    const list = await prisma.shoppingList.update({
      where: { id },
      data,
    });
    return this.toDomain(list as Record<string, unknown>);
  }

  async delete(id: string): Promise<void> {
    await prisma.shoppingList.delete({ where: { id } });
  }

  private toDomain(raw: Record<string, unknown>): ShoppingListEntity {
    return {
      id: raw.id as string,
      userId: raw.userId as string,
      name: raw.name as string,
      isArchived: raw.isArchived as boolean,
      createdAt: raw.createdAt as Date,
      updatedAt: raw.updatedAt as Date,
    };
  }
}
