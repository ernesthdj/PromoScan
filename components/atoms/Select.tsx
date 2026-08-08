'use client';

import { useId, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label: string;
  options: SelectOption[];
  /** Masque visuellement le `<label>` tout en le gardant accessible (`sr-only`). */
  hideLabel?: boolean;
}

/** `<select>` natif — accessible par défaut (clavier, lecteur d'écran), focus visible. */
export function Select({ label, options, hideLabel = false, id, className, ...rest }: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={selectId} className={cn('text-sm font-medium text-base-text-secondary', hideLabel && 'sr-only')}>
        {label}
      </label>
      <select
        id={selectId}
        {...rest}
        className={cn(
          'h-9 rounded-md border border-base-border bg-base-surface px-2 text-sm text-base-text',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-base-focus-ring',
          className,
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
