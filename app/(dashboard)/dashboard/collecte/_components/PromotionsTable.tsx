'use client';

import { useState } from 'react';
import { EmptyState, PaginationControls, Select, SkeletonRow, Button } from '@/components/atoms';
import { FilterBar, PromotionCard, PromotionRow } from '@/components/molecules';
import { chainName, PROMOTIONS_PAGE_SIZE_OPTIONS, DEFAULT_PROMOTIONS_PAGE_SIZE, STORE_CHAINS } from './constants';
import { usePromotionsQuery } from './hooks';

const TABLE_HEAD_CELLS = ['Produit', 'Enseigne', 'Catégorie', 'Prix normal', 'Promo', 'Remise', 'Validité'];

/**
 * `FilterBar` + liste `PromotionRow`/`PromotionCard` + `PaginationControls` + compteur de
 * résultats (US-F1-09). Filtres appliqués côté serveur (UI-DESIGN §4.4) — jamais un filtrage
 * client sur des lignes déjà chargées.
 */
export function PromotionsTable() {
  const [storeChain, setStoreChain] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(DEFAULT_PROMOTIONS_PAGE_SIZE);

  const { data, isLoading, isError, isPlaceholderData } = usePromotionsQuery({
    storeChain,
    category,
    page,
    limit,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / limit)) : 1;
  const hasActiveFilter = Boolean(storeChain) || category.length > 0;

  function resetToFirstPage() {
    setPage(1);
  }

  return (
    <section aria-labelledby="promotions-heading" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="promotions-heading" className="text-lg font-semibold text-base-text">
          Promotions collectées
        </h2>
        {data && <span className="text-sm text-base-text-secondary">{data.total} résultats</span>}
      </div>

      <FilterBar
        storeChain={storeChain}
        category={category}
        chainOptions={STORE_CHAINS}
        onStoreChainChange={(value) => {
          setStoreChain(value);
          resetToFirstPage();
        }}
        onCategoryChange={(value) => {
          setCategory(value);
          resetToFirstPage();
        }}
        onReset={() => {
          setStoreChain(null);
          setCategory('');
          resetToFirstPage();
        }}
      />

      {isLoading ? (
        <div className="flex flex-col gap-2" aria-label="Chargement des promotions">
          {Array.from({ length: 6 }, (_, index) => (
            <SkeletonRow key={index} className="h-10 w-full" />
          ))}
        </div>
      ) : isError ? (
        <p role="alert" className="text-sm text-status-error-fg">
          Impossible de charger les promotions.
        </p>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="Aucune promotion pour ce filtre"
          description={hasActiveFilter ? undefined : "Aucune promotion collectée pour l'instant."}
          action={
            hasActiveFilter ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setStoreChain(null);
                  setCategory('');
                  resetToFirstPage();
                }}
              >
                Réinitialiser les filtres
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className={isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
          {/* Desktop/tablette : tableau dense (masqué <768px) */}
          <div className="hidden overflow-x-auto rounded-lg border border-base-border md:block">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-base-border bg-base-surface-hover text-left">
                  {TABLE_HEAD_CELLS.map((head) => (
                    <th key={head} scope="col" className="px-3 py-2 text-xs font-semibold uppercase text-base-text-muted">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.items.map((promotion) => (
                  <PromotionRow key={promotion.id} promotion={promotion} chainName={chainName(promotion.storeChain)} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile : liste de cartes (masquée >=768px) */}
          <div className="flex flex-col gap-2 md:hidden">
            {data.items.map((promotion) => (
              <PromotionCard key={promotion.id} promotion={promotion} chainName={chainName(promotion.storeChain)} />
            ))}
          </div>
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-base-text-secondary">
            Affichage {(page - 1) * limit + 1}-{Math.min(page * limit, data.total)} sur {data.total}
          </span>
          <div className="flex items-center gap-3">
            <Select
              label="Lignes par page"
              hideLabel
              value={String(limit)}
              onChange={(event) => {
                setLimit(Number(event.target.value));
                resetToFirstPage();
              }}
              options={PROMOTIONS_PAGE_SIZE_OPTIONS.map((size) => ({ value: String(size), label: String(size) }))}
            />
            <PaginationControls
              page={page}
              totalPages={totalPages}
              onPrev={() => setPage((current) => Math.max(1, current - 1))}
              onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
            />
          </div>
        </div>
      )}
    </section>
  );
}
