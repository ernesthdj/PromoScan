import type { IShoppingListRepository, ShoppingListEntity } from '../../../domain/entities';
import { AppError } from '../../../middleware/errorHandler';

const MAX_LISTS_PER_USER = 20;

export class CreateListUseCase {
  constructor(private listRepo: IShoppingListRepository) {}

  async execute(userId: string, name: string): Promise<ShoppingListEntity> {
    // Verifier la limite de listes actives
    const count = await this.listRepo.countByUserId(userId);
    if (count >= MAX_LISTS_PER_USER) {
      throw new AppError(
        400,
        `Limite de ${MAX_LISTS_PER_USER} listes atteinte. Supprimez une liste existante.`,
      );
    }

    return this.listRepo.create({ userId, name });
  }
}
