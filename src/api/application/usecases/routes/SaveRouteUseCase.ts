import type { IRouteRepository, SavedRouteEntity } from '../../../domain/entities';
import { AppError } from '../../../middleware/errorHandler';
import type { SaveRouteInput } from '../../../../shared/schemas';

const MAX_SAVED_ROUTES = 50;

export class SaveRouteUseCase {
  constructor(private routeRepo: IRouteRepository) {}

  async execute(userId: string, input: SaveRouteInput): Promise<SavedRouteEntity> {
    const count = await this.routeRepo.countByUserId(userId);
    if (count >= MAX_SAVED_ROUTES) {
      throw new AppError(400, `Limite de ${MAX_SAVED_ROUTES} itineraires sauvegardes atteinte.`);
    }

    return this.routeRepo.create({
      userId,
      name: input.name,
      stores: input.storeIds,
      estimatedSavings: input.estimatedSavings,
      geojson: input.geojson,
      estimatedDurationMin: input.durationMin,
      estimatedDistanceKm: input.distanceKm,
    });
  }
}
