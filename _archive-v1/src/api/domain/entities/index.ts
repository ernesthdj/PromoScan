/**
 * Entites domaine — Interfaces pures sans dependance framework.
 * Les repositories et services domain ne travaillent qu'avec ces interfaces.
 */

import type { Brand, ProductCategory, ScanJobStatus, UserRole } from '../../../shared/enums';

// ─── Repository Interfaces (ports) ─────────────────────

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  create(data: CreateUserData): Promise<UserEntity>;
  update(id: string, data: Partial<UpdateUserData>): Promise<UserEntity>;
  delete(id: string): Promise<void>;
}

export interface IRefreshTokenRepository {
  create(data: { userId: string; tokenHash: string; expiresAt: Date }): Promise<void>;
  findByHash(tokenHash: string): Promise<RefreshTokenEntity | null>;
  deleteByHash(tokenHash: string): Promise<void>;
  deleteAllForUser(userId: string): Promise<void>;
}

export interface IShoppingListRepository {
  findById(id: string): Promise<ShoppingListEntity | null>;
  findByIdWithItems(id: string): Promise<ShoppingListWithItemsEntity | null>;
  findByUserId(userId: string): Promise<ShoppingListEntity[]>;
  countByUserId(userId: string): Promise<number>;
  create(data: { userId: string; name: string }): Promise<ShoppingListEntity>;
  update(id: string, data: { name?: string; isArchived?: boolean }): Promise<ShoppingListEntity>;
  delete(id: string): Promise<void>;
}

export interface IShoppingListItemRepository {
  findById(id: string): Promise<ShoppingListItemEntity | null>;
  findByListId(listId: string): Promise<ShoppingListItemEntity[]>;
  findDuplicate(listId: string, productName: string): Promise<ShoppingListItemEntity | null>;
  create(data: CreateItemData): Promise<ShoppingListItemEntity>;
  update(id: string, data: Partial<UpdateItemData>): Promise<ShoppingListItemEntity>;
  delete(id: string): Promise<void>;
  uncheckAll(listId: string): Promise<void>;
}

export interface IPromotionRepository {
  findActive(filters: PromotionQueryFilters): Promise<{ items: PromotionEntity[]; total: number }>;
  findById(id: string): Promise<PromotionWithStoreEntity | null>;
  findActiveByCategory(categories?: ProductCategory[]): Promise<PromotionWithStoreEntity[]>;
  findActiveForMatching(): Promise<PromotionWithStoreEntity[]>;
}

export interface IStoreRepository {
  findById(id: string): Promise<StoreEntity | null>;
  findByIds(ids: string[]): Promise<StoreEntity[]>;
  findByBrand(brand: Brand): Promise<StoreEntity[]>;
  findNearby(lat: number, lng: number, radiusKm: number): Promise<StoreEntity[]>;
}

export interface IProductRepository {
  search(query: string, limit: number): Promise<ProductEntity[]>;
  findByName(name: string): Promise<ProductEntity | null>;
}

export interface IRouteRepository {
  findByUserId(userId: string, page: number, limit: number): Promise<{ items: SavedRouteEntity[]; total: number }>;
  countByUserId(userId: string): Promise<number>;
  create(data: CreateRouteData): Promise<SavedRouteEntity>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<SavedRouteEntity | null>;
}

export interface IScanJobRepository {
  findAll(filters: ScanJobQueryFilters): Promise<{ items: ScanJobEntity[]; total: number }>;
  findById(id: string): Promise<ScanJobEntity | null>;
  create(data: { source: string }): Promise<ScanJobEntity>;
  update(id: string, data: Partial<UpdateScanJobData>): Promise<ScanJobEntity>;
}

export interface IGeocodeCache {
  findByPostalCode(postalCode: string): Promise<GeocodeCacheEntry | null>;
  upsert(data: GeocodeCacheEntry): Promise<void>;
  searchPostalCodes(query: string): Promise<PostalCodeEntry[]>;
}

export interface IEmailService {
  sendWelcomeEmail(to: string): Promise<void>;
}

// ─── Entity Types ──────────────────────────────────────

export interface UserEntity {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  zoneCodePostal: string | null;
  zoneCommune: string | null;
  zoneLatitude: number | null;
  zoneLongitude: number | null;
  preferences: { w1: number; w2: number; w3: number };
  rgpdConsent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefreshTokenEntity {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface ShoppingListEntity {
  id: string;
  userId: string;
  name: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShoppingListItemEntity {
  id: string;
  listId: string;
  productName: string;
  category: ProductCategory;
  quantity: number;
  checked: boolean;
  createdAt: Date;
}

export interface ShoppingListWithItemsEntity extends ShoppingListEntity {
  items: ShoppingListItemEntity[];
}

export interface PromotionEntity {
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

export interface PromotionWithStoreEntity extends PromotionEntity {
  store: StoreEntity;
}

export interface StoreEntity {
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

export interface ProductEntity {
  id: string;
  name: string;
  category: ProductCategory;
  aliases: string[];
  unit: string | null;
  createdAt: Date;
}

export interface SavedRouteEntity {
  id: string;
  userId: string;
  name: string | null;
  stores: unknown;
  estimatedSavings: number;
  geojson: unknown;
  estimatedDurationMin: number | null;
  estimatedDistanceKm: number | null;
  createdAt: Date;
}

export interface ScanJobEntity {
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

export interface GeocodeCacheEntry {
  postalCode: string;
  commune: string;
  latitude: number;
  longitude: number;
  cachedAt: Date;
}

export interface PostalCodeEntry {
  postalCode: string;
  commune: string;
}

// ─── Data Transfer for Creates/Updates ─────────────────

export interface CreateUserData {
  email: string;
  passwordHash: string;
  zoneCodePostal?: string;
  zoneCommune?: string;
  zoneLatitude?: number;
  zoneLongitude?: number;
  rgpdConsent: boolean;
}

export interface UpdateUserData {
  email: string;
  passwordHash: string;
  zoneCodePostal: string | null;
  zoneCommune: string | null;
  zoneLatitude: number | null;
  zoneLongitude: number | null;
  preferences: { w1: number; w2: number; w3: number };
}

export interface CreateItemData {
  listId: string;
  productName: string;
  category: ProductCategory;
  quantity: number;
}

export interface UpdateItemData {
  category: ProductCategory;
  quantity: number;
  checked: boolean;
}

export interface CreateRouteData {
  userId: string;
  name?: string;
  stores: unknown;
  estimatedSavings: number;
  geojson: unknown;
  estimatedDurationMin: number;
  estimatedDistanceKm: number;
}

export interface UpdateScanJobData {
  status: ScanJobStatus;
  completedAt: Date;
  itemsFound: number;
  imagesProcessed: number;
  errors: unknown[];
}

export interface PromotionQueryFilters {
  category?: ProductCategory;
  brand?: Brand;
  page: number;
  limit: number;
}

export interface ScanJobQueryFilters {
  status?: ScanJobStatus;
  page: number;
  limit: number;
}
