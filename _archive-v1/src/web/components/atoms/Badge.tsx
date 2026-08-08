/**
 * Badge — Pastille d'information (reduction, categorie, score).
 * Variantes : discount (orange), category (gris), score (vert/jaune/rouge).
 */

import type { ReactNode } from 'react';
import clsx from 'clsx';

type BadgeVariant = 'discount' | 'category' | 'success' | 'warning' | 'error';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  discount: 'bg-secondary-100 text-secondary-700 border-secondary-200',
  category: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  success: 'bg-green-100 text-green-700 border-green-200',
  warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  error: 'bg-red-100 text-red-700 border-red-200',
};

export function Badge({ children, variant = 'category', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full',
        'text-xs font-semibold border',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
