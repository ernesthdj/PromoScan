'use client';

import { ToastViewport } from '@/components/molecules';
import { useToastQueue } from '@/lib/hooks/useToastQueue';
import { PageHeader } from './PageHeader';
import { TriggerControlPanel } from './TriggerControlPanel';
import { RunHistoryTable } from './RunHistoryTable';
import { PromotionsTable } from './PromotionsTable';

/**
 * Composition des 4 zones verticales A-D (UI-DESIGN.md §1). Client component racine de l'écran
 * (nécessaire pour TanStack Query + la file de toasts) — `page.tsx` reste un Server Component qui
 * se contente de la rendre.
 */
export function CollecteScreen() {
  const { toasts, pushToast, dismissToast } = useToastQueue();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 p-4 sm:p-6 lg:p-8">
      <PageHeader />
      <TriggerControlPanel pushToast={pushToast} />
      <RunHistoryTable />
      <PromotionsTable />
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
