import { AlertTriangle, CheckCircle2, CircleDashed, Loader2, XCircle } from 'lucide-react';
import type { AnyStatus } from '@/lib/types/status';
import { cn } from '@/lib/utils/cn';

interface StatusIconProps {
  status: AnyStatus;
  size?: number;
  className?: string;
}

/**
 * Icône seule par statut — forme distincte par statut (pas seulement la couleur), cf.
 * docs/PALETTE.md §2. `format_drift` utilise un triangle, jamais le cercle-croix de `failed`
 * (exigence explicite ARCHITECTURE §7/§8 relayée par UI-DESIGN §5). `running` est le seul statut
 * animé, et respecte `prefers-reduced-motion` via la variante Tailwind `motion-safe:`.
 */
export function StatusIcon({ status, size = 16, className }: StatusIconProps) {
  const commonProps = { size, 'aria-hidden': true as const };

  switch (status) {
    case 'complete':
      return <CheckCircle2 {...commonProps} className={cn('text-status-success-fg', className)} />;
    case 'format_drift':
    case 'partial':
      return <AlertTriangle {...commonProps} className={cn('text-status-warning-fg', className)} />;
    case 'failed':
      return <XCircle {...commonProps} className={cn('text-status-error-fg', className)} />;
    case 'running':
      return (
        <Loader2
          {...commonProps}
          className={cn('text-status-info-fg motion-safe:animate-spin', className)}
        />
      );
    case 'pending':
      return <CircleDashed {...commonProps} className={cn('text-status-neutral-fg', className)} />;
    default:
      return null;
  }
}
