/**
 * PromoCard — Carte promotionnelle individuelle.
 * Affiche : image, produit, prix barre, prix promo, enseigne, dates.
 */

import clsx from 'clsx';
import { Badge } from '../atoms/Badge';
import { PriceDisplay } from './PriceDisplay';
import { StoreChip } from './StoreChip';
import { formatEndDate } from '../../utils/formatters';
import type { Brand } from '../../../shared/enums';

interface PromoCardProps {
  productName: string;
  originalPrice: number | null;
  promoPrice: number;
  discountPct: number | null;
  storeBrand: Brand;
  storeName: string;
  endDate: Date | string;
  imageUrl?: string;
  onClick?: () => void;
  className?: string;
}

export function PromoCard({
  productName,
  originalPrice,
  promoPrice,
  discountPct,
  storeBrand,
  storeName,
  endDate,
  imageUrl,
  onClick,
  className,
}: PromoCardProps) {
  return (
    <article
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={clsx(
        'flex flex-col rounded-xl border border-neutral-200 bg-white',
        'shadow-sm hover:shadow-md transition-shadow duration-normal',
        'overflow-hidden',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {/* Image ou placeholder */}
      <div className="relative aspect-[4/3] bg-neutral-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={productName}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-neutral-400 text-sm">
            Pas d'image
          </div>
        )}
        {discountPct !== null && discountPct > 0 && (
          <Badge variant="discount" className="absolute top-2 right-2">
            -{discountPct}%
          </Badge>
        )}
      </div>

      {/* Contenu */}
      <div className="flex flex-col gap-2 p-3">
        <h3 className="text-sm font-semibold text-neutral-800 line-clamp-2">
          {productName}
        </h3>

        <PriceDisplay
          originalPrice={originalPrice}
          promoPrice={promoPrice}
          discountPct={discountPct}
        />

        <div className="flex items-center justify-between mt-1">
          <StoreChip name={storeName} brand={storeBrand} />
          <span className="text-xs text-neutral-500">
            {formatEndDate(endDate)}
          </span>
        </div>
      </div>
    </article>
  );
}
