// lib/application/collectChainUseCase.ts
//
// Orchestration fetch -> validate -> drift -> upsert POUR UNE enseigne (docs/ARCHITECTURE.md §5.1,
// §6). Dépend uniquement de lib/domain/ (contrats purs) — jamais d'import Prisma/Next.js direct :
// la persistance est injectée via l'interface ChainRunRepository, implémentée en
// lib/infrastructure/repositories/. C'est ce découpage qui permet de réutiliser exactement la
// même logique entre le cron (`/api/cron/collect-promotions/[chain]`) et le déclenchement manuel
// (`/api/collections/trigger`), conformément à US-F1-11 DoD ("réutilise exactement la même
// logique métier que le cron").

import type { RawPromotion, StoreAdapter } from '../domain/StoreAdapter';
import { evaluateFormatDrift } from '../domain/formatDriftPolicy';
import { rawPromotionSchema } from '../domain/promotionSchema';

/**
 * Port (au sens Clean Architecture / hexagonal) vers la persistance, implémenté en
 * infrastructure. Le use case ne connaît que cette interface.
 */
export interface ChainRunRepository {
  /**
   * Nombre d'items du dernier CollectionRunChain "complete" de cette enseigne (toutes runs
   * confondues), ou `null` si aucun run "complete" n'existe encore (1er run — cf. formatDriftPolicy).
   */
  getLastSuccessfulItemsCount(storeChainId: string): Promise<number | null>;
  /**
   * Upsert idempotent des promotions validées, clé (storeChainId, rawProductName, validFrom).
   * Retourne le nombre d'items effectivement écrits.
   */
  upsertPromotions(storeChainId: string, promotions: RawPromotion[]): Promise<number>;
}

export interface CollectChainInput {
  storeChainId: string;
  formatDriftThreshold: number;
  adapter: StoreAdapter;
  repository: ChainRunRepository;
  /**
   * Callback optionnel appelé pour chaque RawPromotion rejetée par la validation Zod — permet au
   * caller de logger un statut/compteur sans jamais logger le contenu brut scrapé (règle sécurité
   * FOUNDATION §7 : "Logger uniquement statut/nombre d'items/code d'erreur, jamais le contenu brut").
   */
  onValidationReject?: (issueCount: number) => void;
}

export type ChainRunOutcomeStatus = 'complete' | 'format_drift' | 'failed';

export interface CollectChainResult {
  status: ChainRunOutcomeStatus;
  itemsCollected: number | null;
  /** Code/statut court, jamais de contenu brut scrapé. */
  errorMessage: string | null;
}

export async function collectChainUseCase(input: CollectChainInput): Promise<CollectChainResult> {
  const { storeChainId, formatDriftThreshold, adapter, repository, onValidationReject } = input;

  let rawItems: RawPromotion[];
  try {
    rawItems = await adapter.fetchPromotions();
  } catch (error) {
    // RG-3 (FOUNDATION) : un échec d'enseigne (réseau, timeout, parsing) ne bloque jamais les
    // autres — cette erreur reste locale à cette invocation.
    return {
      status: 'failed',
      itemsCollected: null,
      errorMessage: toSafeErrorMessage(error),
    };
  }

  const validated: RawPromotion[] = [];
  let rejectedCount = 0;
  for (const item of rawItems) {
    const parsed = rawPromotionSchema.safeParse(item);
    if (parsed.success) {
      validated.push(parsed.data);
    } else {
      rejectedCount += 1;
    }
  }
  if (rejectedCount > 0) {
    onValidationReject?.(rejectedCount);
  }

  let baseline: number | null;
  try {
    baseline = await repository.getLastSuccessfulItemsCount(storeChainId);
  } catch (error) {
    return { status: 'failed', itemsCollected: null, errorMessage: toSafeErrorMessage(error) };
  }

  const drift = evaluateFormatDrift({
    itemsCollected: validated.length,
    baseline,
    threshold: formatDriftThreshold,
  });

  if (drift.classification === 'first_run_zero_failure') {
    // 1er run de l'enseigne, 0 résultat : échec technique classique (rien à comparer pour
    // qualifier une "dérive"), pas d'upsert.
    return { status: 'failed', itemsCollected: 0, errorMessage: 'zero_results_no_baseline' };
  }

  if (drift.classification === 'format_drift') {
    // Aucun upsert : le catalogue existant reste inchangé (US-F1-07 DoD).
    return {
      status: 'format_drift',
      itemsCollected: validated.length,
      errorMessage: null,
    };
  }

  try {
    const written = await repository.upsertPromotions(storeChainId, validated);
    return { status: 'complete', itemsCollected: written, errorMessage: null };
  } catch (error) {
    return { status: 'failed', itemsCollected: null, errorMessage: toSafeErrorMessage(error) };
  }
}

/**
 * Ne jamais propager le message d'erreur brut (peut contenir des fragments de contenu scrapé ou
 * des détails d'implémentation) — uniquement un code court, conforme à la règle sécurité
 * FOUNDATION §7 sur les logs de collecte.
 */
function toSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // On conserve le nom de l'erreur (ex. "TimeoutError") mais pas son message complet, qui peut
    // embarquer une URL avec des paramètres sensibles ou un extrait de page.
    return error.name || 'unknown_error';
  }
  return 'unknown_error';
}
