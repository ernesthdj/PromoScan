// app/api/cron/collect-promotions/[chain]/route.ts
//
// POST /api/cron/collect-promotions/[chain] — docs/API-ENDPOINTS.md §1.
// Un cron Vercel distinct par enseigne (décision Architecte #2, docs/ARCHITECTURE.md §5).
// Auth : header `Authorization: Bearer <CRON_SECRET>` (jamais de session utilisateur ici).

import type { NextRequest } from 'next/server';
import { prisma } from '../../../../../lib/infrastructure/prisma';
import { findActiveStoreChainBySlug } from '../../../../../lib/infrastructure/repositories/storeChainRepository';
import {
  findConflictingChainRun,
  getOrCreateCronRun,
  recomputeRunAggregateStatus,
  upsertRunChainStatus,
} from '../../../../../lib/infrastructure/repositories/collectionRunRepository';
import { createPrismaChainRunRepository } from '../../../../../lib/infrastructure/repositories/prismaChainRunRepository';
import { getStoreAdapter } from '../../../../../lib/infrastructure/adapters';
import { collectChainUseCase } from '../../../../../lib/application/collectChainUseCase';
import { computeIsoWeekKey } from '../../../../../lib/domain/weekKey';
import { jsonError, jsonSuccess } from '../../../../../lib/infrastructure/apiResponse';
import type { ChainRunStatus } from '@prisma/client';

// Playwright + @sparticuz/chromium nécessitent le runtime Node.js complet (pas Edge).
export const runtime = 'nodejs';
// Cf. docs/ARCHITECTURE.md §1/§5.4 : durée exacte disponible sur le tier Vercel actuel non
// confirmée (point ouvert transmis à DevOps #8). 300s est une valeur cible, pas une garantie.
export const maxDuration = 300;

function mapOutcomeToChainStatus(status: 'complete' | 'format_drift' | 'failed'): ChainRunStatus {
  return status;
}

export async function POST(request: NextRequest, { params }: { params: { chain: string } }) {
  // 1. Vérification du secret cron (401 sinon) — US-F1-01 DoD.
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return jsonError('UNAUTHORIZED', 'CRON_SECRET absent ou invalide', 401);
  }

  // 2. Validation stricte du chainSlug contre StoreChain actif — jamais confiance à l'URL brute
  // (ARCHITECTURE §7).
  const chainSlug = params.chain;
  const storeChain = await findActiveStoreChainBySlug(prisma, chainSlug);
  if (!storeChain) {
    return jsonError('CHAIN_NOT_FOUND', `Aucune enseigne active pour le slug "${chainSlug}"`, 404);
  }

  // 3. Garde de concurrence par enseigne (pas par run global) — ARCHITECTURE §5.1.d.
  const conflict = await findConflictingChainRun(prisma, storeChain.id);
  if (conflict) {
    return jsonError(
      'COLLECTION_IN_PROGRESS',
      `Une collecte est déjà en cours pour l'enseigne "${chainSlug}"`,
      409,
    );
  }

  // 4. Upsert du CollectionRun de la semaine courante (weekKey) — ARCHITECTURE §5.1.b.
  const weekKey = computeIsoWeekKey();
  const run = await getOrCreateCronRun(prisma, weekKey);

  const startedAt = new Date();
  await upsertRunChainStatus(prisma, {
    collectionRunId: run.id,
    storeChainId: storeChain.id,
    status: 'running',
    itemsCollected: null,
    errorMessage: null,
    startedAt,
  });

  // 5. Exécution de l'adaptateur de cette seule enseigne.
  const adapter = getStoreAdapter(storeChain.slug);
  if (!adapter) {
    // Ne devrait jamais arriver (registry doit couvrir tous les StoreChain.slug actifs) — filet
    // de sécurité plutôt qu'un crash non géré.
    await upsertRunChainStatus(prisma, {
      collectionRunId: run.id,
      storeChainId: storeChain.id,
      status: 'failed',
      itemsCollected: null,
      errorMessage: 'no_adapter_registered',
      startedAt,
    });
    await recomputeRunAggregateStatus(prisma, run.id);
    return jsonError('NO_ADAPTER', `Aucun adaptateur enregistré pour "${chainSlug}"`, 500);
  }

  const repository = createPrismaChainRunRepository(prisma);
  const result = await collectChainUseCase({
    storeChainId: storeChain.id,
    formatDriftThreshold: storeChain.formatDriftThreshold,
    adapter,
    repository,
  });

  // 6. Écriture du résultat final + recalcul du statut agrégé du run parent (ARCHITECTURE §5.1.f).
  await upsertRunChainStatus(prisma, {
    collectionRunId: run.id,
    storeChainId: storeChain.id,
    status: mapOutcomeToChainStatus(result.status),
    itemsCollected: result.itemsCollected,
    errorMessage: result.errorMessage,
    startedAt,
  });
  await recomputeRunAggregateStatus(prisma, run.id);

  return jsonSuccess({
    runId: run.id,
    chainSlug: storeChain.slug,
    status: result.status,
    itemsCollected: result.itemsCollected,
  });
}
