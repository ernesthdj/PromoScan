/**
 * Avatar — Affiche les initiales de l'utilisateur dans un cercle colore.
 */

import clsx from 'clsx';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
};

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <div
      aria-label={name}
      className={clsx(
        'inline-flex items-center justify-center rounded-full',
        'bg-primary-100 text-primary-700 font-semibold select-none',
        sizeClasses[size],
        className,
      )}
    >
      {getInitials(name) || '?'}
    </div>
  );
}
