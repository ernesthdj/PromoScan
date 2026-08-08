// app/api/collection-runs/route.ts
//
// GET /api/collection-runs — docs/API-ENDPOINTS.md §3. Auth : session Supabase (US-F1-10).

import type { NextRequest } from 'next/server';
import { prisma } from '../../../lib/infrastructure/prisma';
import { getAuthenticatedUser } from '../../../lib/infrastructure/supabase/server';
import { collectionRunsQuerySchema } from '../../../lib/domain/promotionSchema';
import { jsonError, jsonSuccess } from '../../../lib/infrastructure/apiResponse';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return jsonError('UNAUTHORIZED', 'Session invalide ou absente', 401);
  }

  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = collectionRunsQuerySchema.safeParse(searchParams);
  if (!parsed.success) {
    return jsonError('INVALID_QUERY', 'Paramètres de pagination invalides', 400);
  }
  const { page, limit } = parsed.data;

  const [items, total] = await Promise.all([
    prisma.collectionRun.findMany({
      orderBy: { startedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        chains: {
          include: { storeChain: { select: { slug: true } } },
        },
      },
    }),
    prisma.collectionRun.count(),
  ]);

  return jsonSuccess({
    items: items.map((run) => ({
      id: run.id,
      weekKey: run.weekKey,
      trigger: run.trigger,
      startedAt: run.startedAt.toISOString(),
      finishedAt: run.finishedAt ? run.finishedAt.toISOString() : null,
      status: run.status,
      chains: run.chains.map((chain) => ({
        chainSlug: chain.storeChain.slug,
        status: chain.status,
        itemsCollected: chain.itemsCollected,
        error: chain.errorMessage,
      })),
    })),
    total,
  });
}
