import { cn } from '@/lib/utils/cn';

interface SpinnerProps {
  size?: number;
  className?: string;
  label?: string;
}

/**
 * Spinner générique utilisé dans `Button` (état loading) — volontairement distinct visuellement
 * de l'icône `StatusIcon status="running"` (anneau plein vs icône `Loader2`) pour que badge et
 * bouton restent perceptiblement différents (UI-DESIGN §4.1 étape 4). Respecte
 * `prefers-reduced-motion` via `motion-safe:`.
 */
export function Spinner({ size = 14, className, label = 'Chargement en cours' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn('inline-block motion-safe:animate-spin rounded-full border-2 border-current border-t-transparent', className)}
      style={{ width: size, height: size }}
    />
  );
}
