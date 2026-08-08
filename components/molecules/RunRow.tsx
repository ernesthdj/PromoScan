'use client';

import { useId, useState } from 'react';
import type { ChainStatus, RunStatus } from '@/lib/types/status';
import { RunSummaryHeader } from './RunSummaryHeader';
import { ChainStatusChip } from './ChainStatusChip';

interface RunRowChain {
  chainSlug: string;
  chainName: string;
  status: ChainStatus;
  itemsCollected: number | null;
  error: string | null;
}

interface RunRowProps {
  status: RunStatus;
  label: string;
  startedAt: string;
  trigger: 'cron' | 'manual';
  chains: RunRowChain[];
}

/**
 * Une ligne = un `CollectionRun` : `RunSummaryHeader` + 4 `ChainStatusChip` (toujours visibles,
 * pas de clic nécessaire pour repérer une enseigne en souci — UI-DESIGN §4.3). Clic optionnel
 * pour déplier le détail, UNIQUEMENT si au moins un `errorMessage` existe (ne jamais offrir une
 * action qui ne mène nulle part, UI-DESIGN §4.3).
 */
export function RunRow({ status, label, startedAt, trigger, chains }: RunRowProps) {
  const [expanded, setExpanded] = useState(false);
  const detailId = useId();
  const errors = chains.filter((chain) => chain.error);
  const expandable = errors.length > 0;

  return (
    <div className="rounded-lg border border-base-border bg-base-surface p-3">
      <div
        role={expandable ? 'button' : undefined}
        tabIndex={expandable ? 0 : undefined}
        aria-expanded={expandable ? expanded : undefined}
        aria-controls={expandable ? detailId : undefined}
        onClick={expandable ? () => setExpanded((value) => !value) : undefined}
        onKeyDown={
          expandable
            ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setExpanded((value) => !value);
                }
              }
            : undefined
        }
        className={expandable ? 'cursor-pointer' : undefined}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase text-base-text-muted">
              {trigger === 'cron' ? '🕐 Cron' : '✋ Manuel'}
            </span>
            <RunSummaryHeader status={status} label={label} timestamp={startedAt} />
          </div>
          <div className="flex gap-3">
            {chains.map((chain) => (
              <ChainStatusChip
                key={chain.chainSlug}
                chainName={chain.chainName}
                status={chain.status}
                itemsCollected={chain.itemsCollected}
              />
            ))}
          </div>
        </div>
      </div>
      {expandable && expanded && (
        <div id={detailId} className="mt-3 space-y-1 border-t border-base-border pt-3 text-sm">
          {errors.map((chain) => (
            <p key={chain.chainSlug} className="text-status-error-fg">
              {chain.chainName} : {chain.error}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
