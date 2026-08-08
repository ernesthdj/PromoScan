// lib/infrastructure/repositories/storeChainRepository.ts
//
// Accès en lecture à StoreChain, utilisé par les route handlers pour valider un `chainSlug`
// avant toute exécution d'adaptateur — jamais faire confiance à une valeur brute d'URL ou de body
// (règle sécurité docs/ARCHITECTURE.md §7 : "chainSlug invalide ou inactif... 404/400 sinon,
// jamais de tentative d'exécution d'adaptateur sur une valeur non whitelistée").

import type { PrismaClient, StoreChain } from '@prisma/client';

export async function findActiveStoreChainBySlug(
  prisma: PrismaClient,
  slug: string,
): Promise<StoreChain | null> {
  const chain = await prisma.storeChain.findUnique({ where: { slug } });
  if (!chain || !chain.isActive) {
    return null;
  }
  return chain;
}

export async function listActiveStoreChains(prisma: PrismaClient): Promise<StoreChain[]> {
  return prisma.storeChain.findMany({ where: { isActive: true }, orderBy: { slug: 'asc' } });
}
