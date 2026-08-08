import type {
  CreateItemData,
  IShoppingListItemRepository,
  ShoppingListItemEntity,
  UpdateItemData,
} from '../../domain/entities';
import { prisma } from '../database/prisma';

export class ShoppingListItemRepository implements IShoppingListItemRepository {
  async findById(id: string): Promise<ShoppingListItemEntity | null> {
    const item = await prisma.shoppingListItem.findUnique({ where: { id } });
    return item ? this.toDomain(item as Record<string, unknown>) : null;
  }

  async findByListId(listId: string): Promise<ShoppingListItemEntity[]> {
    const items = await prisma.shoppingListItem.findMany({
      where: { listId },
      orderBy: [{ checked: 'asc' }, { createdAt: 'desc' }],
    });
    return items.map((i) => this.toDomain(i as Record<string, unknown>));
  }

  async findDuplicate(listId: string, productName: string): Promise<ShoppingListItemEntity | null> {
    const item = await prisma.shoppingListItem.findFirst({
      where: {
        listId,
        productName: { equals: productName, mode: 'insensitive' },
      },
    });
    return item ? this.toDomain(item as Record<string, unknown>) : null;
  }

  async create(data: CreateItemData): Promise<ShoppingListItemEntity> {
    const item = await prisma.shoppingListItem.create({
      data: {
        listId: data.listId,
        productName: data.productName,
        category: data.category,
        quantity: data.quantity,
      },
    });
    return this.toDomain(item as Record<string, unknown>);
  }

  async update(id: string, data: Partial<UpdateItemData>): Promise<ShoppingListItemEntity> {
    const item = await prisma.shoppingListItem.update({
      where: { id },
      data,
    });
    return this.toDomain(item as Record<string, unknown>);
  }

  async delete(id: string): Promise<void> {
    await prisma.shoppingListItem.delete({ where: { id } });
  }

  async uncheckAll(listId: string): Promise<void> {
    await prisma.shoppingListItem.updateMany({
      where: { listId },
      data: { checked: false },
    });
  }

  private toDomain(raw: Record<string, unknown>): ShoppingListItemEntity {
    return {
      id: raw.id as string,
      listId: raw.listId as string,
      productName: raw.productName as string,
      category: raw.category as ShoppingListItemEntity['category'],
      quantity: raw.quantity as number,
      checked: raw.checked as boolean,
      createdAt: raw.createdAt as Date,
    };
  }
}
