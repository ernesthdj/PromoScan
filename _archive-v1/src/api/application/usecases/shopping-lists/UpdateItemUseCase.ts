import type {
  IShoppingListRepository,
  IShoppingListItemRepository,
  ShoppingListItemEntity,
} from '../../../domain/entities';
import { AppError } from '../../../middleware/errorHandler';
import type { UpdateItemInput } from '../../../../shared/schemas';

export class UpdateItemUseCase {
  constructor(
    private listRepo: IShoppingListRepository,
    private itemRepo: IShoppingListItemRepository,
  ) {}

  async execute(
    userId: string,
    listId: string,
    itemId: string,
    input: UpdateItemInput,
  ): Promise<ShoppingListItemEntity> {
    // Verifier que la liste appartient a l'utilisateur
    const list = await this.listRepo.findById(listId);
    if (!list || list.userId !== userId) {
      throw new AppError(404, 'Liste introuvable');
    }

    // Verifier que l'item appartient a la liste
    const item = await this.itemRepo.findById(itemId);
    if (!item || item.listId !== listId) {
      throw new AppError(404, 'Article introuvable');
    }

    return this.itemRepo.update(itemId, input);
  }
}
