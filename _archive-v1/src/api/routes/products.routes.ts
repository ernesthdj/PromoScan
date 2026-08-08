import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { validate } from '../middleware/validate';
import { authMiddleware } from '../middleware/auth';
import { productSearchSchema } from '../../shared/schemas';
import { ProductRepository } from '../infrastructure/repositories/ProductRepository';

const router = Router();
router.use(authMiddleware);

// GET /products/search?q=
router.get(
  '/search',
  validate({ query: productSearchSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const repo = new ProductRepository();
      const results = await repo.search(req.query.q as string, 10);
      res.json({ success: true, data: results, error: null });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
