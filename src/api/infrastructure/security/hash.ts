/**
 * Hash utilities — bcrypt pour le hashing de mots de passe.
 */

import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/** Hash un mot de passe avec bcrypt (cost factor 12) */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/** Verifie un mot de passe contre son hash */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
