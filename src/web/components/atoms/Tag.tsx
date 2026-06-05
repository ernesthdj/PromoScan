/**
 * Tag — Element de tag selectionnable (categorie, enseigne).
 * Peut etre retire via un bouton de suppression optionnel.
 */

import type { ReactNode } from 'react';
import clsx from 'clsx';
import { X } from 'lucide-react';

interface TagProps {
  children: ReactNode;
  variant?: 'store' | 'category' | 'day';
  selected?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  className?: string;
}

const variantClasses = {
  store: {
    base: 'border-accent-200 text-accent-700',
    selected: 'bg-accent-100 border-accent-400',
  },
  category: {
    base: 'border-neutral-200 text-neutral-600',
    selected: 'bg-neutral-200 border-neutral-400',
  },
  day: {
    base: 'border-primary-200 text-primary-700',
    selected: 'bg-primary-100 border-primary-400',
  },
};

export function Tag({
  children,
  variant = 'category',
  selected = false,
  onRemove,
  onClick,
  className,
}: TagProps) {
  const styles = variantClasses[variant];

  return (
    <span
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={clsx(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full',
        'text-sm font-medium border',
        'transition-colors duration-fast',
        styles.base,
        selected && styles.selected,
        onClick && 'cursor-pointer hover:opacity-80',
        className,
      )}
    >
      {children}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Retirer ${typeof children === 'string' ? children : ''}`}
          className="ml-0.5 hover:text-error-500 transition-colors"
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </span>
  );
}
