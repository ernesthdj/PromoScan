/**
 * Schemas Zod partages — Validation d'entree pour le backend et le frontend.
 * Chaque schema est la source de verite pour la validation des donnees.
 */

import { z } from 'zod';
import { Brand, ProductCategory, ScanJobStatus } from '../enums';

// ─── Helpers ───────────────────────────────────────────

const brandEnum = z.nativeEnum(Brand);
const categoryEnum = z.nativeEnum(ProductCategory);

/** Mot de passe : min 8 chars, 1 majuscule, 1 chiffre, 1 special */
const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caracteres')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
  .regex(
    /[^A-Za-z0-9]/,
    'Le mot de passe doit contenir au moins un caractere special',
  );

/** Email : format RFC 5322 simplifie */
const emailSchema = z
  .string()
  .email('Format email invalide')
  .max(255)
  .transform((v) => v.toLowerCase().trim());

/** Code postal belge : 4 chiffres entre 1000 et 9999 */
const postalCodeSchema = z
  .string()
  .regex(/^\d{4}$/, 'Code postal belge invalide (4 chiffres)')
  .refine(
    (v) => {
      const n = parseInt(v, 10);
      return n >= 1000 && n <= 9999;
    },
    { message: 'Code postal belge entre 1000 et 9999' },
  );

// ─── Auth Schemas ──────────────────────────────────────

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  zoneCodePostal: postalCodeSchema.optional(),
  rgpdConsent: z.literal(true, {
    errorMap: () => ({ message: 'Le consentement RGPD est obligatoire' }),
  }),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Mot de passe requis'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token requis'),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token requis'),
});

// ─── User Schemas ──────────────────────────────────────

export const updateProfileSchema = z.object({
  zoneCodePostal: postalCodeSchema.optional(),
  preferences: z
    .object({
      w1: z.number().min(0).max(1).optional(),
      w2: z.number().min(0).max(1).optional(),
      w3: z.number().min(0).max(1).optional(),
    })
    .refine(
      (p) => {
        const w1 = p.w1 ?? 0.5;
        const w2 = p.w2 ?? 0.3;
        const w3 = p.w3 ?? 0.2;
        return Math.abs(w1 + w2 + w3 - 1.0) < 0.01;
      },
      { message: 'La somme des poids (w1+w2+w3) doit etre egale a 1.0' },
    )
    .optional(),
});

export const changeEmailSchema = z.object({
  newEmail: emailSchema,
  password: z.string().min(1, 'Mot de passe requis'),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Ancien mot de passe requis'),
  newPassword: passwordSchema,
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Mot de passe requis'),
});

// ─── Shopping List Schemas ─────────────────────────────

export const createListSchema = z.object({
  name: z
    .string()
    .min(1, 'Nom requis')
    .max(100, 'Nom trop long (max 100 caracteres)')
    .trim(),
});

export const updateListSchema = z.object({
  name: z
    .string()
    .min(1, 'Nom requis')
    .max(100, 'Nom trop long (max 100 caracteres)')
    .trim(),
});

export const addItemSchema = z.object({
  productName: z
    .string()
    .min(1, 'Nom du produit requis')
    .max(200, 'Nom trop long (max 200 caracteres)')
    .trim(),
  quantity: z.number().int().min(1).default(1),
  category: categoryEnum.optional().default(ProductCategory.AUTRES),
});

export const updateItemSchema = z.object({
  category: categoryEnum.optional(),
  quantity: z.number().int().min(1).optional(),
  checked: z.boolean().optional(),
});

// ─── Suggestion Schemas ────────────────────────────────

const suggestionFiltersSchema = z
  .object({
    categories: z.array(categoryEnum).optional(),
    brands: z.array(brandEnum).optional(),
    day: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date YYYY-MM-DD attendu')
      .optional(),
  })
  .optional();

export const matchSchema = z.object({
  listId: z.string().uuid('ID de liste invalide'),
  filters: suggestionFiltersSchema,
});

export const recommendSchema = z.object({
  listId: z.string().uuid('ID de liste invalide'),
  filters: suggestionFiltersSchema,
});

// ─── Route Schemas ─────────────────────────────────────

export const calculateRouteSchema = z.object({
  storeIds: z
    .array(z.string().uuid())
    .min(1, 'Au moins 1 magasin requis')
    .max(6, 'Maximum 6 magasins'),
  origin: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
});

export const saveRouteSchema = z.object({
  name: z.string().max(200).optional(),
  storeIds: z.array(z.string().uuid()).min(1),
  geojson: z.object({
    type: z.literal('FeatureCollection'),
    features: z.array(z.unknown()),
  }),
  estimatedSavings: z.number().min(0),
  durationMin: z.number().min(0),
  distanceKm: z.number().min(0),
});

// ─── Scan Job Schemas ──────────────────────────────────

export const triggerScanSchema = z.object({
  source: z.string().optional(),
  brands: z.array(brandEnum).optional(),
});

// ─── Pagination Schema ─────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── Promotion Filter Schema ───────────────────────────

export const promotionFilterSchema = paginationSchema.extend({
  category: categoryEnum.optional(),
  brand: brandEnum.optional(),
});

// ─── Scan Job Filter Schema ────────────────────────────

export const scanJobFilterSchema = paginationSchema.extend({
  status: z.nativeEnum(ScanJobStatus).optional(),
});

// ─── Product Search Schema ─────────────────────────────

export const productSearchSchema = z.object({
  q: z.string().min(2, 'Minimum 2 caracteres pour la recherche'),
});

// ─── Geocoding Schemas ─────────────────────────────────

export const postalCodeSearchSchema = z.object({
  q: z.string().min(1),
});

export const geocodeSchema = z.object({
  postal_code: postalCodeSchema,
});

// ─── UUID Param Schema ─────────────────────────────────

export const uuidParamSchema = z.object({
  id: z.string().uuid('ID invalide'),
});

export const listItemParamsSchema = z.object({
  listId: z.string().uuid('ID de liste invalide'),
  itemId: z.string().uuid('ID d\'article invalide'),
});

export const listParamSchema = z.object({
  listId: z.string().uuid('ID de liste invalide'),
});

// ─── Exports types inferes ─────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangeEmailInput = z.infer<typeof changeEmailSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateListInput = z.infer<typeof createListSchema>;
export type AddItemInput = z.infer<typeof addItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type MatchInput = z.infer<typeof matchSchema>;
export type RecommendInput = z.infer<typeof recommendSchema>;
export type CalculateRouteInput = z.infer<typeof calculateRouteSchema>;
export type SaveRouteInput = z.infer<typeof saveRouteSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
