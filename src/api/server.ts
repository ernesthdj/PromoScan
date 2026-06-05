/**
 * Point d'entree Express — PromoScan API.
 *
 * Configure les middlewares globaux et monte le router /api/v1/.
 * Les variables d'env sont validees au demarrage (env.ts).
 */

import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { corsConfig } from './config/cors';
import { globalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import apiRouter from './routes';

const app = express();

// ─── Middlewares globaux ───────────────────────────────

// Securite HTTP headers
app.use(helmet());

// CORS
app.use(corsConfig);

// Rate limiting global
app.use(globalLimiter);

// Parse JSON body (limite 1MB)
app.use(express.json({ limit: '1mb' }));

// ─── Routes ────────────────────────────────────────────

app.use('/api/v1', apiRouter);

// 404 pour les routes non matchees
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    error: 'Route introuvable',
  });
});

// ─── Error handler global ──────────────────────────────

app.use(errorHandler);

// ─── Demarrage ─────────────────────────────────────────

app.listen(env.PORT, () => {
  if (env.NODE_ENV === 'development') {
    // Autorise en dev uniquement pour confirmer le demarrage
    // eslint-disable-next-line no-console
    console.log(`[PromoScan API] Running on http://localhost:${env.PORT}`);
    console.log(`[PromoScan API] Environment: ${env.NODE_ENV}`);
  }
});

export default app;
