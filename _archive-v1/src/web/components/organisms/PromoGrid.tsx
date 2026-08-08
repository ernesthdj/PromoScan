/**
 * PromoGrid — Grille responsive de PromoCards avec pagination.
 * 2 colonnes mobile, 3 tablette, 4 desktop.
 */

import clsx from 'clsx';
import { PromoCard } from '../molecules/PromoCard';
import { Spinner } from '../atoms/Spinner';
import { Button } from '../atoms/Button';
import { EmptyState } from '../molecules/EmptyState';
import { Flame } from 'lucide-react';
import type { Promotion } from '../../../shared/types/index';
import type { Brand } from '../../../shared/enums';

interface PromoGridProps {
  promos: Promotion[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onPromoClick?: (id: string) => void;
  /** Map storeId -> brand pour afficher le chip enseigne */
  storeBrandMap?: Record<string, { name: string; brand: Brand }>;
  className?: string;
}

export function PromoGrid({
  promos,
  loading = false,
  hasMore = false,
  onLoadMore,
  onPromoClick,
  storeBrandMap = {},
  className,
}: PromoGridProps) {
  if (!loading && promos.length === 0) {
    return (
      <EmptyState
        icon={<Flame size={48} />}
        title="Aucune promotion trouvee"
        description="Aucune promotion ne correspond a vos criteres cette semaine. Revenez bientot !"
      />
    );
  }

  return (
    <div className={clsx('flex flex-col gap-4', className)}>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {promos.map((promo) => {
          const storeInfo = storeBrandMap[promo.storeId];
          return (
            <PromoCard
              key={promo.id}
              productName={promo.productName}
              originalPrice={promo.originalPrice}
              promoPrice={promo.promoPrice}
              discountPct={promo.discountPct}
              storeBrand={storeInfo?.brand ?? ('colruyt' as Brand)}
              storeName={storeInfo?.name ?? ''}
              endDate={promo.endDate}
              onClick={() => onPromoClick?.(promo.id)}
            />
          );
        })}
      </div>

      {loading && (
        <div className="flex justify-center py-6">
          <Spinner size="lg" />
        </div>
      )}

      {hasMore && !loading && onLoadMore && (
        <div className="flex justify-center py-4">
          <Button variant="secondary" onClick={onLoadMore}>
            Charger plus...
          </Button>
        </div>
      )}
    </div>
  );
}
