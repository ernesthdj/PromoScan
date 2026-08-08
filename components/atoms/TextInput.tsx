'use client';

import { useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hideLabel?: boolean;
}

/**
 * Champ texte natif accessible. Le debounce (300ms, ex. filtre Catégorie — UI-DESIGN §5) est
 * délibérément géré par le composant appelant (`FilterBar`), pas ici : `TextInput` reste un atom
 * générique sans logique métier de requête.
 */
export function TextInput({ label, hideLabel = false, id, className, ...rest }: TextInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className={cn('text-sm font-medium text-base-text-secondary', hideLabel && 'sr-only')}>
        {label}
      </label>
      <input
        id={inputId}
        {...rest}
        className={cn(
          'h-9 rounded-md border border-base-border bg-base-surface px-2 text-sm text-base-text placeholder:text-base-text-muted',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-base-focus-ring',
          className,
        )}
      />
    </div>
  );
}
