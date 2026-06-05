import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { validate } from '../middleware/validate';
import { authMiddleware } from '../middleware/auth';
import {
  updateProfileSchema,
  changeEmailSchema,
  changePasswordSchema,
  deleteAccountSchema,
} from '../../shared/schemas';
import { UpdateProfileUseCase } from '../application/usecases/users/UpdateProfileUseCase';
import { DeleteAccountUseCase } from '../application/usecases/users/DeleteAccountUseCase';
import { UserRepository } from '../infrastructure/repositories/UserRepository';
import { RefreshTokenRepository } from '../infrastructure/repositories/RefreshTokenRepository';
import { GeocodeCacheRepository } from '../infrastructure/repositories/GeocodeCacheRepository';
import { verifyPassword, hashPassword } from '../infrastructure/security/hash';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Toutes les routes users sont protegees
router.use(authMiddleware);

// GET /users/me
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repo = new UserRepository();
    const user = await repo.findById(req.userId!);

    if (!user) {
      throw new AppError(404, 'Utilisateur introuvable');
    }

    // Ne pas renvoyer le passwordHash
    const { passwordHash, ...publicUser } = user;
    res.json({ success: true, data: publicUser, error: null });
  } catch (err) {
    next(err);
  }
});

// PATCH /users/me
router.patch(
  '/me',
  validate({ body: updateProfileSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const useCase = new UpdateProfileUseCase(
        new UserRepository(),
        new GeocodeCacheRepository(),
      );
      const updated = await useCase.execute(req.userId!, req.body);

      const { passwordHash, ...publicUser } = updated;
      res.json({ success: true, data: publicUser, error: null });
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /users/me/email
router.patch(
  '/me/email',
  validate({ body: changeEmailSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const repo = new UserRepository();
      const user = await repo.findById(req.userId!);

      if (!user) throw new AppError(404, 'Utilisateur introuvable');

      const isValid = await verifyPassword(req.body.password, user.passwordHash);
      if (!isValid) throw new AppError(401, 'Mot de passe incorrect');

      const updated = await repo.update(req.userId!, { email: req.body.newEmail });
      const { passwordHash, ...publicUser } = updated;
      res.json({ success: true, data: publicUser, error: null });
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /users/me/password
router.patch(
  '/me/password',
  validate({ body: changePasswordSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const repo = new UserRepository();
      const user = await repo.findById(req.userId!);

      if (!user) throw new AppError(404, 'Utilisateur introuvable');

      const isValid = await verifyPassword(req.body.oldPassword, user.passwordHash);
      if (!isValid) throw new AppError(401, 'Ancien mot de passe incorrect');

      const newHash = await hashPassword(req.body.newPassword);
      await repo.update(req.userId!, { passwordHash: newHash });
      res.json({ success: true, data: null, error: null });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /users/me
router.delete(
  '/me',
  validate({ body: deleteAccountSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const useCase = new DeleteAccountUseCase(
        new UserRepository(),
        new RefreshTokenRepository(),
      );
      await useCase.execute(req.userId!, req.body.password);
      res.json({ success: true, data: null, error: null });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
