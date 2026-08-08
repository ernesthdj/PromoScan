// app/api/promotions/route.ts
//
// GET /api/promotions — docs/API-ENDPOINTS.md §2. Auth : session Supabase (US-F1-09).

import type { NextRequest } from 'next/server';
import { prisma } from '../../../lib/infrastructure/prisma';
import { getAuthenticatedUser } from '../../../lib/infrastructure/supabase/server';
import { promotionsQuerySchema } from '../../../lib/domain/promotionSchema';
import { jsonError, jsonSuccess } from '../../../lib/infrastructure/apiResponse';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return jsonError('UNAUTHORIZED', 'Session invalide ou absente', 401);
  }

  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = promotionsQuerySchema.safeParse(searchParams);
  if (!parsed.success) {
    return jsonError('INVALID_QUERY', 'Paramètres de pagination/filtre invalides', 400);
  }
  const { storeChain, category, page, limit } = parsed.data;

  const where = {
    ...(storeChain ? { storeChain: { slug: storeChain } } : {}),
    ...(category ? { category } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.promotion.findMany({
      where,
      include: { storeChain: { select: { slug: true } } },
      orderBy: { validFrom: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.promotion.count({ where }),
  ]);

  return jsonSuccess({
    items: items.map((item) => ({
      id: item.id,
      storeChain: item.storeChain.slug,
      rawProductName: item.rawProductName,
      category: item.category,
      unitLabel: item.unitLabel,
      regularPrice: item.regularPrice ? Number(item.regularPrice) : null,
      promoPrice: Number(item.promoPrice),
      discountPercent: item.discountPercent,
      pricePerUnit: item.pricePerUnit ? Number(item.pricePerUnit) : null,
      validFrom: item.validFrom.toISOString().slice(0, 10),
      validTo: item.validTo.toISOString().slice(0, 10),
    })),
    total,
    page,
  });
}
