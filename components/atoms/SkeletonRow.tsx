import { cn } from '@/lib/utils/cn';

interface SkeletonRowProps {
  className?: string;
}

/** Placeholder de chargement générique (barre animée) — le composant appelant l'enveloppe dans
 * `<tr><td>…</td></tr>` pour un tableau, ou l'utilise tel quel dans une liste (ex.
 * TriggerControlPanel). Jamais un spinner plein écran qui bloquerait toute la page. */
export function SkeletonRow({ className }: SkeletonRowProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('h-4 rounded motion-safe:animate-pulse bg-base-border', className)}
    />
  );
}
