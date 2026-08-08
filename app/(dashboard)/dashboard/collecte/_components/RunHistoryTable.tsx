'use client';

import { useState } from 'react';
import { EmptyState, PaginationControls, SkeletonRow } from '@/components/atoms';
import { RunRow } from '@/components/molecules';
import { chainName, RUN_HISTORY_PAGE_SIZE } from './constants';
import { useCollectionRunsQuery } from './hooks';

/**
 * Historique paginé (US-F1-10). Tri fixe décroissant par `startedAt` (déjà garanti côté serveur,
 * cf. docs/API-ENDPOINTS.md §3) — pas de tri configurable (YAGNI, UI-DESIGN §4.3).
 *
 * Note de simplification (Selfdoubt) : UI-DESIGN §2.1/§2.3 distingue un rendu "tableau" desktop
 * et "carte" mobile pour cette zone. `RunRow` (molecule) utilise un layout flexbox qui s'adapte
 * déjà nativement du desktop au mobile (empilement automatique par `flex-wrap`) sans nécessiter
 * deux arborescences de markup distinctes (table HTML vs carte) — plus simple à maintenir pour un
 * gain visuel jugé marginal sur ce dashboard technique. Si un rendu tabulaire strict (colonnes
 * alignées) s'avère nécessaire à l'usage, c'est un changement localisé à `RunRow` uniquement.
 */
export function RunHistoryTable() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useCollectionRunsQuery(page, RUN_HISTORY_PAGE_SIZE);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / RUN_HISTORY_PAGE_SIZE)) : 1;

  return (
    <section aria-labelledby="run-history-heading" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 id="run-history-heading" className="text-lg font-semibold text-base-text">
          Historique des runs
        </h2>
        {data && <span className="text-sm text-base-text-secondary">{data.total} runs</span>}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2" aria-label="Chargement de l'historique">
          {Array.from({ length: 5 }, (_, index) => (
            <SkeletonRow key={index} className="h-16 w-full" />
          ))}
        </div>
      ) : isError ? (
        <p role="alert" className="text-sm text-status-error-fg">
          Impossible de charger l&apos;historique des runs.
        </p>
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="Aucune collecte n'a encore été effectuée" />
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {data.items.map((run) => (
              <RunRow
                key={run.id}
                status={run.status}
                label={run.weekKey ?? 'Déclenchement manuel'}
                startedAt={run.startedAt}
                trigger={run.trigger}
                chains={run.chains.map((chain) => ({
                  chainSlug: chain.chainSlug,
                  chainName: chainName(chain.chainSlug),
                  status: chain.status,
                  itemsCollected: chain.itemsCollected,
                  error: chain.error,
                }))}
              />
            ))}
          </div>
          <PaginationControls
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((current) => Math.max(1, current - 1))}
            onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
          />
        </>
      )}
    </section>
  );
}
