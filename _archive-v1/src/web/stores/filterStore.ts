/**
 * Filter Store — Zustand store pour les filtres de promotions.
 * Etat client uniquement — les filtres sont envoyes aux hooks TanStack Query.
 */

import { create } from 'zustand';
import type { Brand, ProductCategory } from '../../shared/enums';

type SortBy = 'discount' | 'price' | 'endDate' | 'relevance';

interface FilterState {
  selectedBrands: Brand[];
  selectedCategories: ProductCategory[];
  sortBy: SortBy;
}

interface FilterActions {
  toggleBrand: (brand: Brand) => void;
  toggleCategory: (category: ProductCategory) => void;
  setSortBy: (sort: SortBy) => void;
  resetFilters: () => void;
}

const initialState: FilterState = {
  selectedBrands: [],
  selectedCategories: [],
  sortBy: 'relevance',
};

export const useFilterStore = create<FilterState & FilterActions>()((set) => ({
  ...initialState,

  toggleBrand: (brand) =>
    set((state) => ({
      selectedBrands: state.selectedBrands.includes(brand)
        ? state.selectedBrands.filter((b) => b !== brand)
        : [...state.selectedBrands, brand],
    })),

  toggleCategory: (category) =>
    set((state) => ({
      selectedCategories: state.selectedCategories.includes(category)
        ? state.selectedCategories.filter((c) => c !== category)
        : [...state.selectedCategories, category],
    })),

  setSortBy: (sortBy) => set({ sortBy }),

  resetFilters: () => set(initialState),
}));
