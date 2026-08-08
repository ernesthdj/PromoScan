// lib/infrastructure/repositories/prismaChainRunRepository.ts
//
// Implémentation Prisma concrète du port ChainRunRepository défini par
// lib/application/collectChainUseCase.ts. Vit en infrastructure/ car elle importe Prisma —
// jamais l'inverse (application/ ne doit jamais importer ce fichier directement, seulement son
// interface).

import type { Prisma, PrismaClient } from '@prisma/client';
import type { ChainRunRepository } from '../../application/collectChainUseCase';
import type { RawPromotion } from '../../domain/StoreAdapter';

export function createPrismaChainRunRepository(prisma: PrismaClient): ChainRunRepository {
  return {
    async getLastSuccessfulItemsCount(storeChainId: string): Promise<number | null> {
      const lastSuccess = await prisma.collectionRunChain.findFirst({
        where: { storeChainId, status: 'complete' },
        orderBy: { collectionRun: { startedAt: 'desc' } },
        select: { itemsCollected: true },
      });
      return lastSuccess?.itemsCollected ?? null;
    },

    async upsertPromotions(storeChainId: string, promotions: RawPromotion[]): Promise<number> {
      if (promotions.length === 0) {
        return 0;
      }

      // Une transaction unique par enseigne (tout ou rien pour cette enseigne), jamais de
      // transaction globale inter-enseignes — RG cas limites (docs/FOUNDATION.md §10.1,
      // US-F1-06 DoD).
      const results = await prisma.$transaction(
        promotions.map((promo) => {
          const validFrom = new Date(promo.validFrom);
          const validTo = new Date(promo.validTo);
          const data: Prisma.PromotionUncheckedCreateInput = {
            storeChainId,
            rawProductName: promo.rawProductName,
            category: promo.category,
            unitLabel: promo.unitLabel,
            regularPrice: promo.regularPrice,
            promoPrice: promo.promoPrice,
            discountPercent: promo.discountPercent,
            pricePerUnit: promo.pricePerUnit,
            originLabel: promo.originLabel,
            validFrom,
            validTo,
            sourceUrl: promo.sourceUrl,
          };

          return prisma.promotion.upsert({
            where: {
              storeChainId_rawProductName_validFrom: {
                storeChainId,
                rawProductName: promo.rawProductName,
                validFrom,
              },
            },
            create: data,
            // Idempotence (US-F1-12) : un rejeu met à jour, ne duplique jamais.
            update: {
              category: promo.category,
              unitLabel: promo.unitLabel,
              regularPrice: promo.regularPrice,
              promoPrice: promo.promoPrice,
              discountPercent: promo.discountPercent,
              pricePerUnit: promo.pricePerUnit,
              originLabel: promo.originLabel,
              validTo,
              sourceUrl: promo.sourceUrl,
              collectedAt: new Date(),
            },
          });
        }),
      );

      return results.length;
    },
  };
}
