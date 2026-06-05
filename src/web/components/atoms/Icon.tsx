/**
 * Icon — Wrapper pour les icones lucide-react.
 * Centralise les tailles et les couleurs.
 */

import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

type IconSize = 16 | 20 | 24;

interface IconProps {
  icon: LucideIcon;
  size?: IconSize;
  className?: string;
  'aria-label'?: string;
}

export function Icon({
  icon: LucideIcon,
  size = 20,
  className,
  'aria-label': ariaLabel,
}: IconProps) {
  return (
    <LucideIcon
      size={size}
      className={clsx('shrink-0', className)}
      aria-hidden={!ariaLabel}
      aria-label={ariaLabel}
    />
  );
}
