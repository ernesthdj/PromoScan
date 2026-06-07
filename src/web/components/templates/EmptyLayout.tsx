/**
 * EmptyLayout — Layout minimal sans navigation (erreurs, maintenance).
 */

import type { ReactNode } from 'react';
import clsx from 'clsx';

interface EmptyLayoutProps {
  children: ReactNode;
  className?: string;
}

export function EmptyLayout({ children, className }: EmptyLayoutProps) {
  return (
    <div className={clsx('flex items-center justify-center min-h-screen bg-neutral-50 px-4', className)}>
      <div className="max-w-md w-full text-center">{children}</div>
    </div>
  );
}
