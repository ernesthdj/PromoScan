import type { IUserRepository, IRefreshTokenRepository } from '../../../domain/entities';
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiry,
} from '../../../infrastructure/security/jwt';
import { AppError } from '../../../middleware/errorHandler';

interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

export class RefreshUseCase {
  constructor(
    private userRepo: IUserRepository,
    private refreshTokenRepo: IRefreshTokenRepository,
  ) {}

  async execute(rawRefreshToken: string): Promise<RefreshResult> {
    // 1. Hasher le token pour le chercher en BDD
    const tokenHash = hashRefreshToken(rawRefreshToken);
    const storedToken = await this.refreshTokenRepo.findByHash(tokenHash);

    if (!storedToken) {
      throw new AppError(401, 'Refresh token invalide');
    }

    // 2. Verifier l'expiration
    if (storedToken.expiresAt < new Date()) {
      await this.refreshTokenRepo.deleteByHash(tokenHash);
      throw new AppError(401, 'Refresh token expire');
    }

    // 3. Rotation : supprimer l'ancien token
    await this.refreshTokenRepo.deleteByHash(tokenHash);

    // 4. Recuperer l'utilisateur
    const user = await this.userRepo.findById(storedToken.userId);
    if (!user) {
      throw new AppError(401, 'Utilisateur introuvable');
    }

    // 5. Generer de nouveaux tokens
    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const newRawRefreshToken = generateRefreshToken();
    const newTokenHash = hashRefreshToken(newRawRefreshToken);

    await this.refreshTokenRepo.create({
      userId: user.id,
      tokenHash: newTokenHash,
      expiresAt: getRefreshTokenExpiry(),
    });

    return {
      accessToken,
      refreshToken: newRawRefreshToken,
    };
  }
}
