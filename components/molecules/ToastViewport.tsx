import type { ToastEntry } from '@/lib/hooks/useToastQueue';
import { ConfirmToast } from './ConfirmToast';

interface ToastViewportProps {
  toasts: ToastEntry[];
  onDismiss: (id: string) => void;
}

/** Empile les toasts actifs en bas à droite de l'écran, au-dessus du reste du contenu. */
export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <ConfirmToast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
