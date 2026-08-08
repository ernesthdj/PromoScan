/**
 * Types partages — Interfaces TypeScript pour toutes les entites du domaine.
 * Aucune dependance framework. Utilises par le backend et le frontend.
 */

import { Brand, ProductCategory, ScanJobStatus, UserRole } from '../enums';

// ─── User ──────────────────────────────────────────────

export interface UserPreferences {
  /** Poids economie dans le scoring (defaut 0.5) */
  w1: number;
  /** Poids proximite dans le scoring (defaut 0.3) */
  w2: number;
  /** Poids couverture liste dans le scoring (defaut 0.2) */
  w3: number;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  zoneCodePostal: string | null;
  zoneCommune: string | null;
  zoneLatitude: number | null;
  zoneLongitude: number | null;
  preferences: UserPreferences;
  rgpdConsent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** User sans le password_hash — retourne par l'API */
export type UserPublic = Omit<User, never>;

// ─── RefreshToken ──────────────────────────────────────

export interface RefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

// ─── Store ─────────────────────────────────────────────

export interface Store {
  id: string;
  name: string;
  brand: Brand;
  address: string;
  latitude: number;
  longitude: number;
  openingHours: Record<string, string> | null;
  isActive: boolean;
  createdAt: Date;
}

// ─── Promotion ─────────────────────────────────────────

export interface Promotion {
  id: string;
  storeId: string;
  productId: string | null;
  scanJobId: string;
  productName: string;
  category: ProductCategory;
  originalPrice: number | null;
  promoPrice: number;
  discountPct: number | null;
  startDate: Date;
  endDate: Date;
  sourceUrl: string | null;
  rawText: string | null;
  createdAt: Date;
}

export interface PromotionWithStore extends Promotion {
  store: Store;
}

// ─── Product ───────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  aliases: string[];
  unit: string | null;
  createdAt: Date;
}

// ─── ShoppingList ──────────────────────────────────────

export interface ShoppingList {
  id: string;
  userId: string;
  name: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShoppingListItem {
  id: string;
  listId: string;
  productName: string;
  category: ProductCategory;
  quantity: number;
  checked: boolean;
  createdAt: Date;
}

export interface ShoppingListWithItems extends ShoppingList {
  items: ShoppingListItem[];
}

// ─── ScanJob ───────────────────────────────────────────

export interface ScanJob {
  id: string;
  source: string;
  status: ScanJobStatus;
  startedAt: Date;
  completedAt: Date | null;
  itemsFound: number;
  imagesProcessed: number;
  errors: unknown[];
  createdAt: Date;
}

// ─── SavedRoute ────────────────────────────────────────

export interface RouteStore {
  storeId: string;
  name: string;
  brand: Brand;
  address: string;
  latitude: number;
  longitude: number;
  articles: string[];
}

export interface SavedRoute {
  id: string;
  userId: string;
  name: string | null;
  stores: RouteStore[];
  estimatedSavings: number;
  geojson: GeoJSON.FeatureCollection;
  estimatedDurationMin: number | null;
  estimatedDistanceKm: number | null;
  createdAt: Date;
}

// ─── Coords ────────────────────────────────────────────

export interface Coords {
  lat: number;
  lng: number;
}

// ─── GeoJSON minimal (pour eviter dependance @types/geojson en shared) ─

export namespace GeoJSON {
  export interface FeatureCollection {
    type: 'FeatureCollection';
    features: Feature[];
  }
  export interface Feature {
    type: 'Feature';
    geometry: Geometry;
    properties: Record<string, unknown>;
  }
  export interface Geometry {
    type: string;
    coordinates: unknown;
  }
}
