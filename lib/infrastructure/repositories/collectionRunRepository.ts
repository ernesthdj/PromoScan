// lib/infrastructure/repositories/collectionRunRepository.ts
//
// Accès DB pour CollectionRun / CollectionRunChain — utilisé par les route handlers cron/trigger
// (app/api/cron/collect-promotions/[chain], app/api/collections/trigger, app/api/collections/status).
// Centralise ici plutôt que dans les route handlers pour rester testable et pour que la logique
// de concurrence (garde anti-chevauchement) ne soit écrite qu'une fois.

import type { ChainRunStatus, CollectionRunChain, PrismaClient } from '@prisma/client';
import { computeAggregatedRunStatus, isRunComplete } from '../../application/runAggregationUseCase';

/**
 * Délai au-delà duquel une CollectionRunChain restée "running"/"pending" est considérée comme
 * bloquée (US-F1-01 DoD : "2x la durée max attendue") et n'empêche plus un nouveau run de
 * démarrer pour cette enseigne. Valeur non calibrée sur des temps d'exécution réels mesurés en
 * production (Delhaize/Lidl headless notamment) — cf. alerte Architecte §8 à Backend (#4) sur la
 * nécessité de mesurer ces durées. 15 minutes est une estimation de départ conservatrice pour un
 * run headless serverless, à ajuster une fois des mesures réelles disponibles.
 */
export const STALE_RUN_TIMEOUT_MS = 15 * 60 * 1000;

export async function findConflictingChainRun(
  prisma: PrismaClient,
  storeChainId: string,
): Promise<CollectionRunChain | null> {
  const staleThreshold = new Date(Date.now() - STALE_RUN_TIMEOUT_MS);

  const runningOrPending = await prisma.collectionRunChain.findFirst({
    where: {
      storeChainId,
      status: { in: ['running', 'pending'] },
    },
    orderBy: { startedAt: 'desc' },
  });

  if (!runningOrPending) {
    return null;
  }

  // Un run "running" démarré il y a plus de STALE_RUN_TIMEOUT_MS est considéré comme bloqué :
  // il n'est pas retourné comme conflit (US-F1-01 DoD).
  const referenceTime = runningOrPending.startedAt ?? new Date(0);
  if (referenceTime < staleThreshold) {
    return null;
  }

  return runningOrPending;
}

export async function getOrCreateCronRun(prisma: PrismaClient, weekKey: string) {
  // Upsert par weekKey unique : le premier cron de la semaine crée la ligne, les suivants la
  // retrouvent — pas de duplication, pas de verrou applicatif nécessaire grâce à la contrainte
  // unique Postgres (docs/ARCHITECTURE.md §5.1.b, §7).
  return prisma.collectionRun.upsert({
    where: { weekKey },
    create: { weekKey, trigger: 'cron', status: 'running' },
    update: {},
  });
}

export async function createManualRun(prisma: PrismaClient) {
  // weekKey: null systématiquement — jamais joint au run hebdomadaire en cours
  // (docs/ARCHITECTURE.md §5.2).
  return prisma.collectionRun.create({
    data: { weekKey: null, trigger: 'manual', status: 'running' },
  });
}

export async function upsertRunChainStatus(
  prisma: PrismaClient,
  params: {
    collectionRunId: string;
    storeChainId: string;
    status: ChainRunStatus;
    itemsCollected: number | null;
    errorMessage: string | null;
    startedAt: Date;
  },
) {
  const isTerminal = params.status !== 'pending' && params.status !== 'running';

  return prisma.collectionRunChain.upsert({
    where: {
      collectionRunId_storeChainId: {
        collectionRunId: params.collectionRunId,
        storeChainId: params.storeChainId,
      },
    },
    create: {
      collectionRunId: params.collectionRunId,
      storeChainId: params.storeChainId,
      status: params.status,
      itemsCollected: params.itemsCollected,
      errorMessage: params.errorMessage,
      startedAt: params.startedAt,
      finishedAt: isTerminal ? new Date() : null,
    },
    update: {
      status: params.status,
      itemsCollected: params.itemsCollected,
      errorMessage: params.errorMessage,
      finishedAt: isTerminal ? new Date() : null,
    },
  });
}

/**
 * Recalcule et persiste le statut agrégé du CollectionRun parent à partir de ses
 * CollectionRunChain enfants (lib/application/runAggregationUseCase.ts). Pose `finishedAt` dès
 * que toutes les chaînes sont dans un état terminal.
 */
export async function recomputeRunAggregateStatus(prisma: PrismaClient, collectionRunId: string) {
  const chains = await prisma.collectionRunChain.findMany({
    where: { collectionRunId },
    select: { status: true },
  });

  const aggregatedStatus = computeAggregatedRunStatus(chains);
  const complete = isRunComplete(chains);

  await prisma.collectionRun.update({
    where: { id: collectionRunId },
    data: {
      status: aggregatedStatus,
      finishedAt: complete ? new Date() : null,
    },
  });

  return aggregatedStatus;
}
