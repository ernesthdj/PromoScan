import type { IUserRepository, IRefreshTokenRepository } from '../../../domain/entities';
import { verifyPassword } from '../../../infrastructure/security/hash';
import { AppError } from '../../../middleware/errorHandler';

export class DeleteAccountUseCase {
  constructor(
    private userRepo: IUserRepository,
    private refreshTokenRepo: IRefreshTokenRepository,
  ) {}

  async execute(userId: string, password: string): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError(404, 'Utilisateur introuvable');
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new AppError(401, 'Mot de passe incorrect');
    }

    // Supprimer tous les refresh tokens puis le compte
    // La suppression cascade les listes de courses, routes, etc. (via Prisma schema)
    await this.refreshTokenRepo.deleteAllForUser(userId);
    await this.userRepo.delete(userId);
  }
}
