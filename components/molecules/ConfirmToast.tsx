import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Toast } from '@/components/atoms';
import type { ToastEntry } from '@/lib/hooks/useToastQueue';

interface ConfirmToastProps {
  toast: ToastEntry;
  onDismiss: (id: string) => void;
}

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: AlertTriangle,
} as const;

/**
 * `Toast` spécialisé succès/erreur/info de déclenchement (UI-DESIGN §3.2) — message toujours
 * humain, jamais un code brut (ex. jamais "409" seul). Le message final est déjà construit par
 * `useTriggerCollectionMutation` (app/(dashboard)/dashboard/collecte/_components/hooks.ts), qui
 * réutilise directement le `error.message` déjà formulé côté serveur (docs/API-ENDPOINTS.md) —
 * ce composant se limite à l'habillage visuel (icône + rôle ARIA), pas à la construction du texte.
 */
export function ConfirmToast({ toast, onDismiss }: ConfirmToastProps) {
  const Icon = ICONS[toast.kind];

  return (
    <Toast kind={toast.kind} onDismiss={() => onDismiss(toast.id)}>
      <span className="flex items-center gap-2">
        <Icon size={16} aria-hidden="true" className="shrink-0" />
        {toast.message}
      </span>
    </Toast>
  );
}
