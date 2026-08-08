/**
 * FilterBar — Barre de filtres repliable.
 * Desktop : sidebar. Mobile : panneau repliable (accordeon).
 */

import { useState } from 'react';
import clsx from 'clsx';
import { Filter, X, RotateCcw } from 'lucide-react';
import { FilterGroup } from '../molecules/FilterGroup';
import { Button } from '../atoms/Button';
import { ALL_BRANDS, ALL_CATEGORIES, BRAND_LABELS, CATEGORY_LABELS } from '../../utils/constants';
import type { Brand, ProductCategory } from '../../../shared/enums';

interface FilterBarProps {
  selectedBrands: Brand[];
  selectedCategories: ProductCategory[];
  onToggleBrand: (brand: Brand) => void;
  onToggleCategory: (category: ProductCategory) => void;
  onReset: () => void;
  className?: string;
}

export function FilterBar({
  selectedBrands,
  selectedCategories,
  onToggleBrand,
  onToggleCategory,
  onReset,
  className,
}: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const activeCount = selectedBrands.length + selectedCategories.length;

  const brandOptions = ALL_BRANDS.map((b) => ({ value: b, label: BRAND_LABELS[b] }));
  const categoryOptions = ALL_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }));

  return (
    <div className={clsx('', className)}>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="sm:hidden flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
      >
        <Filter size={16} aria-hidden="true" />
        Filtres
        {activeCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-primary-500 text-white text-xs rounded-full">
            {activeCount}
          </span>
        )}
      </button>

      {/* Filter content */}
      <div
        className={clsx(
          'flex flex-col gap-4 p-4',
          'sm:block', // toujours visible desktop
          isOpen ? 'block' : 'hidden sm:block', // toggle mobile
        )}
      >
        <div className="flex items-center justify-between sm:hidden">
          <span className="text-sm font-semibold text-neutral-700">Filtres</span>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Fermer les filtres"
            className="p-1 rounded hover:bg-neutral-100"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <FilterGroup
          label="Enseigne"
          options={brandOptions}
          selectedValues={selectedBrands}
          onChange={(v) => onToggleBrand(v as Brand)}
        />

        <FilterGroup
          label="Categorie"
          options={categoryOptions}
          selectedValues={selectedCategories}
          onChange={(v) => onToggleCategory(v as ProductCategory)}
        />

        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            icon={<RotateCcw size={14} />}
            onClick={onReset}
          >
            Reinitialiser
          </Button>
        )}
      </div>
    </div>
  );
}
