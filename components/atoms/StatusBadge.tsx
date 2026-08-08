import type { AnyStatus } from '@/lib/types/status';
import { STATUS_LABEL_MAP, STATUS_TOKEN_MAP } from '@/lib/types/status';
import { cn } from '@/lib/utils/cn';
import { StatusIcon } from './StatusIcon';

interface StatusBadgeProps {
  status: AnyStatus;
  /** Libellé personnalisé (ex. "Jamais exécuté") — sinon le libellé par défaut du statut. */
  label?: string;
  /** Version compacte (icône seule, libellé en `title`) — utilisée par ChainStatusChip. */
  compact?: boolean;
  className?: string;
}

const TOKEN_CLASSES: Record<string, string> = {
  success: 'bg-status-success-bg text-status-success-fg border-status-success-border',
  warning: 'bg-status-warning-bg text-status-warning-fg border-status-warning-border',
  error: 'bg-status-error-bg text-status-error-fg border-status-error-border',
  info: 'bg-status-info-bg text-status-info-fg border-status-info-border',
  neutral: 'bg-status-neutral-bg text-status-neutral-fg border-status-neutral-border',
};

/**
 * Icône + libellé texte + fond teinté ("soft badge", docs/PALETTE.md §1) — jamais une couleur
 * seule (WCAG 1.4.1). `aria-label` explicite pour les lecteurs d'écran.
 */
export function StatusBadge({ status, label, compact = false, className }: StatusBadgeProps) {
  const token = STATUS_TOKEN_MAP[status];
  const text = label ?? STATUS_LABEL_MAP[status];

  return (
    <span
      role="status"
      aria-label={`Statut : ${text}`}
      title={compact ? text : undefined}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        compact ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        TOKEN_CLASSES[token],
        className,
      )}
    >
      <StatusIcon status={status} size={compact ? 12 : 14} />
      {!compact && <span>{text}</span>}
    </span>
  );
}
