import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { validate } from '../middleware/validate';
import { authMiddleware } from '../middleware/auth';
import { geocodeLimiter } from '../middleware/rateLimiter';
import { postalCodeSearchSchema, geocodeSchema } from '../../shared/schemas';
import { GeocodeCacheRepository } from '../infrastructure/repositories/GeocodeCacheRepository';
import { NominatimCacheService } from '../infrastructure/external/NominatimCache';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authMiddleware);

// GET /geo/postal-codes?q=
router.get(
  '/postal-codes',
  validate({ query: postalCodeSearchSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const repo = new GeocodeCacheRepository();
      const results = await repo.searchPostalCodes(req.query.q as string);
      res.json({ success: true, data: results, error: null });
    } catch (err) {
      next(err);
    }
  },
);

// GET /geo/geocode?postal_code=
router.get(
  '/geocode',
  geocodeLimiter,
  validate({ query: geocodeSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const service = new NominatimCacheService(new GeocodeCacheRepository());
      const result = await service.geocode(req.query.postal_code as string);

      if (!result) {
        throw new AppError(404, 'Code postal introuvable');
      }

      res.json({
        success: true,
        data: {
          lat: result.latitude,
          lng: result.longitude,
          commune: result.commune,
        },
        error: null,
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
