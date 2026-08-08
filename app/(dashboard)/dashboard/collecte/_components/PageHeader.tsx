'use client';

import { RunSummaryHeader } from '@/components/molecules';
import { useCollectionRunsQuery } from './hooks';

/**
 * Titre + résumé du dernier run global (UI-DESIGN §3.3 : "Dérivé du 1er élément de
 * GET /api/collection-runs"). Requête dédiée `page=1&limit=1`, indépendante de la pagination de
 * `RunHistoryTable` : si l'utilisateur navigue vers la page 3 de l'historique, le header doit
 * toujours refléter le run le plus récent globalement, pas le 1er élément de la page courante.
 */
export function PageHeader() {
  const { data, isLoading } = useCollectionRunsQuery(1, 1);
  const lastRun = data?.items[0];

  return (
    <header className="flex flex-col gap-2 border-b border-base-border pb-4">
      <h1 className="text-xl font-semibold text-base-text">PromoScan · Collecte</h1>
      {isLoading ? (
        <p className="text-sm text-base-text-secondary">Chargement du dernier run…</p>
      ) : lastRun ? (
        <div className="flex items-center gap-2 text-sm text-base-text-secondary">
          <span>Dernier run :</span>
          <RunSummaryHeader
            status={lastRun.status}
            label={lastRun.weekKey ?? 'Déclenchement manuel'}
            timestamp={lastRun.startedAt}
          />
        </div>
      ) : (
        <p className="text-sm text-base-text-secondary">Aucune collecte n&apos;a encore été effectuée.</p>
      )}
    </header>
  );
}
