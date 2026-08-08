import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { validate } from '../middleware/validate';
import { authMiddleware } from '../middleware/auth';
import {
  calculateRouteSchema,
  saveRouteSchema,
  paginationSchema,
  uuidParamSchema,
} from '../../shared/schemas';
import { CalculateRouteUseCase } from '../application/usecases/routes/CalculateRouteUseCase';
import { SaveRouteUseCase } from '../application/usecases/routes/SaveRouteUseCase';
import { StoreRepository } from '../infrastructure/repositories/StoreRepository';
import { UserRepository } from '../infrastructure/repositories/UserRepository';
import { RouteRepository } from '../infrastructure/repositories/RouteRepository';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authMiddleware);

// POST /routes/calculate
router.post(
  '/calculate',
  validate({ body: calculateRouteSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const useCase = new CalculateRouteUseCase(
        new StoreRepository(),
        new UserRepository(),
      );
      const result = await useCase.execute(req.userId!, req.body);
      res.json({ success: true, data: result, error: null });
    } catch (err) {
      next(err);
    }
  },
);

// GET /routes/saved
router.get(
  '/saved',
  validate({ query: paginationSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const repo = new RouteRepository();
      const query = req.query as unknown as { page: number; limit: number };
      const result = await repo.findByUserId(req.userId!, query.page, query.limit);

      res.json({
        success: true,
        data: {
          items: result.items,
          total: result.total,
          page: query.page,
          totalPages: Math.ceil(result.total / query.limit),
        },
        error: null,
      });
    } catch (err) {
      next(err);
    }
  },
);

// POST /routes/saved
router.post(
  '/saved',
  validate({ body: saveRouteSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const useCase = new SaveRouteUseCase(new RouteRepository());
      const route = await useCase.execute(req.userId!, req.body);
      res.status(201).json({ success: true, data: route, error: null });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /routes/saved/:id
router.delete(
  '/saved/:id',
  validate({ params: uuidParamSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const repo = new RouteRepository();
      const route = await repo.findById(req.params.id);

      if (!route || route.userId !== req.userId) {
        throw new AppError(404, 'Itineraire introuvable');
      }

      await repo.delete(req.params.id);
      res.json({ success: true, data: null, error: null });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
