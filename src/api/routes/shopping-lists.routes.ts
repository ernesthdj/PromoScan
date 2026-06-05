import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { validate } from '../middleware/validate';
import { authMiddleware } from '../middleware/auth';
import {
  createListSchema,
  updateListSchema,
  addItemSchema,
  updateItemSchema,
  uuidParamSchema,
  listParamSchema,
  listItemParamsSchema,
} from '../../shared/schemas';
import { CreateListUseCase } from '../application/usecases/shopping-lists/CreateListUseCase';
import { AddItemUseCase } from '../application/usecases/shopping-lists/AddItemUseCase';
import { UpdateItemUseCase } from '../application/usecases/shopping-lists/UpdateItemUseCase';
import { DeleteItemUseCase } from '../application/usecases/shopping-lists/DeleteItemUseCase';
import { ShoppingListRepository } from '../infrastructure/repositories/ShoppingListRepository';
import { ShoppingListItemRepository } from '../infrastructure/repositories/ShoppingListItemRepository';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authMiddleware);

// GET /shopping-lists
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repo = new ShoppingListRepository();
    const lists = await repo.findByUserId(req.userId!);
    res.json({ success: true, data: lists, error: null });
  } catch (err) {
    next(err);
  }
});

// POST /shopping-lists
router.post(
  '/',
  validate({ body: createListSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const useCase = new CreateListUseCase(new ShoppingListRepository());
      const list = await useCase.execute(req.userId!, req.body.name);
      res.status(201).json({ success: true, data: list, error: null });
    } catch (err) {
      next(err);
    }
  },
);

// GET /shopping-lists/:id
router.get(
  '/:id',
  validate({ params: uuidParamSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const repo = new ShoppingListRepository();
      const list = await repo.findByIdWithItems(req.params.id);

      if (!list || list.userId !== req.userId) {
        throw new AppError(404, 'Liste introuvable');
      }

      res.json({ success: true, data: list, error: null });
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /shopping-lists/:id
router.patch(
  '/:id',
  validate({ params: uuidParamSchema, body: updateListSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const repo = new ShoppingListRepository();
      const list = await repo.findById(req.params.id);

      if (!list || list.userId !== req.userId) {
        throw new AppError(404, 'Liste introuvable');
      }

      const updated = await repo.update(req.params.id, { name: req.body.name });
      res.json({ success: true, data: updated, error: null });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /shopping-lists/:id
router.delete(
  '/:id',
  validate({ params: uuidParamSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const repo = new ShoppingListRepository();
      const list = await repo.findById(req.params.id);

      if (!list || list.userId !== req.userId) {
        throw new AppError(404, 'Liste introuvable');
      }

      await repo.delete(req.params.id);
      res.json({ success: true, data: null, error: null });
    } catch (err) {
      next(err);
    }
  },
);

// ─── Items ─────────────────────────────────────────────

// POST /shopping-lists/:listId/items
router.post(
  '/:listId/items',
  validate({ params: listParamSchema, body: addItemSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const useCase = new AddItemUseCase(
        new ShoppingListRepository(),
        new ShoppingListItemRepository(),
      );
      const item = await useCase.execute(req.userId!, req.params.listId, req.body);
      res.status(201).json({ success: true, data: item, error: null });
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /shopping-lists/:listId/items/:itemId
router.patch(
  '/:listId/items/:itemId',
  validate({ params: listItemParamsSchema, body: updateItemSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const useCase = new UpdateItemUseCase(
        new ShoppingListRepository(),
        new ShoppingListItemRepository(),
      );
      const item = await useCase.execute(
        req.userId!,
        req.params.listId,
        req.params.itemId,
        req.body,
      );
      res.json({ success: true, data: item, error: null });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /shopping-lists/:listId/items/:itemId
router.delete(
  '/:listId/items/:itemId',
  validate({ params: listItemParamsSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const useCase = new DeleteItemUseCase(
        new ShoppingListRepository(),
        new ShoppingListItemRepository(),
      );
      await useCase.execute(req.userId!, req.params.listId, req.params.itemId);
      res.json({ success: true, data: null, error: null });
    } catch (err) {
      next(err);
    }
  },
);

// POST /shopping-lists/:listId/items/uncheck-all
router.post(
  '/:listId/items/uncheck-all',
  validate({ params: listParamSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const listRepo = new ShoppingListRepository();
      const list = await listRepo.findById(req.params.listId);

      if (!list || list.userId !== req.userId) {
        throw new AppError(404, 'Liste introuvable');
      }

      const itemRepo = new ShoppingListItemRepository();
      await itemRepo.uncheckAll(req.params.listId);
      res.json({ success: true, data: null, error: null });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
