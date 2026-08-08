/**
 * SuggestionPanel — Panel de suggestions : scoring par enseigne.
 * Affiche les recommandations triees par score avec accordeons expandables.
 */

import { useState } from 'react';
import clsx from 'clsx';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ScoreIndicator } from '../molecules/ScoreIndicator';
import { StoreChip } from '../molecules/StoreChip';
import { PriceDisplay } from '../molecules/PriceDisplay';
import { Checkbox } from '../atoms/Checkbox';
import { formatPrice, formatDistance } from '../../utils/formatters';
import type { StoreRecommendation } from '../../../shared/types/api';

interface SuggestionPanelProps {
  suggestions: StoreRecommendation[];
  selectedStoreIds: string[];
  onToggleStore: (storeId: string) => void;
  className?: string;
}

export function SuggestionPanel({
  suggestions,
  selectedStoreIds,
  onToggleStore,
  className,
}: SuggestionPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className={clsx('flex flex-col gap-3', className)}>
      {suggestions.map((rec) => {
        const isExpanded = expandedId === rec.store.id;
        const isSelected = selectedStoreIds.includes(rec.store.id);

        return (
          <div
            key={rec.store.id}
            className={clsx(
              'border rounded-lg overflow-hidden transition-colors duration-fast',
              isSelected ? 'border-primary-300 bg-primary-50' : 'border-neutral-200 bg-white',
            )}
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4">
              <ScoreIndicator score={rec.score} />
              <div className="flex-1">
                <StoreChip name={rec.store.name} brand={rec.store.brand} />
                <div className="flex gap-4 mt-1 text-sm text-neutral-600">
                  <span>{rec.matchedItems} article{rec.matchedItems > 1 ? 's' : ''} en promo</span>
                  <span>Economie : {formatPrice(rec.totalSavings)}</span>
                  <span>Distance : {formatDistance(rec.distanceKm)}</span>
                </div>
              </div>

              <button
                onClick={() => setExpandedId(isExpanded ? null : rec.store.id)}
                aria-expanded={isExpanded}
                aria-label={`${isExpanded ? 'Masquer' : 'Voir'} les promos de ${rec.store.name}`}
                className="p-1 rounded hover:bg-neutral-100 text-neutral-500 transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp size={20} aria-hidden="true" />
                ) : (
                  <ChevronDown size={20} aria-hidden="true" />
                )}
              </button>
            </div>

            {/* Expanded promos */}
            {isExpanded && (
              <div className="px-4 pb-3 border-t border-neutral-100">
                <ul className="divide-y divide-neutral-50">
                  {rec.promotions.map((promo) => (
                    <li key={promo.id} className="flex items-center justify-between py-2">
                      <span className="text-sm text-neutral-700">{promo.productName}</span>
                      <PriceDisplay
                        originalPrice={promo.originalPrice}
                        promoPrice={promo.promoPrice}
                        discountPct={promo.discountPct}
                        className="text-sm"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Ajouter a l'itineraire */}
            <div className="px-4 pb-3">
              <Checkbox
                checked={isSelected}
                onChange={() => onToggleStore(rec.store.id)}
                label="Ajouter a l'itineraire"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
