// app/api/collections/trigger/route.ts
//
// POST /api/collections/trigger — docs/API-ENDPOINTS.md §4. Auth : session Supabase (US-F1-11).
// Réutilise exactement collectChainUseCase (même logique que le cron) — ARCHITECTURE §5.2.

import type { NextRequest } from 'next/server';
import type { ChainRunStatus } from '@prisma/client';
import { prisma } from '../../../../lib/infrastructure/prisma';
import { getAuthenticatedUser } from '../../../../lib/infrastructure/supabase/server';
import {
  findActiveStoreChainBySlug,
  listActiveStoreChains,
} from '../../../../lib/infrastructure/repositories/storeChainRepository';
import {
  createManualRun,
  findConflictingChainRun,
  recomputeRunAggregateStatus,
  upsertRunChainStatus,
} from '../../../../lib/infrastructure/repositories/collectionRunRepository';
import { createPrismaChainRunRepository } from '../../../../lib/infrastructure/repositories/prismaChainRunRepository';
import { getStoreAdapter } from '../../../../lib/infrastructure/adapters';
import { collectChainUseCase } from '../../../../lib/application/collectChainUseCase';
import { triggerBodySchema } from '../../../../lib/domain/promotionSchema';
import { jsonError, jsonSuccess } from '../../../../lib/infrastructure/apiResponse';

export const runtime = 'nodejs';
export const maxDuration = 300; // cf. ARCHITECTURE §1/§5.4 — même réserve que le cron

async function runOneChain(
  runId: string,
  storeChainId: string,
  storeChainSlug: string,
  formatDriftThreshold: number,
) {
  const startedAt = new Date();
  await upsertRunChainStatus(prisma, {
    collectionRunId: runId,
    storeChainId,
    status: 'running',
    itemsCollected: null,
    errorMessage: null,
    startedAt,
  });

  const adapter = getStoreAdapter(storeChainSlug);
  if (!adapter) {
    await upsertRunChainStatus(prisma, {
      collectionRunId: runId,
      storeChainId,
      status: 'failed',
      itemsCollected: null,
      errorMessage: 'no_adapter_registered',
      startedAt,
    });
    return { chainSlug: storeChainSlug, status: 'failed' as ChainRunStatus, itemsCollected: null };
  }

  const repository = createPrismaChainRunRepository(prisma);
  const result = await collectChainUseCase({
    storeChainId,
    formatDriftThreshold,
    adapter,
    repository,
  });

  await upsertRunChainStatus(prisma, {
    collectionRunId: runId,
    storeChainId,
    status: result.status,
    itemsCollected: result.itemsCollected,
    errorMessage: result.errorMessage,
    startedAt,
  });

  return { chainSlug: storeChainSlug, status: result.status, itemsCollected: result.itemsCollected };
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return jsonError('UNAUTHORIZED', 'Session invalide ou absente', 401);
  }

  let body: unknown = {};
  try {
    const text = await request.text();
    body = text ? JSON.parse(text) : {};
  } catch {
    return jsonError('INVALID_BODY', 'Corps de requête JSON invalide', 400);
  }

  const parsed = triggerBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('INVALID_BODY', 'Corps de requête invalide', 400);
  }
  const { chainSlug } = parsed.data;

  // --- Cas 1 : déclenchement ciblé sur une seule enseigne ---
  if (chainSlug) {
    const storeChain = await findActiveStoreChainBySlug(prisma, chainSlug);
    if (!storeChain) {
      return jsonError(
        'CHAIN_NOT_FOUND',
        `Aucune enseigne active pour le slug "${chainSlug}"`,
        400,
      );
    }

    const conflict = await findConflictingChainRun(prisma, storeChain.id);
    if (conflict) {
      return jsonError(
        'COLLECTION_IN_PROGRESS',
        `Une collecte est déjà en cours pour l'enseigne "${chainSlug}"`,
        409,
      );
    }

    const run = await createManualRun(prisma);
    const chainResult = await runOneChain(
      run.id,
      storeChain.id,
      storeChain.slug,
      storeChain.formatDriftThreshold,
    );
    await recomputeRunAggregateStatus(prisma, run.id);

    return jsonSuccess({
      runId: run.id,
      trigger: 'manual',
      chains: [chainResult],
    });
  }

  // --- Cas 2 : déclenchement de toutes les enseignes actives en parallèle ---
  const activeChains = await listActiveStoreChains(prisma);

  const conflicts = await Promise.all(
    activeChains.map((chain) => findConflictingChainRun(prisma, chain.id)),
  );
  const conflictingChain = activeChains.find((_, index) => conflicts[index] !== null);
  if (conflictingChain) {
    return jsonError(
      'COLLECTION_IN_PROGRESS',
      `Une collecte est déjà en cours pour l'enseigne "${conflictingChain.slug}"`,
      409,
    );
  }

  const run = await createManualRun(prisma);
  const settled = await Promise.allSettled(
    activeChains.map((chain) =>
      runOneChain(run.id, chain.id, chain.slug, chain.formatDriftThreshold),
    ),
  );
  await recomputeRunAggregateStatus(prisma, run.id);

  const chains = settled.map((outcome, index) => {
    if (outcome.status === 'fulfilled') {
      return outcome.value;
    }
    // RG-3 : un échec d'enseigne (y compris une exception non anticipée dans runOneChain) ne
    // bloque jamais les autres — déjà reflété en base par upsertRunChainStatus le cas échéant.
    return {
      chainSlug: activeChains[index]!.slug,
      status: 'failed' as ChainRunStatus,
      itemsCollected: null,
    };
  });

  return jsonSuccess({
    runId: run.id,
    trigger: 'manual',
    chains,
  });
}
