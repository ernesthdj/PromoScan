import type { RunStatus } from '@/lib/types/status';
import { StatusBadge, RelativeTime } from '@/components/atoms';

interface RunSummaryHeaderProps {
  status: RunStatus;
  /** `weekKey` (ex. "2026-W32") ou "Déclenchement manuel" si run manuel. */
  label: string;
  timestamp: string;
}

/** Utilisé en Zone A (dernier run global) et en tête de chaque `RunRow` (UI-DESIGN §3.2). */
export function RunSummaryHeader({ status, label, timestamp }: RunSummaryHeaderProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatusBadge status={status} />
      <span className="font-medium text-base-text">{label}</span>
      <RelativeTime iso={timestamp} className="text-sm text-base-text-secondary" />
    </div>
  );
}
