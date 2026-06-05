/**
 * List Store — Zustand store pour l'etat client de la liste de courses.
 * Gere la liste active selectionnee et les items selectionnes pour l'itineraire.
 * Les donnees serveur sont gerees par TanStack Query (useShoppingList hook).
 */

import { create } from 'zustand';

interface ListState {
  activeListId: string | null;
  selectedItems: string[];
}

interface ListActions {
  setActiveListId: (id: string | null) => void;
  toggleItem: (itemId: string) => void;
  selectAllItems: (itemIds: string[]) => void;
  clearSelectedItems: () => void;
}

export const useListStore = create<ListState & ListActions>()((set) => ({
  activeListId: null,
  selectedItems: [],

  setActiveListId: (id) => set({ activeListId: id }),

  toggleItem: (itemId) =>
    set((state) => ({
      selectedItems: state.selectedItems.includes(itemId)
        ? state.selectedItems.filter((id) => id !== itemId)
        : [...state.selectedItems, itemId],
    })),

  selectAllItems: (itemIds) => set({ selectedItems: itemIds }),

  clearSelectedItems: () => set({ selectedItems: [] }),
}));
