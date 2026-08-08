/**
 * PromotionsPage — Toutes les promos actives avec filtres.
 */

import { useState } from 'react';
import { usePromotions } from '../hooks/usePromotions';
import { PromoGrid } from '../components/organisms/PromoGrid';
import { FilterBar } from '../components/organisms/FilterBar';
import { useFilterStore } from '../stores/filterStore';
import { Spinner } from '../components/atoms/Spinner';

export function PromotionsPage() {
  const [page, setPage] = useState(1);
  const { selectedBrands, selectedCategories, toggleBrand, toggleCategory, resetFilters } =
    useFilterStore();

  const { data, isLoading } = usePromotions({
    brand: selectedBrands.length === 1 ? selectedBrands[0] : undefined,
    category: selectedCategories.length === 1 ? selectedCategories[0] : undefined,
    page,
    limit: 20,
  });

  const promos = data?.items ?? [];
  const hasMore = data ? page < data.totalPages : false;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-neutral-800">Promos actives</h1>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Filtres */}
        <aside className="sm:w-56 shrink-0">
          <FilterBar
            selectedBrands={selectedBrands}
            selectedCategories={selectedCategories}
            onToggleBrand={toggleBrand}
            onToggleCategory={toggleCategory}
            onReset={resetFilters}
          />
        </aside>

        {/* Grille */}
        <div className="flex-1">
          <p className="text-sm text-neutral-500 mb-3">
            {data?.total ?? 0} promos
          </p>
          {isLoading && page === 1 ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <PromoGrid
              promos={promos}
              loading={isLoading}
              hasMore={hasMore}
              onLoadMore={() => setPage((p) => p + 1)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
