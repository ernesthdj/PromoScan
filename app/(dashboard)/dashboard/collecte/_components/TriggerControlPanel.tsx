'use client';

import { Button, SkeletonRow } from '@/components/atoms';
import { ChainTriggerRow } from '@/components/molecules';
import type { ToastRequest } from '@/lib/hooks/useToastQueue';
import { STORE_CHAINS } from './constants';
import { useCollectionsStatusQuery, useTriggerCollectionMutation } from './hooks';

interface TriggerControlPanelProps {
  pushToast: (toast: ToastRequest) => void;
}

/**
 * Bouton global + 4 `ChainTriggerRow` (UI-DESIGN §3.3/§4.1/§4.2). État courant dérivé de
 * `GET /api/collections/status` (endpoint ajouté par le Backend, cf. JOURNAL SESSION 3).
 */
export function TriggerControlPanel({ pushToast }: TriggerControlPanelProps) {
  const statusQuery = useCollectionsStatusQuery();
  const triggerMutation = useTriggerCollectionMutation(pushToast);

  const chainsBySlug = new Map((statusQuery.data?.chains ?? []).map((chain) => [chain.chainSlug, chain]));
  const anyChainRunning = Array.from(chainsBySlug.values()).some((chain) => chain.status === 'running');

  // Enseigne ciblée par la mutation en cours (undefined si mutation "toutes enseignes" ou aucune
  // mutation en vol) — sert à distinguer le loading du bouton global de celui d'une ligne unique.
  const pendingChainSlug = triggerMutation.isPending ? triggerMutation.variables : undefined;
  const globalPending = triggerMutation.isPending && pendingChainSlug === undefined;

  return (
    <section aria-labelledby="trigger-panel-heading" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="trigger-panel-heading" className="text-lg font-semibold text-base-text">
          Contrôle de collecte
        </h2>
        <Button
          variant="primary"
          loading={globalPending}
          loadingLabel="Lancement…"
          disabled={anyChainRunning || triggerMutation.isPending}
          disabledReason={anyChainRunning ? 'Une collecte est déjà en cours pour au moins une enseigne' : undefined}
          onClick={() => triggerMutation.mutate(undefined)}
        >
          Déclencher toutes les enseignes
        </Button>
      </div>

      {statusQuery.isLoading ? (
        <div className="flex flex-col gap-2" aria-label="Chargement de l'état des enseignes">
          {STORE_CHAINS.map((chain) => (
            <SkeletonRow key={chain.slug} className="h-14 w-full" />
          ))}
        </div>
      ) : statusQuery.isError ? (
        <p role="alert" className="text-sm text-status-error-fg">
          Impossible de charger l&apos;état des enseignes.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {STORE_CHAINS.map((chain) => {
            const current = chainsBySlug.get(chain.slug);
            return (
              <li key={chain.slug}>
                <ChainTriggerRow
                  chainName={chain.name}
                  status={current?.status ?? 'pending'}
                  itemsCollected={current?.itemsCollected ?? null}
                  updatedAt={current?.updatedAt ?? null}
                  triggerPending={pendingChainSlug === chain.slug}
                  onTrigger={() => triggerMutation.mutate(chain.slug)}
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
