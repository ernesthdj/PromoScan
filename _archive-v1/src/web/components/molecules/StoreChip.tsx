/**
 * StoreChip — Chip enseigne avec couleur de marque.
 */

import clsx from 'clsx';
import { BRAND_COLORS, BRAND_LABELS } from '../../utils/constants';
import type { Brand } from '../../../shared/enums';

interface StoreChipProps {
  name: string;
  brand: Brand;
  distance?: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function StoreChip({
  name,
  brand,
  distance,
  selected = false,
  onClick,
  className,
}: StoreChipProps) {
  const colors = BRAND_COLORS[brand];

  return (
    <span
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        backgroundColor: selected ? colors.bg : undefined,
        color: selected ? colors.text : colors.bg,
        borderColor: colors.bg,
      }}
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full',
        'text-xs font-semibold border',
        'transition-colors duration-fast',
        onClick && 'cursor-pointer hover:opacity-80',
        className,
      )}
    >
      {BRAND_LABELS[brand]}
      {distance && (
        <span className="text-xs opacity-75">{distance}</span>
      )}
    </span>
  );
}
