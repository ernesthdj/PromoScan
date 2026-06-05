import type {
  IShoppingListRepository,
  IShoppingListItemRepository,
  ShoppingListItemEntity,
} from '../../../domain/entities';
import { AppError } from '../../../middleware/errorHandler';
import type { AddItemInput } from '../../../../shared/schemas';
import { ProductCategory } from '../../../../shared/enums';

export class AddItemUseCase {
  constructor(
    private listRepo: IShoppingListRepository,
    private itemRepo: IShoppingListItemRepository,
  ) {}

  async execute(
    userId: string,
    listId: string,
    input: AddItemInput,
  ): Promise<ShoppingListItemEntity> {
    // Verifier que la liste appartient a l'utilisateur
    const list = await this.listRepo.findById(listId);
    if (!list || list.userId !== userId) {
      throw new AppError(404, 'Liste introuvable');
    }

    // Gestion des doublons : incrementer la quantite au lieu de creer une ligne
    const duplicate = await this.itemRepo.findDuplicate(listId, input.productName);
    if (duplicate) {
      return this.itemRepo.update(duplicate.id, {
        quantity: duplicate.quantity + (input.quantity ?? 1),
      });
    }

    return this.itemRepo.create({
      listId,
      productName: input.productName,
      category: input.category ?? ProductCategory.AUTRES,
      quantity: input.quantity ?? 1,
    });
  }
}
