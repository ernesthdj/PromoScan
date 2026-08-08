/**
 * PromoLayout — Layout page promotions.
 * Filtres en haut + grille de promos.
 */

import type { ReactNode } from 'react';
import clsx from 'clsx';

interface PromoLayoutProps {
  filters: ReactNode;
  children: ReactNode;
  title?: string;
  className?: string;
}

export function PromoLayout({ filters, children, title, className }: PromoLayoutProps) {
  return (
    <div className={clsx('flex flex-col gap-4', className)}>
      {title && (
        <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
      )}
      <div className="sticky top-0 z-10 bg-neutral-50 py-2">{filters}</div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
