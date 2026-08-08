/**
 * Toast — Notification temporaire avec action optionnelle (ex: undo).
 * Variantes : success, error, info, undo.
 */

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { X, CheckCircle, AlertCircle, Info, Undo2 } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info' | 'undo';

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss: () => void;
  className?: string;
}

const variantConfig = {
  success: { icon: CheckCircle, bg: 'bg-green-50 border-green-200', text: 'text-green-800' },
  error: { icon: AlertCircle, bg: 'bg-red-50 border-red-200', text: 'text-red-800' },
  info: { icon: Info, bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800' },
  undo: { icon: Undo2, bg: 'bg-neutral-800 border-neutral-700', text: 'text-white' },
};

export function Toast({
  message,
  variant = 'info',
  duration = 5000,
  action,
  onDismiss,
  className,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const config = variantConfig[variant];
  const IconComponent = config.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 200);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={clsx(
        'flex items-center gap-3 px-4 py-3 rounded-lg border shadow-md',
        'transition-all duration-normal',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        config.bg,
        config.text,
        className,
      )}
    >
      <IconComponent size={20} aria-hidden="true" className="shrink-0" />
      <p className="flex-1 text-sm font-medium">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className={clsx(
            'text-sm font-semibold underline hover:no-underline',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded',
          )}
        >
          {action.label}
        </button>
      )}
      <button
        onClick={onDismiss}
        aria-label="Fermer la notification"
        className="shrink-0 hover:opacity-70 transition-opacity"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
