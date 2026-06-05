/**
 * Enums partages entre frontend et backend.
 * Source de verite — alignes sur les enums PostgreSQL (schema.prisma).
 */

/** Enseignes belges ciblees */
export enum Brand {
  COLRUYT = 'colruyt',
  DELHAIZE = 'delhaize',
  LIDL = 'lidl',
  ALDI = 'aldi',
  CARREFOUR = 'carrefour',
  ACTION = 'action',
}

/** Categories alimentaires / produits */
export enum ProductCategory {
  PROTEINES = 'proteines',
  LEGUMES = 'legumes',
  FRUITS = 'fruits',
  PRODUITS_LAITIERS = 'produits_laitiers',
  BOULANGERIE = 'boulangerie',
  BOISSONS = 'boissons',
  EPICERIE = 'epicerie',
  SURGELES = 'surgeles',
  HYGIENE = 'hygiene',
  ENTRETIEN = 'entretien',
  AUTRES = 'autres',
}

/** Statut des jobs de collecte pipeline */
export enum ScanJobStatus {
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PARTIAL = 'partial',
}

/** Role utilisateur */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

/** Labels lisibles pour les categories (usage UI) */
export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  [ProductCategory.PROTEINES]: 'Proteines',
  [ProductCategory.LEGUMES]: 'Legumes',
  [ProductCategory.FRUITS]: 'Fruits',
  [ProductCategory.PRODUITS_LAITIERS]: 'Produits laitiers',
  [ProductCategory.BOULANGERIE]: 'Boulangerie',
  [ProductCategory.BOISSONS]: 'Boissons',
  [ProductCategory.EPICERIE]: 'Epicerie',
  [ProductCategory.SURGELES]: 'Surgeles',
  [ProductCategory.HYGIENE]: 'Hygiene',
  [ProductCategory.ENTRETIEN]: 'Entretien',
  [ProductCategory.AUTRES]: 'Autres',
};

/** Labels lisibles pour les enseignes (usage UI) */
export const BRAND_LABELS: Record<Brand, string> = {
  [Brand.COLRUYT]: 'Colruyt',
  [Brand.DELHAIZE]: 'Delhaize',
  [Brand.LIDL]: 'Lidl',
  [Brand.ALDI]: 'Aldi',
  [Brand.CARREFOUR]: 'Carrefour',
  [Brand.ACTION]: 'Action',
};
