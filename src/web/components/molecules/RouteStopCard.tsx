/**
 * RouteStopCard — Etape d'un itineraire : magasin, articles, economies.
 */

import clsx from 'clsx';
import { X, Clock, MapPin } from 'lucide-react';
import { StoreChip } from './StoreChip';
import { formatPrice, formatDuration } from '../../utils/formatters';
import type { Brand } from '../../../shared/enums';

interface RouteStopItem {
  name: string;
  discountPct: number;
  savings: number;
}

interface RouteStopCardProps {
  stopNumber: number;
  storeName: string;
  storeBrand: Brand;
  items: RouteStopItem[];
  totalSavings: number;
  travelTimeMin: number;
  onRemove?: () => void;
  className?: string;
}

export function RouteStopCard({
  stopNumber,
  storeName,
  storeBrand,
  items,
  totalSavings,
  travelTimeMin,
  onRemove,
  className,
}: RouteStopCardProps) {
  return (
    <div
      className={clsx(
        'border border-neutral-200 rounded-lg p-4 bg-white',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent-500 text-white text-xs font-bold">
            {stopNumber}
          </span>
          <StoreChip name={storeName} brand={storeBrand} />
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            aria-label={`Retirer ${storeName} de l'itineraire`}
            className="p-1 rounded hover:bg-red-50 text-neutral-400 hover:text-error-500 transition-colors"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Articles */}
      <ul className="space-y-1 mb-3">
        {items.map((item) => (
          <li
            key={item.name}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-neutral-700">{item.name}</span>
            <span className="text-secondary-600 font-medium">
              -{item.discountPct}% ({formatPrice(item.savings)})
            </span>
          </li>
        ))}
      </ul>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
        <div className="flex items-center gap-1 text-xs text-neutral-500">
          <Clock size={14} aria-hidden="true" />
          <span>Trajet : {formatDuration(travelTimeMin)}</span>
        </div>
        <span className="text-sm font-semibold text-primary-600">
          {formatPrice(totalSavings)}
        </span>
      </div>
    </div>
  );
}
