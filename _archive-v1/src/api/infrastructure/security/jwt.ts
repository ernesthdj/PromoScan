/**
 * JWT utilities — Generation et verification des tokens.
 *
 * Access token : courte duree (15 min).
 * Refresh token : longue duree (7 jours), hashé en BDD pour invalidation.
 */

import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { env } from '../../config/env';

export interface JwtPayload {
  userId: string;
  role: string;
}

/** Genere un access token JWT (15 min) */
export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '15m',
    issuer: 'promoscan',
  });
}

/** Genere un refresh token opaque (UUID v4 + random bytes) */
export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

/** Hash un refresh token avec SHA-256 pour stockage en BDD */
export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Verifie et decode un access token JWT */
export function verifyAccessToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET, {
    issuer: 'promoscan',
  });

  if (typeof decoded === 'string') {
    throw new Error('Invalid token format');
  }

  return decoded as JwtPayload;
}

/** Date d'expiration du refresh token (7 jours) */
export function getRefreshTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);
  return expiry;
}
