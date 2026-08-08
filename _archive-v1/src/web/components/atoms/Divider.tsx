/**
 * Divider — Ligne de separation horizontale ou verticale.
 */

import clsx from 'clsx';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function Divider({ orientation = 'horizontal', className }: DividerProps) {
  return (
    <hr
      className={clsx(
        'border-neutral-200',
        orientation === 'horizontal' ? 'w-full border-t' : 'h-full border-l inline-block',
        className,
      )}
    />
  );
}
