// lib/infrastructure/adapters/index.ts
//
// Registry slug -> StoreAdapter (docs/ARCHITECTURE.md §3). Le handler de route ne construit
// jamais un adaptateur directement : il passe toujours par ce registry, après avoir validé le
// `chainSlug` contre StoreChain.slug en base (jamais confiance à une valeur brute d'URL/body —
// ARCHITECTURE §7).

import type { StoreAdapter } from '../../domain/StoreAdapter';
import { createAldiAdapter } from './AldiAdapter';
import { createColruytAdapter } from './ColruytAdapter';
import { createDelhaizeAdapter } from './DelhaizeAdapter';
import { createLidlAdapter } from './LidlAdapter';

const adapterFactories: Record<string, () => StoreAdapter> = {
  colruyt: createColruytAdapter,
  aldi: createAldiAdapter,
  delhaize: createDelhaizeAdapter,
  lidl: createLidlAdapter,
};

export function getStoreAdapter(chainSlug: string): StoreAdapter | null {
  const factory = adapterFactories[chainSlug];
  return factory ? factory() : null;
}

export const SUPPORTED_CHAIN_SLUGS = Object.keys(adapterFactories);
