/**
 * Validation Middleware — Utilise les schemas Zod pour valider body, params et query.
 * Retourne 400 avec les erreurs de validation formatees.
 */

import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema, ZodError } from 'zod';

interface ValidationSchemas {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

/**
 * Middleware de validation Zod.
 * Valide body, params et/ou query selon les schemas fournis.
 * Les donnees validees remplacent les originales dans req.
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
    } catch (err) {
      const zodErr = err as ZodError;
      errors.push(
        ...zodErr.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
      );
    }

    try {
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as Record<string, string>;
      }
    } catch (err) {
      const zodErr = err as ZodError;
      errors.push(
        ...zodErr.errors.map((e) => `params.${e.path.join('.')}: ${e.message}`),
      );
    }

    try {
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as Record<string, string>;
      }
    } catch (err) {
      const zodErr = err as ZodError;
      errors.push(
        ...zodErr.errors.map((e) => `query.${e.path.join('.')}: ${e.message}`),
      );
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        data: null,
        error: errors.join('; '),
      });
      return;
    }

    next();
  };
}
