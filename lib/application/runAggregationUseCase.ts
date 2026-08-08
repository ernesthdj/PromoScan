// lib/application/runAggregationUseCase.ts
//
// Recalcule le statut agrégé d'un CollectionRun à partir de ses CollectionRunChain enfants
// (docs/ARCHITECTURE.md §6 : "nécessaire car le statut global n'est plus fixé par un seul
// processus orchestrateur mais reconstruit à partir d'écritures indépendantes"). Fonction pure :
// reçoit l'état des enfants en paramètre, ne touche pas la DB (l'appelant — infrastructure — lit
// et écrit).
//
// Décision de conception non explicitement tranchée par ARCHITECTURE.md : comment `format_drift`
// compte dans l'agrégat. US-F1-06 DoD (pré-normalisation CollectionRunChain) définissait
// seulement complete/partial/failed pour un succès/échec binaire par enseigne. `format_drift`
// n'est ni un crash technique (l'adaptateur a fonctionné, la politique de sécurité a juste refusé
// l'upsert) ni un succès plein (aucune donnée nouvelle n'a été écrite). Décision retenue ici
// (documentée, à valider par QA #7 si le comportement observé en production semble surprenant) :
// - "complete"  : TOUTES les enseignes sont "complete"
// - "failed"    : TOUTES les enseignes sont "failed" (aucune n'a pu être traitée, RG US-F1-06)
// - "partial"   : tout le reste (mélange complete/format_drift/failed) — le run s'est déroulé
//                 mais au moins une enseigne n'a pas contribué de nouvelles données
// - "running"   : au moins une enseigne n'a pas encore atteint un état terminal

export type ChainTerminalStatus = 'pending' | 'running' | 'complete' | 'failed' | 'format_drift';
export type AggregatedRunStatus = 'running' | 'partial' | 'complete' | 'failed';

export interface ChainStateInput {
  status: ChainTerminalStatus;
}

const TERMINAL_STATUSES = new Set<ChainTerminalStatus>(['complete', 'failed', 'format_drift']);

export function computeAggregatedRunStatus(chains: ChainStateInput[]): AggregatedRunStatus {
  if (chains.length === 0) {
    // Aucune CollectionRunChain enregistrée pour l'instant (juste créé) : le run est en cours.
    return 'running';
  }

  const allTerminal = chains.every((chain) => TERMINAL_STATUSES.has(chain.status));
  if (!allTerminal) {
    return 'running';
  }

  const allComplete = chains.every((chain) => chain.status === 'complete');
  if (allComplete) {
    return 'complete';
  }

  const allFailed = chains.every((chain) => chain.status === 'failed');
  if (allFailed) {
    return 'failed';
  }

  return 'partial';
}

/** Un run est "terminé" (finishedAt à poser) dès que toutes ses chaînes sont en état terminal. */
export function isRunComplete(chains: ChainStateInput[]): boolean {
  return chains.length > 0 && chains.every((chain) => TERMINAL_STATUSES.has(chain.status));
}
