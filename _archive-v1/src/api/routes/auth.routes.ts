import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { validate } from '../middleware/validate';
import { authMiddleware } from '../middleware/auth';
import { loginLimiter, registerLimiter } from '../middleware/rateLimiter';
import { loginSchema, registerSchema, refreshSchema, logoutSchema } from '../../shared/schemas';
import { RegisterUseCase } from '../application/usecases/auth/RegisterUseCase';
import { LoginUseCase } from '../application/usecases/auth/LoginUseCase';
import { RefreshUseCase } from '../application/usecases/auth/RefreshUseCase';
import { LogoutUseCase } from '../application/usecases/auth/LogoutUseCase';
import { UserRepository } from '../infrastructure/repositories/UserRepository';
import { RefreshTokenRepository } from '../infrastructure/repositories/RefreshTokenRepository';
import { GeocodeCacheRepository } from '../infrastructure/repositories/GeocodeCacheRepository';
import { ConsoleEmailService } from '../infrastructure/email/ConsoleEmailService';

const router = Router();

// POST /auth/register
router.post(
  '/register',
  registerLimiter,
  validate({ body: registerSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const useCase = new RegisterUseCase(
        new UserRepository(),
        new RefreshTokenRepository(),
        new GeocodeCacheRepository(),
        new ConsoleEmailService(),
      );
      const result = await useCase.execute(req.body);
      res.status(201).json({ success: true, data: result, error: null });
    } catch (err) {
      next(err);
    }
  },
);

// POST /auth/login
router.post(
  '/login',
  loginLimiter,
  validate({ body: loginSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const useCase = new LoginUseCase(
        new UserRepository(),
        new RefreshTokenRepository(),
      );
      const result = await useCase.execute(req.body);
      res.json({ success: true, data: result, error: null });
    } catch (err) {
      next(err);
    }
  },
);

// POST /auth/refresh
router.post(
  '/refresh',
  validate({ body: refreshSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const useCase = new RefreshUseCase(
        new UserRepository(),
        new RefreshTokenRepository(),
      );
      const result = await useCase.execute(req.body.refreshToken);
      res.json({ success: true, data: result, error: null });
    } catch (err) {
      next(err);
    }
  },
);

// POST /auth/logout
router.post(
  '/logout',
  authMiddleware,
  validate({ body: logoutSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const useCase = new LogoutUseCase(new RefreshTokenRepository());
      await useCase.execute(req.body.refreshToken);
      res.json({ success: true, data: null, error: null });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
