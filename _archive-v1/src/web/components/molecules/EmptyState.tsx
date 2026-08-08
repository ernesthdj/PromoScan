/**
 * EmptyState — Etat vide reutilisable avec icone, message et CTA.
 */

import type { ReactNode } from 'react';
import clsx from 'clsx';
import { Button } from '../atoms/Button';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaAction?: () => void;
  secondaryLabel?: string;
  secondaryAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  ctaAction,
  secondaryLabel,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center text-center',
        'px-6 py-12 gap-4',
        className,
      )}
    >
      <div className="text-neutral-300 mb-2">{icon}</div>
      <h3 className="text-lg font-semibold text-neutral-700">{title}</h3>
      <p className="text-sm text-neutral-500 max-w-sm">{description}</p>
      {ctaLabel && ctaAction && (
        <Button onClick={ctaAction} size="md" className="mt-2">
          {ctaLabel}
        </Button>
      )}
      {secondaryLabel && secondaryAction && (
        <Button onClick={secondaryAction} variant="ghost" size="sm">
          {secondaryLabel}
        </Button>
      )}
    </div>
  );
}
