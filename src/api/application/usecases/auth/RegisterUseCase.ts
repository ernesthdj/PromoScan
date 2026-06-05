import type { IUserRepository, IRefreshTokenRepository, IGeocodeCache } from '../../../domain/entities';
import { hashPassword } from '../../../infrastructure/security/hash';
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiry,
} from '../../../infrastructure/security/jwt';
import { NominatimCacheService } from '../../../infrastructure/external/NominatimCache';
import { AppError } from '../../../middleware/errorHandler';
import type { RegisterInput } from '../../../../shared/schemas';

interface RegisterResult {
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

export class RegisterUseCase {
  constructor(
    private userRepo: IUserRepository,
    private refreshTokenRepo: IRefreshTokenRepository,
    private geocodeCache: IGeocodeCache,
  ) {}

  async execute(input: RegisterInput): Promise<RegisterResult> {
    // 1. Verifier que l'email n'est pas deja pris
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      // Message generique pour ne pas reveler si le compte existe (anti-enumeration)
      throw new AppError(409, 'Impossible de creer ce compte');
    }

    // 2. Hasher le mot de passe
    const passwordHash = await hashPassword(input.password);

    // 3. Geocoder le code postal si fourni
    let zoneCommune: string | undefined;
    let zoneLatitude: number | undefined;
    let zoneLongitude: number | undefined;

    if (input.zoneCodePostal) {
      const geocodeService = new NominatimCacheService(this.geocodeCache);
      const geocoded = await geocodeService.geocode(input.zoneCodePostal);

      if (geocoded) {
        zoneCommune = geocoded.commune;
        zoneLatitude = geocoded.latitude;
        zoneLongitude = geocoded.longitude;
      }
    }

    // 4. Creer l'utilisateur
    const user = await this.userRepo.create({
      email: input.email,
      passwordHash,
      zoneCodePostal: input.zoneCodePostal,
      zoneCommune,
      zoneLatitude,
      zoneLongitude,
      rgpdConsent: input.rgpdConsent,
    });

    // 5. Generer les tokens
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
