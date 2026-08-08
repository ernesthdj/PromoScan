// lib/types/api.ts
//
// Types de réponse HTTP — miroir des formes JSON exactes documentées dans docs/API-ENDPOINTS.md
// et de app/api/collections/status/route.ts. Ces types décrivent le contrat de la frontière
// réseau (ce que le serveur sérialise), pas les entités Prisma — une redéfinition légitime côté
// client (le "pas de redéfinition de types" des Notes transverses d'API-ENDPOINTS.md concerne le
// partage des schémas Zod entre modules serveur, pas le typage d'une réponse JSON consommée par
// un client HTTP séparé).

import type { ChainStatus, RunStatus } from './status';

export interface PromotionItem {
  id: string;
  storeChain: string;
  rawProductName: string;
  category: string | null;
  unitLabel: string | null;
  regularPrice: number | null;
  promoPrice: number;
  discountPercent: number | null;
  pricePerUnit: number | null;
  validFrom: string;
  validTo: string;
}

export interface PromotionsResponse {
  items: PromotionItem[];
  total: number;
  page: number;
}

export interface CollectionRunChainSummary {
  chainSlug: string;
  status: ChainStatus;
  itemsCollected: number | null;
  error: string | null;
}

export interface CollectionRunItem {
  id: string;
  weekKey: string | null;
  trigger: 'cron' | 'manual';
  startedAt: string;
  finishedAt: string | null;
  status: RunStatus;
  chains: CollectionRunChainSummary[];
}

export interface CollectionRunsResponse {
  items: CollectionRunItem[];
  total: number;
}

export interface CollectionStatusEntry {
  chainSlug: string;
  status: ChainStatus;
  itemsCollected: number | null;
  updatedAt: string | null;
  runId: string | null;
}

export interface CollectionsStatusResponse {
  chains: CollectionStatusEntry[];
}

export interface TriggerChainResult {
  chainSlug: string;
  status: ChainStatus;
  itemsCollected: number | null;
}

export interface TriggerResponse {
  runId: string;
  trigger: 'manual';
  chains: TriggerChainResult[];
}
