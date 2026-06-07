/**
 * ListLayout — Layout page liste de courses.
 * Header titre + actions, zone contenu scrollable.
 */

import type { ReactNode } from 'react';
import clsx from 'clsx';

interface ListLayoutProps {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ListLayout({ title, actions, children, className }: ListLayoutProps) {
  return (
    <div className={clsx('flex flex-col gap-4', className)}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
