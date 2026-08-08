/**
 * Checkbox — Case a cocher accessible avec label optionnel.
 */

import { forwardRef, type InputHTMLAttributes } from 'react';
import clsx from 'clsx';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, id, className, ...props }, ref) => {
    const checkboxId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <label
        htmlFor={checkboxId}
        className={clsx(
          'inline-flex items-center gap-2 cursor-pointer',
          'select-none',
          props.disabled && 'opacity-50 cursor-not-allowed',
          className,
        )}
      >
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          className={clsx(
            'h-5 w-5 rounded border-neutral-300',
            'text-primary-500 focus:ring-primary-500 focus:ring-2',
            'transition-colors duration-fast',
            'cursor-pointer disabled:cursor-not-allowed',
          )}
          {...props}
        />
        {label && (
          <span className="text-base text-neutral-700">{label}</span>
        )}
      </label>
    );
  },
);

Checkbox.displayName = 'Checkbox';
