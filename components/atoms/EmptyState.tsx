import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

/** Icône + titre + description — réutilisé pour "aucune promotion", "aucun run", filtre sans
 * résultat (UI-DESIGN §3.1). */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-base-border py-10 text-center">
      {icon}
      <p className="font-medium text-base-text">{title}</p>
      {description && <p className="max-w-sm text-sm text-base-text-secondary">{description}</p>}
      {action}
    </div>
  );
}
