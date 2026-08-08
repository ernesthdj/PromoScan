import type {
  IShoppingListRepository,
  IShoppingListItemRepository,
} from '../../../domain/entities';
import { AppError } from '../../../middleware/errorHandler';

export class DeleteItemUseCase {
  constructor(
    private listRepo: IShoppingListRepository,
    private itemRepo: IShoppingListItemRepository,
  ) {}

  async execute(userId: string, listId: string, itemId: string): Promise<void> {
    const list = await this.listRepo.findById(listId);
    if (!list || list.userId !== userId) {
      throw new AppError(404, 'Liste introuvable');
    }

    const item = await this.itemRepo.findById(itemId);
    if (!item || item.listId !== listId) {
      throw new AppError(404, 'Article introuvable');
    }

    await this.itemRepo.delete(itemId);
  }
}
