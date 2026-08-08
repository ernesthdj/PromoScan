import type { PromotionItem } from '@/lib/types/api';
import { formatDateShort, formatPrice } from '@/lib/utils/format';

interface PromotionRowProps {
  promotion: PromotionItem;
  chainName: string;
}

/** Ligne de tableau desktop/tablette — prix promo toujours visuellement dominant vs prix normal
 * barré discret (UI-DESIGN §3.2). Masquée <768px au profit de `PromotionCard`. */
export function PromotionRow({ promotion, chainName }: PromotionRowProps) {
  return (
    <tr className="border-b border-base-border last:border-0">
      <td className="px-3 py-2 text-sm text-base-text">{promotion.rawProductName}</td>
      <td className="px-3 py-2 text-sm text-base-text-secondary">{chainName}</td>
      <td className="px-3 py-2 text-sm text-base-text-secondary">{promotion.category ?? '—'}</td>
      <td className="px-3 py-2 text-sm text-base-text-muted line-through">
        {promotion.regularPrice !== null ? formatPrice(promotion.regularPrice) : '—'}
      </td>
      <td className="px-3 py-2 text-sm font-semibold text-status-success-fg">
        {formatPrice(promotion.promoPrice)}
      </td>
      <td className="px-3 py-2 text-sm text-base-text-secondary">
        {promotion.discountPercent !== null ? `-${promotion.discountPercent}%` : '—'}
      </td>
      <td className="px-3 py-2 text-sm text-base-text-muted">
        {formatDateShort(promotion.validFrom)} → {formatDateShort(promotion.validTo)}
      </td>
    </tr>
  );
}
