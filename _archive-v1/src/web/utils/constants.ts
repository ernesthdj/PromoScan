/**
 * Constants — Constantes UI pour le frontend.
 * Categories, enseignes, couleurs par enseigne.
 */

import { Brand, ProductCategory, BRAND_LABELS, CATEGORY_LABELS } from '../../shared/enums';

/** Couleurs associees a chaque enseigne (fond et texte) */
export const BRAND_COLORS: Record<Brand, { bg: string; text: string; border: string }> = {
  [Brand.COLRUYT]: { bg: '#e63c11', text: '#ffffff', border: '#cc3510' },
  [Brand.DELHAIZE]: { bg: '#00843d', text: '#ffffff', border: '#006b31' },
  [Brand.LIDL]: { bg: '#0050aa', text: '#ffffff', border: '#004090' },
  [Brand.ALDI]: { bg: '#00619a', text: '#ffffff', border: '#004f7c' },
  [Brand.CARREFOUR]: { bg: '#004e9e', text: '#ffffff', border: '#003e7e' },
  [Brand.ACTION]: { bg: '#0066cc', text: '#ffffff', border: '#0055aa' },
};

/** Toutes les enseignes dans l'ordre d'affichage */
export const ALL_BRANDS = Object.values(Brand);

/** Toutes les categories dans l'ordre d'affichage */
export const ALL_CATEGORIES = Object.values(ProductCategory);

/** Re-export pour usage dans les composants */
export { BRAND_LABELS, CATEGORY_LABELS };

/** Seuils de score pour le code couleur des pastilles */
export const SCORE_THRESHOLDS = {
  high: 70,
  medium: 40,
} as const;

/** Nombre d'items par page par defaut */
export const DEFAULT_PAGE_SIZE = 20;

/** Duree du toast "Annuler" en ms */
export const UNDO_TOAST_DURATION = 5_000;

/** Nombre minimum de caracteres pour l'autocompletion */
export const MIN_SEARCH_CHARS = 2;
