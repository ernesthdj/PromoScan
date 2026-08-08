// lib/domain/promotionSchema.ts
//
// Schémas Zod — frontière de validation entre les adaptateurs (infrastructure) et le reste du
// système. Zod n'est pas considéré comme un "framework" au sens de la règle Clean Architecture
// du projet (aucun couplage Next.js/Prisma/Playwright) : c'est une librairie de validation pure,
// explicitement placée dans domain/ par docs/ARCHITECTURE.md §3.
//
// Réutilisé par lib/application/collectChainUseCase.ts (validation des RawPromotion) et par les
// route handlers (app/api/**) pour les query params / bodies (docs/API-ENDPOINTS.md — "Notes
// transverses" : "les 4 endpoints partagent les mêmes schémas Zod de sortie").

import { z } from 'zod';

/**
 * Valide un RawPromotion produit par un StoreAdapter, avant tout upsert.
 * Champs minimum obligatoires (US-F1-02 DoD) : rawProductName, promoPrice, validFrom, validTo,
 * sourceUrl. Les autres champs sont nullable (renseignés "si disponibles").
 */
export const rawPromotionSchema = z.object({
  rawProductName: z.string().trim().min(1, 'rawProductName requis'),
  category: z.string().trim().min(1).nullable(),
  unitLabel: z.string().trim().min(1).nullable(),
  regularPrice: z.number().finite().nonnegative().nullable(),
  promoPrice: z.number().finite().nonnegative(),
  discountPercent: z.number().finite().nullable(),
  pricePerUnit: z.number().finite().nonnegative().nullable(),
  validFrom: z.string().refine(isParsableDate, 'validFrom doit être une date ISO 8601 valide'),
  validTo: z.string().refine(isParsableDate, 'validTo doit être une date ISO 8601 valide'),
  sourceUrl: z.string().url('sourceUrl doit être une URL valide'),
  originLabel: z.string().trim().min(1).nullable(),
});

export type RawPromotionValidated = z.infer<typeof rawPromotionSchema>;

function isParsableDate(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

// --- Schémas de requête API (docs/API-ENDPOINTS.md) ---

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive(),
});

/** GET /api/promotions — query params */
export const promotionsQuerySchema = z.object({
  storeChain: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
});

/** GET /api/collection-runs — query params */
export const collectionRunsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

/** POST /api/collections/trigger — body (optionnel) */
export const triggerBodySchema = z
  .object({
    chainSlug: z.string().trim().min(1).optional(),
  })
  .default({});

export type PromotionsQuery = z.infer<typeof promotionsQuerySchema>;
export type CollectionRunsQuery = z.infer<typeof collectionRunsQuerySchema>;
export type TriggerBody = z.infer<typeof triggerBodySchema>;
