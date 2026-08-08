import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { validate } from '../middleware/validate';
import { authMiddleware } from '../middleware/auth';
import { matchSchema, recommendSchema } from '../../shared/schemas';
import { GetSuggestionsUseCase } from '../application/usecases/suggestions/GetSuggestionsUseCase';
import { UserRepository } from '../infrastructure/repositories/UserRepository';
import { ShoppingListRepository } from '../infrastructure/repositories/ShoppingListRepository';
import { PromotionRepository } from '../infrastructure/repositories/PromotionRepository';
import { StoreRepository } from '../infrastructure/repositories/StoreRepository';
import { FuseMatchingAdapter } from '../infrastructure/matching/FuseMatchingAdapter';

const router = Router();
router.use(authMiddleware);

function buildUseCase() {
  return new GetSuggestionsUseCase(
    new UserRepository(),
    new ShoppingListRepository(),
    new PromotionRepository(),
    new StoreRepository(),
    new FuseMatchingAdapter(),
  );
}

// POST /suggestions/match
router.post(
  '/match',
  validate({ body: matchSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const useCase = buildUseCase();
      const results = await useCase.match(req.userId!, req.body.listId, req.body.filters);
      res.json({ success: true, data: results, error: null });
    } catch (err) {
      next(err);
    }
  },
);

// POST /suggestions/recommend
router.post(
  '/recommend',
  validate({ body: recommendSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const useCase = buildUseCase();
      const results = await useCase.recommend(req.userId!, req.body.listId, req.body.filters);
      res.json({ success: true, data: results, error: null });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
