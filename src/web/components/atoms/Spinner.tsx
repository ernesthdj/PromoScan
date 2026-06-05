/**
 * Spinner — Indicateur de chargement accessible.
 * Tailles : sm (16px), md (24px), lg (40px).
 */

import clsx from 'clsx';

type SpinnerSize = 'sm' | 'md' | 'lg';

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-3',
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Chargement"
      className={clsx(
        'inline-block rounded-full border-neutral-300 border-t-primary-500',
        'animate-spin',
        sizeClasses[size],
        className,
      )}
    >
      <span className="sr-only">Chargement...</span>
    </div>
  );
}
