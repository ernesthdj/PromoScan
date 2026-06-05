/**
 * NotFound — Page 404.
 */

import { useNavigate } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { EmptyState } from '../components/molecules/EmptyState';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <EmptyState
        icon={<FileQuestion size={64} />}
        title="Page introuvable"
        description="La page que vous cherchez n'existe pas ou a ete deplacee."
        ctaLabel="Retour a l'accueil"
        ctaAction={() => navigate('/')}
      />
    </div>
  );
}
