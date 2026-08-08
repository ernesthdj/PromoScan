/**
 * Validation des variables d'environnement au demarrage.
 * Si une variable requise est manquante, le serveur refuse de demarrer.
 */

import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),

  // Database
  DATABASE_URL: z.string().url('DATABASE_URL invalide'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET doit faire au moins 32 caracteres'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET doit faire au moins 32 caracteres'),

  // External APIs
  CLAUDE_API_KEY: z.string().min(1, 'CLAUDE_API_KEY requis'),
  ORS_API_KEY: z.string().min(1, 'ORS_API_KEY requis'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const formatted = Object.entries(errors)
      .map(([key, msgs]) => `  ${key}: ${(msgs ?? []).join(', ')}`)
      .join('\n');

    throw new Error(`Variables d'environnement invalides:\n${formatted}`);
  }

  return result.data;
}

export const env = validateEnv();
