/**
 * StoreRow — Ligne d'un magasin dans une liste (nom, enseigne, distance, score).
 */

import clsx from 'clsx';
import { StoreChip } from './StoreChip';
import { ScoreIndicator } from './ScoreIndicator';
import type { Brand } from '../../../shared/enums';

interface StoreRowProps {
  name: string;
  brand: Brand;
  address: string;
  distanceKm: number;
  score?: number;
  matchedItems?: number;
  onClick?: () => void;
  className?: string;
}

export function StoreRow({
  name,
  brand,
  address,
  distanceKm,
  score,
  matchedItems,
  onClick,
  className,
}: StoreRowProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={clsx(
        'flex items-center gap-3 px-4 py-3 w-full text-left',
        'border-b border-neutral-100',
        onClick && 'hover:bg-neutral-50 cursor-pointer transition-colors duration-fast',
        className,
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-800 truncate">{name}</span>
          <StoreChip name={name} brand={brand} />
        </div>
        <p className="text-xs text-neutral-500 truncate mt-0.5">{address}</p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {matchedItems !== undefined && (
          <span className="text-xs text-neutral-500">{matchedItems} article{matchedItems > 1 ? 's' : ''}</span>
        )}
        <span className="text-xs text-neutral-500">{distanceKm.toFixed(1)} km</span>
        {score !== undefined && <ScoreIndicator score={score} />}
      </div>
    </Component>
  );
}
