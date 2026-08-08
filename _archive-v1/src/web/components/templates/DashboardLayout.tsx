/**
 * DashboardLayout — Layout dashboard avec grille responsive.
 * Desktop : 2 colonnes (62/38 phi ratio). Mobile : empile.
 */

import type { ReactNode } from 'react';
import clsx from 'clsx';

interface DashboardLayoutProps {
  main: ReactNode;
  aside: ReactNode;
  title?: string;
  className?: string;
}

export function DashboardLayout({ main, aside, title, className }: DashboardLayoutProps) {
  return (
    <div className={clsx('flex flex-col gap-6', className)}>
      {title && (
        <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <div>{main}</div>
        <aside>{aside}</aside>
      </div>
    </div>
  );
}
