import type { ChainStatus } from '@/lib/types/status';
import { StatusBadge } from '@/components/atoms';

interface ChainStatusChipProps {
  chainName: string;
  status: ChainStatus;
  itemsCollected: number | null;
}

/**
 * Version compacte de `StatusBadge` (icône + count seulement, libellé complet en tooltip) —
 * utilisée dans les colonnes enseignes du tableau d'historique pour tenir 4 statuts sur une ligne
 * dense (UI-DESIGN §3.2). Le nom de l'enseigne + le libellé complet restent dans `aria-label`
 * (porté par StatusBadge) pour l'accessibilité même en version compacte.
 */
export function ChainStatusChip({ chainName, status, itemsCollected }: ChainStatusChipProps) {
  return (
    <div className="flex flex-col items-center gap-0.5" title={chainName}>
      <span className="text-[11px] font-medium text-base-text-secondary">{chainName}</span>
      <StatusBadge status={status} compact />
      {itemsCollected !== null && <span className="text-[11px] text-base-text-muted">{itemsCollected}</span>}
    </div>
  );
}
