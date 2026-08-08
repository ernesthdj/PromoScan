// lib/domain/StoreAdapter.ts
//
// Contrat pur (Clean Architecture) : AUCUN import de framework, ORM, ou librairie d'infra
// (pas de Next.js, Prisma, Playwright, Cheerio, fetch spécifique). Reprend l'erreur capitalisée
// en v1 (JOURNAL.md règle #1/#8 : fuse.js importé à tort dans domain/) — ce fichier ne doit
// jamais être modifié pour y ajouter une dépendance concrète.
//
// Source : docs/ARCHITECTURE.md §10.1 / §3 (interface StoreAdapter + type RawPromotion).

export type StoreStrategy = 'api' | 'html' | 'headless';

/**
 * Donnée brute extraite par un adaptateur, avant validation Zod et avant tout enrichissement
 * (matching produit, catégorisation canonique — hors périmètre F1).
 */
export interface RawPromotion {
  rawProductName: string;
  category: string | null;
  unitLabel: string | null;
  regularPrice: number | null;
  promoPrice: number;
  discountPercent: number | null;
  pricePerUnit: number | null;
  /** Format ISO 8601 (ex. "2026-08-10"). Le parsing/validation de format vit dans promotionSchema.ts. */
  validFrom: string;
  /** Format ISO 8601 (ex. "2026-08-16"). */
  validTo: string;
  sourceUrl: string;
  originLabel: string | null;
}

/**
 * Interface commune (Strategy pattern) implémentée par chaque enseigne, quelle que soit sa
 * stratégie technique interne (API JSON, scraping HTML, rendu headless). L'orchestrateur de
 * collecte (lib/application/collectChainUseCase.ts) ne connaît jamais le détail d'implémentation
 * — il appelle uniquement `fetchPromotions()`.
 */
export interface StoreAdapter {
  readonly chainSlug: string;
  readonly strategy: StoreStrategy;
  fetchPromotions(): Promise<RawPromotion[]>;
}
