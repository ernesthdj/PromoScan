import { Button } from './Button';

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  className?: string;
}

/** Précédent/Suivant + indicateur de page — boutons désactivés en butée (première/dernière page). */
export function PaginationControls({ page, totalPages, onPrev, onNext, className }: PaginationControlsProps) {
  return (
    <div className={className ? className : 'flex items-center justify-end gap-3'}>
      <Button
        variant="secondary"
        size="sm"
        disabled={page <= 1}
        disabledReason="Déjà sur la première page"
        onClick={onPrev}
      >
        Précédent
      </Button>
      <span aria-live="polite" className="text-sm text-base-text-secondary">
        Page {page} / {Math.max(totalPages, 1)}
      </span>
      <Button
        variant="secondary"
        size="sm"
        disabled={page >= totalPages}
        disabledReason="Déjà sur la dernière page"
        onClick={onNext}
      >
        Suivant
      </Button>
    </div>
  );
}
