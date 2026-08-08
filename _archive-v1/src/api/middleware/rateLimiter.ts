/**
 * Rate Limiting — Protection par paliers selon les endpoints.
 */

import rateLimit from 'express-rate-limit';

/** POST /auth/login — 5 req/min/IP (anti brute-force) */
export const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    error: 'Trop de tentatives de connexion. Reessayez dans 1 minute.',
  },
});

/** POST /auth/register — 3 req/min/IP (anti spam inscription) */
export const registerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    error: 'Trop de tentatives d\'inscription. Reessayez dans 1 minute.',
  },
});

/** Global API — 100 req/min/user (protection generale) */
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    error: 'Trop de requetes. Reessayez dans 1 minute.',
  },
});

/** GET /geo/geocode — 10 req/min/user (protection Nominatim en amont) */
export const geocodeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    error: 'Trop de requetes de geocodage. Reessayez dans 1 minute.',
  },
});
