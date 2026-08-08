'use client';

// lib/hooks/useToastQueue.ts
//
// File de toasts en mémoire locale (un seul écran consommateur pour l'instant — pas besoin d'un
// Context React tant qu'un seul point d'émission/rendu existe, cf. YAGNI). Réutilisable par
// F2/F3/F4 si un jour plusieurs écrans doivent partager la même file via un Context.

import { useCallback, useState } from 'react';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastEntry {
  id: string;
  kind: ToastKind;
  message: string;
}

export type ToastRequest = Omit<ToastEntry, 'id'>;

let counter = 0;
function nextId(): string {
  counter += 1;
  return `toast-${Date.now()}-${counter}`;
}

export function useToastQueue() {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const pushToast = useCallback((toast: ToastRequest) => {
    setToasts((current) => [...current, { ...toast, id: nextId() }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  return { toasts, pushToast, dismissToast };
}
