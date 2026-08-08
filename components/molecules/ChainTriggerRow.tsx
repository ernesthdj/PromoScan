import type { ChainStatus } from '@/lib/types/status';
import { StatusBadge, Button, RelativeTime } from '@/components/atoms';

interface ChainTriggerRowProps {
  chainName: string;
  status: ChainStatus;
  itemsCollected: number | null;
  updatedAt: string | null;
  /** Mutation de déclenchement en cours pour CETTE ligne précisément (vs une autre enseigne). */
  triggerPending: boolean;
  onTrigger: () => void;
}

/**
 * `StatusBadge` + nom enseigne + `itemsCollected` + `RelativeTime` + bouton "Déclencher"
 * (UI-DESIGN §3.2). Bouton désactivé si cette enseigne est `running` (indépendance des 4 process,
 * ARCHITECTURE §5.2) — voir _components/hooks.ts pour la justification du traitement de `pending`
 * comme état NON bloquant (incohérence corrigée vs une lecture littérale de UI-DESIGN §5).
 */
export function ChainTriggerRow({
  chainName,
  status,
  itemsCollected,
  updatedAt,
  triggerPending,
  onTrigger,
}: ChainTriggerRowProps) {
  const blocked = status === 'running';
  const disabled = blocked || triggerPending;
  const neverRun = status === 'pending' && !updatedAt;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-base-border bg-base-surface p-3 sm:p-4">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-medium text-base-text">{chainName}</span>
        <StatusBadge status={status} label={neverRun ? 'Jamais exécuté' : undefined} />
        {itemsCollected !== null && (
          <span className="text-sm text-base-text-secondary">{itemsCollected} items</span>
        )}
        {updatedAt && <RelativeTime iso={updatedAt} className="text-sm text-base-text-secondary" />}
      </div>
      <Button
        variant="secondary"
        size="sm"
        loading={triggerPending}
        loadingLabel="Lancement…"
        disabled={disabled}
        disabledReason={blocked ? `Collecte en cours pour ${chainName}` : undefined}
        onClick={onTrigger}
        className="w-full sm:w-auto"
      >
        Déclencher
      </Button>
    </div>
  );
}
