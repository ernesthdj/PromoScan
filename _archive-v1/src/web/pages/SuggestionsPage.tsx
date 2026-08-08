/**
 * SuggestionsPage — Matching promos/liste + recommandations par enseigne.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ClipboardList } from 'lucide-react';
import { useRecommendSuggestions } from '../hooks/useSuggestions';
import { useListStore } from '../stores/listStore';
import { useAuthStore } from '../stores/authStore';
import { SuggestionPanel } from '../components/organisms/SuggestionPanel';
import { EmptyState } from '../components/molecules/EmptyState';
import { Button } from '../components/atoms/Button';
import { Spinner } from '../components/atoms/Spinner';
import { formatPrice } from '../utils/formatters';

export function SuggestionsPage() {
  const navigate = useNavigate();
  const activeListId = useListStore((state) => state.activeListId);
  const user = useAuthStore((state) => state.user);
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);

  const recommend = useRecommendSuggestions();

  useEffect(() => {
    if (activeListId) {
      recommend.mutate({ listId: activeListId });
    }
  }, [activeListId]);

  // Pas de liste active
  if (!activeListId) {
    return (
      <EmptyState
        icon={<ClipboardList size={48} />}
        title="Ajoutez des articles a votre liste"
        description="Pour recevoir des suggestions, vous devez d'abord creer une liste de courses avec des articles."
        ctaLabel="Aller a ma liste"
        ctaAction={() => navigate('/lists')}
      />
    );
  }

  // Pas de zone geo
  if (!user?.zoneCodePostal) {
    return (
      <EmptyState
        icon={<Search size={48} />}
        title="Definissez votre zone"
        description="Pour trouver les magasins proches, renseignez votre code postal dans votre profil."
        ctaLabel="Modifier ma zone"
        ctaAction={() => navigate('/profile')}
      />
    );
  }

  const suggestions = recommend.data ?? [];
  const totalSavings = suggestions.reduce((sum, s) => sum + s.totalSavings, 0);
  const totalMatched = suggestions.reduce((sum, s) => sum + s.matchedItems, 0);

  function toggleStore(storeId: string) {
    setSelectedStoreIds((prev) =>
      prev.includes(storeId)
        ? prev.filter((id) => id !== storeId)
        : [...prev, storeId],
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-neutral-800">Suggestions</h1>

      {recommend.isPending ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : suggestions.length === 0 ? (
        <EmptyState
          icon={<Search size={48} />}
          title="Aucune promo trouvee"
          description="Aucune promotion ne correspond a vos articles cette semaine. Revenez bientot !"
          ctaLabel="Modifier ma liste"
          ctaAction={() => navigate('/lists')}
        />
      ) : (
        <>
          {/* Resume */}
          <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
            <div className="flex flex-wrap gap-4 text-sm text-neutral-600">
              <span>{totalMatched} promos trouvees</span>
              <span>Economie max estimee : {formatPrice(totalSavings)}</span>
            </div>
          </div>

          {/* Panel par enseigne */}
          <SuggestionPanel
            suggestions={suggestions}
            selectedStoreIds={selectedStoreIds}
            onToggleStore={toggleStore}
          />

          {/* CTA fixe */}
          {selectedStoreIds.length > 0 && (
            <div className="sticky bottom-16 sm:bottom-0 p-4 bg-white border-t border-neutral-200 shadow-lg rounded-t-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">
                  {selectedStoreIds.length} magasin{selectedStoreIds.length > 1 ? 's' : ''} selectionne{selectedStoreIds.length > 1 ? 's' : ''}
                </span>
                <Button
                  onClick={() => {
                    const params = new URLSearchParams();
                    params.set('stores', selectedStoreIds.join(','));
                    navigate(`/route?${params.toString()}`);
                  }}
                >
                  Calculer l'itineraire
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
