// lib/infrastructure/prisma.ts
//
// Client Prisma singleton — pattern standard Next.js pour éviter l'épuisement du pool de
// connexions en dev (hot reload créant une nouvelle instance à chaque rechargement de module).

import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prismaClient: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.__prismaClient ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prismaClient = prisma;
}
