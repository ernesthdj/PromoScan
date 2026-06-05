/**
 * Types API — Format de reponse uniforme et DTOs (Data Transfer Objects).
 */

import { Brand, ProductCategory } from '../enums';
import type {
  Coords,
  GeoJSON,
  Promotion,
  PromotionWithStore,
  SavedRoute,
  ScanJob,
  ShoppingList,
  ShoppingListItem,
  ShoppingListWithItems,
  Store,
  User,
  UserPublic,
} from './index';

// ─── Format reponse uniforme ───────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Auth DTOs ─────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: UserPublic;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  zoneCodePostal?: string;
  rgpdConsent: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

// ─── User DTOs ─────────────────────────────────────────

export interface UpdateProfileRequest {
  zoneCodePostal?: string;
  preferences?: {
    w1?: number;
    w2?: number;
    w3?: number;
  };
}

export interface ChangeEmailRequest {
  newEmail: string;
  password: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface DeleteAccountRequest {
  password: string;
}

// ─── Shopping List DTOs ────────────────────────────────

export interface CreateListRequest {
  name: string;
}

export interface UpdateListRequest {
  name: string;
}

export interface AddItemRequest {
  productName: string;
  quantity?: number;
  category?: ProductCategory;
}

export interface UpdateItemRequest {
  category?: ProductCategory;
  quantity?: number;
  checked?: boolean;
}

// ─── Promotion DTOs ────────────────────────────────────

export interface PromotionFilters {
  category?: ProductCategory;
  brand?: Brand;
  page?: number;
  limit?: number;
}

// ─── Suggestion DTOs ───────────────────────────────────

export interface SuggestionFilters {
  categories?: ProductCategory[];
  brands?: Brand[];
  day?: string; // ISO date YYYY-MM-DD
}

export interface MatchRequest {
  listId: string;
  filters?: SuggestionFilters;
}

export interface RecommendRequest {
  listId: string;
  filters?: SuggestionFilters;
}

export interface MatchResult {
  listItem: {
    id: string;
    productName: string;
    category: string;
  };
  matches: {
    promotion: Promotion;
    store: Store;
    fuzzyScore: number;
  }[];
}

export interface StoreRecommendation {
  store: Store;
  matchedItems: number;
  totalSavings: number;
  distanceKm: number;
  score: number;
  promotions: Promotion[];
}

// ─── Route DTOs ────────────────────────────────────────

export interface CalculateRouteRequest {
  storeIds: string[];
  origin?: Coords;
}

export interface RouteLeg {
  from: string;
  to: string;
  durationMin: number;
  distanceKm: number;
}

export interface RouteResult {
  orderedStores: (Store & { articles: string[] })[];
  totalSavings: number;
  totalDurationMin: number;
  totalDistanceKm: number;
  geojson: GeoJSON.FeatureCollection;
  legs: RouteLeg[];
}

export interface SaveRouteRequest {
  name?: string;
  storeIds: string[];
  geojson: GeoJSON.FeatureCollection;
  estimatedSavings: number;
  durationMin: number;
  distanceKm: number;
}

// ─── Scan Job DTOs ─────────────────────────────────────

export interface TriggerScanRequest {
  source?: string;
  brands?: Brand[];
}

// ─── Geocoding DTOs ────────────────────────────────────

export interface PostalCodeResult {
  postalCode: string;
  commune: string;
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  commune: string;
}

// ─── Pagination Query ──────────────────────────────────

export interface PaginationQuery {
  page?: number;
  limit?: number;
}
