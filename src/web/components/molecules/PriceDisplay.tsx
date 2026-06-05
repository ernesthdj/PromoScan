/**
 * PriceDisplay — Affichage prix barre + prix promo + pourcentage.
 */

import clsx from 'clsx';
import { formatPrice, formatDiscount } from '../../utils/formatters';

interface PriceDisplayProps {
  originalPrice: number | null;
  promoPrice: number;
  discountPct: number | null;
  className?: string;
}

export function PriceDisplay({
  originalPrice,
  promoPrice,
  discountPct,
  className,
}: PriceDisplayProps) {
  return (
    <div className={clsx('flex items-baseline gap-2', className)}>
      {originalPrice !== null && originalPrice > promoPrice && (
        <span className="text-sm text-neutral-400 line-through">
          {formatPrice(originalPrice)}
        </span>
      )}
      <span className="text-lg font-bold text-primary-600">
        {formatPrice(promoPrice)}
      </span>
      {discountPct !== null && discountPct > 0 && (
        <span className="text-sm font-semibold text-secondary-600">
          {formatDiscount(discountPct)}
        </span>
      )}
    </div>
  );
}
