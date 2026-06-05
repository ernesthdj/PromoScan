/**
 * Global Error Handler — Intercepte toutes les erreurs non gerees.
 * Pas de stack trace en production. Messages generiques pour l'utilisateur.
 */

import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { Prisma } from '@prisma/client';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Erreur applicative connue
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      data: null,
      error: err.message,
    });
    return;
  }

  // Erreur Prisma : contrainte unique violee (ex: email en doublon)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        success: false,
        data: null,
        error: 'Une ressource avec ces donnees existe deja',
      });
      return;
    }

    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        data: null,
        error: 'Ressource introuvable',
      });
      return;
    }
  }

  // Erreur JSON invalide
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      data: null,
      error: 'Corps de requete JSON invalide',
    });
    return;
  }

  // Erreur inconnue — pas de stack trace en prod
  if (env.NODE_ENV === 'development') {
    // En dev : afficher les details pour le debug
    res.status(500).json({
      success: false,
      data: null,
      error: err.message,
      stack: err.stack,
    });
    return;
  }

  res.status(500).json({
    success: false,
    data: null,
    error: 'Erreur interne du serveur',
  });
}
