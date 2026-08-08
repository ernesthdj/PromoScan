import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { validate } from '../middleware/validate';
import { authMiddleware } from '../middleware/auth';
import { promotionFilterSchema, uuidParamSchema } from '../../shared/schemas';
import { PromotionRepository } from '../infrastructure/repositories/PromotionRepository';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authMiddleware);

// GET /promotions
router.get(
  '/',
  validate({ query: promotionFilterSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const repo = new PromotionRepository();
      const query = req.query as unknown as {
        page: number;
        limit: number;
        category?: string;
        brand?: string;
      };

      const result = await repo.findActive({
        page: query.page,
        limit: query.limit,
        category: query.category as undefined,
        brand: query.brand as undefined,
      });

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

// GET /promotions/:id
router.get(
  '/:id',
  validate({ params: uuidParamSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const repo = new PromotionRepository();
      const promo = await repo.findById(req.params.id);

      if (!promo) {
        throw new AppError(404, 'Promotion introuvable');
      }

      res.json({ success: true, data: promo, error: null });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
