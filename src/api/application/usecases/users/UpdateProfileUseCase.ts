import type { IUserRepository, IGeocodeCache, UserEntity } from '../../../domain/entities';
import { NominatimCacheService } from '../../../infrastructure/external/NominatimCache';
import { AppError } from '../../../middleware/errorHandler';
import type { UpdateProfileInput } from '../../../../shared/schemas';

export class UpdateProfileUseCase {
  constructor(
    private userRepo: IUserRepository,
    private geocodeCache: IGeocodeCache,
  ) {}

  async execute(userId: string, input: UpdateProfileInput): Promise<UserEntity> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError(404, 'Utilisateur introuvable');
    }

    const updateData: Record<string, unknown> = {};

    // Geocoder si le code postal change
    if (input.zoneCodePostal && input.zoneCodePostal !== user.zoneCodePostal) {
      const geocodeService = new NominatimCacheService(this.geocodeCache);
      const geocoded = await geocodeService.geocode(input.zoneCodePostal);

      updateData.zoneCodePostal = input.zoneCodePostal;
      updateData.zoneCommune = geocoded?.commune ?? null;
      updateData.zoneLatitude = geocoded?.latitude ?? null;
      updateData.zoneLongitude = geocoded?.longitude ?? null;
    }

    // Mettre a jour les preferences de scoring
    if (input.preferences) {
      const currentPrefs = user.preferences;
      updateData.preferences = {
        w1: input.preferences.w1 ?? currentPrefs.w1,
        w2: input.preferences.w2 ?? currentPrefs.w2,
        w3: input.preferences.w3 ?? currentPrefs.w3,
      };
    }

    return this.userRepo.update(userId, updateData);
  }
}
