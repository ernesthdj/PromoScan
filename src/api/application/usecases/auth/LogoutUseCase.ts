import type { IRefreshTokenRepository } from '../../../domain/entities';
import { hashRefreshToken } from '../../../infrastructure/security/jwt';

export class LogoutUseCase {
  constructor(private refreshTokenRepo: IRefreshTokenRepository) {}

  async execute(rawRefreshToken: string): Promise<void> {
    const tokenHash = hashRefreshToken(rawRefreshToken);
    await this.refreshTokenRepo.deleteByHash(tokenHash);
  }
}
