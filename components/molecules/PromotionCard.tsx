import type { PromotionItem } from '@/lib/types/api';
import { formatDateShort, formatPrice } from '@/lib/utils/format';

interface PromotionCardProps {
  promotion: PromotionItem;
  chainName: string;
}

/** Équivalent `PromotionRow` en carte, utilisé <768px (UI-DESIGN §2.3) : nom + enseigne en tête,
 * prix normal barré + prix promo en évidence, catégorie/validité en texte secondaire. */
export function PromotionCard({ promotion, chainName }: PromotionCardProps) {
  return (
    <div className="rounded-lg border border-base-border bg-base-surface p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-base-text">{promotion.rawProductName}</p>
          <p className="text-sm text-base-text-secondary">{chainName}</p>
        </div>
        <div className="text-right">
          {promotion.regularPrice !== null && (
            <p className="text-xs text-base-text-muted line-through">{formatPrice(promotion.regularPrice)}</p>
          )}
          <p className="font-semibold text-status-success-fg">{formatPrice(promotion.promoPrice)}</p>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-1 text-xs text-base-text-muted">
        <span>{promotion.category ?? '—'}</span>
        <span>
          {formatDateShort(promotion.validFrom)} → {formatDateShort(promotion.validTo)}
        </span>
      </div>
    </div>
  );
}
