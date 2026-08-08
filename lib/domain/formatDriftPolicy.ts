// lib/domain/formatDriftPolicy.ts
//
// Fonction pure implémentant la règle de dérive de format (US-F1-07, décision Architecte #1 —
// docs/ARCHITECTURE.md §4). Aucun accès DB direct : reçoit la baseline en paramètre, ce qui la
// rend testable isolément par le Test Engineer (#6) sans mock d'infrastructure.
//
// Règle retenue (ARCHITECTURE §4) :
//   SI aucune baseline n'existe (1er run de l'enseigne) :
//       -> pas de détection de dérive possible
//       -> un résultat à 0 sur ce premier run est un échec technique classique ("failed"),
//          jamais une "dérive de format" (rien à comparer)
//   SINON :
//       SI itemsCollected == 0                                              -> format_drift (absolu)
//       SI itemsCollected < baseline * (1 - formatDriftThreshold)           -> format_drift
//       SINON                                                                -> accepted

export interface FormatDriftInput {
  /** Nombre d'items valides extraits lors de ce run, pour cette enseigne. */
  itemsCollected: number;
  /**
   * Nombre d'items du dernier CollectionRunChain "complete" de cette enseigne (run N-1 ou
   * antérieur). `null` si aucun run "complete" n'existe encore pour cette enseigne (1er run).
   */
  baseline: number | null;
  /** StoreChain.formatDriftThreshold — seuil relatif de baisse tolérée (0.5 = -50%). */
  threshold: number;
}

export type FormatDriftClassification =
  | 'accepted' // résultat cohérent, upsert autorisé
  | 'format_drift' // dérive détectée, aucun upsert, catalogue existant conservé
  | 'first_run_zero_failure'; // 1er run à 0 résultat : échec technique classique, pas une dérive

export interface FormatDriftResult {
  classification: FormatDriftClassification;
  /** Raccourci pratique : true uniquement si classification === 'format_drift'. */
  isDrift: boolean;
}

export function evaluateFormatDrift(input: FormatDriftInput): FormatDriftResult {
  const { itemsCollected, baseline, threshold } = input;

  if (baseline === null) {
    // Aucune baseline : impossible de juger d'une dérive. Un 0 ici n'est pas "moins qu'avant"
    // (rien à comparer) — c'est traité comme un échec technique classique par l'appelant
    // (collectChainUseCase), conformément à ARCHITECTURE §4.
    if (itemsCollected === 0) {
      return { classification: 'first_run_zero_failure', isDrift: false };
    }
    return { classification: 'accepted', isDrift: false };
  }

  // Cas absolu, non configurable, même si le seuil relatif configuré serait plus permissif.
  if (itemsCollected === 0) {
    return { classification: 'format_drift', isDrift: true };
  }

  if (itemsCollected < baseline * (1 - threshold)) {
    return { classification: 'format_drift', isDrift: true };
  }

  return { classification: 'accepted', isDrift: false };
}
