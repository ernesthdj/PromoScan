'use client';

import { useId, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { Spinner } from './Spinner';

type ButtonVariant = 'primary' | 'secondary' | 'danger-ghost';
type ButtonSize = 'md' | 'sm';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Libellé affiché pendant `loading` (ex. "En cours…") — sinon les enfants sont conservés. */
  loadingLabel?: string;
  disabled?: boolean;
  /** Raison de la désactivation, exposée via `title` (souris) ET `aria-describedby` (clavier /
   * lecteur d'écran) — cf. UI-DESIGN §6 : un `disabled` HTML brut rendrait le `title`
   * inaccessible au clavier. Le bouton reste donc focusable même désactivé. */
  disabledReason?: string;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-base-accent text-base-accent-fg hover:bg-base-accent-hover',
  secondary: 'bg-base-surface text-base-text border border-base-border hover:bg-base-surface-hover',
  'danger-ghost': 'bg-transparent text-base-danger hover:bg-status-error-bg border border-transparent',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  md: 'h-8 min-h-[32px] px-4 text-sm gap-2',
  sm: 'h-8 min-h-[32px] px-3 text-sm gap-1.5',
};

/**
 * Bouton d'action — min 32px desktop / 44px tactile (règle Fitts globale, cf. classe
 * `touch:min-h-[44px]` appliquée via media query fine pointer en CSS globale non nécessaire ici :
 * on applique directement min-h-11 (44px) en dessous du breakpoint `sm` pour couvrir le cas
 * tactile mobile décrit par UI-DESIGN §2.3).
 */
export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  loadingLabel,
  disabled = false,
  disabledReason,
  children,
  className,
  onClick,
  type = 'button',
  ...rest
}: ButtonProps) {
  const reasonId = useId();
  const isDisabled = disabled || loading;

  return (
    <>
      <button
        {...rest}
        type={type}
        aria-disabled={isDisabled || undefined}
        aria-describedby={isDisabled && disabledReason ? reasonId : undefined}
        title={isDisabled ? disabledReason : undefined}
        onClick={(event) => {
          if (isDisabled) {
            event.preventDefault();
            return;
          }
          onClick?.(event);
        }}
        className={cn(
          'inline-flex min-h-[44px] items-center justify-center rounded-md font-medium transition-colors',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-base-focus-ring',
          'sm:min-h-[32px]',
          SIZE_CLASSES[size],
          VARIANT_CLASSES[variant],
          // `saturate-50` + `opacity-60` (plutôt qu'un `hover:` neutralisant, inefficace ici car
          // les classes hover de VARIANT_CLASSES restent posées) suffisent comme signal visuel de
          // désactivation ; le survol reste géré au clavier/souris (title + aria-describedby).
          isDisabled && 'cursor-not-allowed opacity-60 saturate-50',
          className,
        )}
      >
        {loading && <Spinner />}
        <span>{loading && loadingLabel ? loadingLabel : children}</span>
      </button>
      {isDisabled && disabledReason && (
        <span id={reasonId} className="sr-only">
          {disabledReason}
        </span>
      )}
    </>
  );
}
