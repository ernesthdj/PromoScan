/**
 * Input — Champ de saisie avec label, erreur et texte d'aide.
 * Types : text, search, password, number, email.
 */

import { forwardRef, type InputHTMLAttributes } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, id, className, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-neutral-700"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={
            [errorId, helperId].filter(Boolean).join(' ') || undefined
          }
          className={clsx(
            'w-full px-3 py-2 rounded-lg border text-base',
            'transition-colors duration-fast',
            'placeholder:text-neutral-400',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            error
              ? 'border-error-500 focus:ring-error-500'
              : 'border-neutral-300 focus:ring-accent-500 focus:border-accent-500',
            'disabled:bg-neutral-100 disabled:cursor-not-allowed',
            className,
          )}
          {...props}
        />
        {error && (
          <span id={errorId} role="alert" className="text-sm text-error-600">
            {error}
          </span>
        )}
        {helperText && !error && (
          <span id={helperId} className="text-sm text-neutral-500">
            {helperText}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
