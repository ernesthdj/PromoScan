/**
 * RouteSummary — Resume de l'itineraire.
 * Magasins ordonnes, distances, economies totales, temps estime.
 */

import clsx from 'clsx';
import { Clock, MapPin, Wallet, Save } from 'lucide-react';
import { RouteStopCard } from '../molecules/RouteStopCard';
import { Button } from '../atoms/Button';
import { formatPrice, formatDistance, formatDuration } from '../../utils/formatters';
import type { Brand } from '../../../shared/enums';

interface RouteStop {
  storeId: string;
  storeName: string;
  storeBrand: Brand;
  items: Array<{ name: string; discountPct: number; savings: number }>;
  totalSavings: number;
  travelTimeMin: number;
}

interface RouteSummaryProps {
  stops: RouteStop[];
  totalDistanceKm: number;
  totalDurationMin: number;
  totalSavings: number;
  returnTimeMin?: number;
  onRemoveStop?: (storeId: string) => void;
  onSave?: () => void;
  isSaving?: boolean;
  className?: string;
}

export function RouteSummary({
  stops,
  totalDistanceKm,
  totalDurationMin,
  totalSavings,
  returnTimeMin,
  onRemoveStop,
  onSave,
  isSaving = false,
  className,
}: RouteSummaryProps) {
  return (
    <div className={clsx('flex flex-col gap-4', className)}>
      {/* Resume global */}
      <div className="grid grid-cols-3 gap-3 p-4 bg-neutral-50 rounded-lg">
        <div className="flex flex-col items-center gap-1">
          <MapPin size={20} className="text-accent-500" aria-hidden="true" />
          <span className="text-sm font-semibold text-neutral-800">
            {formatDistance(totalDistanceKm)}
          </span>
          <span className="text-xs text-neutral-500">Distance</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Clock size={20} className="text-accent-500" aria-hidden="true" />
          <span className="text-sm font-semibold text-neutral-800">
            {formatDuration(totalDurationMin)}
          </span>
          <span className="text-xs text-neutral-500">Temps</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Wallet size={20} className="text-primary-500" aria-hidden="true" />
          <span className="text-sm font-semibold text-primary-600">
            {formatPrice(totalSavings)}
          </span>
          <span className="text-xs text-neutral-500">Economies</span>
        </div>
      </div>

      {/* Stops */}
      <div className="flex flex-col gap-3">
        {stops.map((stop, index) => (
          <RouteStopCard
            key={stop.storeId}
            stopNumber={index + 1}
            storeName={stop.storeName}
            storeBrand={stop.storeBrand}
            items={stop.items}
            totalSavings={stop.totalSavings}
            travelTimeMin={stop.travelTimeMin}
            onRemove={
              onRemoveStop && stops.length > 1
                ? () => onRemoveStop(stop.storeId)
                : undefined
            }
          />
        ))}

        {/* Retour domicile */}
        {returnTimeMin !== undefined && (
          <div className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-500 border-t border-neutral-100">
            <Clock size={14} aria-hidden="true" />
            <span>Retour domicile : {formatDuration(returnTimeMin)}</span>
          </div>
        )}
      </div>

      {/* Bouton sauvegarder */}
      {onSave && (
        <Button
          onClick={onSave}
          loading={isSaving}
          icon={<Save size={18} />}
          className="mt-2"
        >
          Sauvegarder l'itineraire
        </Button>
      )}
    </div>
  );
}
