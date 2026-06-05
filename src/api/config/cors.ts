/**
 * Configuration CORS — Whitelist stricte.
 * Seul le domaine frontend est autorise.
 */

import cors from 'cors';
import { env } from './env';

const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());

export const corsConfig = cors({
  origin: (origin, callback) => {
    // Autoriser les requetes sans origin (curl, postman, meme serveur)
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origine CORS non autorisee: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
