import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { validate } from '../middleware/validate';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { scanJobFilterSchema, uuidParamSchema, triggerScanSchema } from '../../shared/schemas';
import { ScanJobRepository } from '../infrastructure/repositories/ScanJobRepository';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authMiddleware, adminMiddleware);

// GET /admin/scan-jobs
router.get(
  '/',
  validate({ query: scanJobFilterSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const repo = new ScanJobRepository();
      const query = req.query as unknown as {
        page: number;
        limit: number;
        status?: string;
      };

      const result = await repo.findAll({
        page: query.page,
        limit: query.limit,
        status: query.status as undefined,
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

// GET /admin/scan-jobs/:id
router.get(
  '/:id',
  validate({ params: uuidParamSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const repo = new ScanJobRepository();
      const job = await repo.findById(req.params.id);

      if (!job) {
        throw new AppError(404, 'ScanJob introuvable');
      }

      res.json({ success: true, data: job, error: null });
    } catch (err) {
      next(err);
    }
  },
);

// POST /admin/scan-jobs/trigger
router.post(
  '/trigger',
  validate({ body: triggerScanSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const repo = new ScanJobRepository();
      const job = await repo.create({
        source: req.body.source ?? 'manual',
      });

      // Le trigger reel via n8n webhook serait ici en production
      // Pour l'instant, on cree juste l'entree ScanJob

      res.status(201).json({ success: true, data: job, error: null });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
