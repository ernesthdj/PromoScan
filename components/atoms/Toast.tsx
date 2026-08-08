'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { ToastKind } from '@/lib/hooks/useToastQueue';

interface ToastProps {
  kind: ToastKind;
  children: React.ReactNode;
  onDismiss: () => void;
  autoDismissMs?: number;
}

const KIND_CLASSES: Record<ToastKind, string> = {
  success: 'bg-status-success-bg text-status-success-fg border-status-success-border',
  error: 'bg-status-error-bg text-status-error-fg border-status-error-border',
  info: 'bg-status-info-bg text-status-info-fg border-status-info-border',
};

/**
 * Conteneur de notification transitoire générique — auto-dismiss configurable, `role="status"`
 * (succès/info) ou `role="alert"` (erreur) pour annonce automatique lecteur d'écran sans voler le
 * focus (UI-DESIGN §6). La composition icône + message humanisé vit dans `ConfirmToast`
 * (molecule) : cet atom ne connaît que sa sévérité, pas la sémantique métier du déclenchement.
 */
export function Toast({ kind, children, onDismiss, autoDismissMs = 5000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, autoDismissMs);
    return () => clearTimeout(timer);
  }, [onDismiss, autoDismissMs]);

  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2 rounded-md border px-3 py-2 shadow-sm text-sm',
        KIND_CLASSES[kind],
      )}
    >
      <div className="flex-1">{children}</div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Fermer la notification"
        className="shrink-0 rounded p-0.5 hover:bg-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-base-focus-ring"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
