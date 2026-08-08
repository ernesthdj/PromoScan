/**
 * Auth Middleware — Verification JWT sur les routes protegees.
 * Injecte userId et role dans req pour les handlers downstream.
 */

import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../infrastructure/security/jwt';

// Extension du type Request pour inclure les donnees auth
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
    }
  }
}

/**
 * Middleware d'authentification — verifie le Bearer token.
 * Retourne 401 si absent ou invalide.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      data: null,
      error: 'Token d\'authentification manquant',
    });
    return;
  }

  const token = authHeader.slice(7); // Retirer "Bearer "

  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.userId;
    req.userRole = payload.role;
    next();
  } catch {
    res.status(401).json({
      success: false,
      data: null,
      error: 'Token invalide ou expire',
    });
  }
}

/**
 * Middleware admin — verifie que l'utilisateur a le role admin.
 * Doit etre utilise apres authMiddleware.
 */
export function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.userRole !== 'admin') {
    res.status(403).json({
      success: false,
      data: null,
      error: 'Acces reserve aux administrateurs',
    });
    return;
  }

  next();
}
