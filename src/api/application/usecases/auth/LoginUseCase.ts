import type { IUserRepository, IRefreshTokenRepository } from '../../../domain/entities';
import { verifyPassword } from '../../../infrastructure/security/hash';
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiry,
} from '../../../infrastructure/security/jwt';
import { AppError } from '../../../middleware/errorHandler';
import type { LoginInput } from '../../../../shared/schemas';

interface LoginResult {
  user: {
    id: string;
    email: string;
    role: string;
    zoneCodePostal: string | null;
    zoneCommune: string | null;
  };
  accessToken: string;
  refreshToken: string;
}

export class LoginUseCase {
  constructor(
    private userRepo: IUserRepository,
    private refreshTokenRepo: IRefreshTokenRepository,
  ) {}

  async execute(input: LoginInput): Promise<LoginResult> {
    // 1. Chercher l'utilisateur par email
    const user = await this.userRepo.findByEmail(input.email);

    // Message generique pour ne pas distinguer email inconnu / mot de passe faux
    if (!user) {
      throw new AppError(401, 'Identifiants invalides');
    }

    // 2. Verifier le mot de passe
    const isValid = await verifyPassword(input.password, user.passwordHash);

    if (!isValid) {
      throw new AppError(401, 'Identifiants invalides');
    }

    // 3. Generer les tokens
    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const rawRefreshToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(rawRefreshToken);

    await this.refreshTokenRepo.create({
      userId: user.id,
      tokenHash,
      expiresAt: getRefreshTokenExpiry(),
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        zoneCodePostal: user.zoneCodePostal,
        zoneCommune: user.zoneCommune,
      },
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }
}
