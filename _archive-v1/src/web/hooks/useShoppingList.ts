/**
 * useShoppingList — CRUD liste de courses via TanStack Query.
 * Queries pour fetch, mutations pour create/update/delete avec invalidation.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../config/api';
import type {
  ShoppingList,
  ShoppingListWithItems,
  ShoppingListItem,
} from '../../shared/types/index';
import type {
  CreateListRequest,
  UpdateListRequest,
  AddItemRequest,
  UpdateItemRequest,
} from '../../shared/types/api';

/** Keys TanStack Query structurees */
const listKeys = {
  all: ['shopping-lists'] as const,
  detail: (id: string) => ['shopping-lists', id] as const,
};

/** Fetch toutes les listes de l'utilisateur */
export function useShoppingLists() {
  return useQuery({
    queryKey: listKeys.all,
    queryFn: () => api.get<ShoppingList[]>('/shopping-lists'),
    staleTime: 30_000,
  });
}

/** Fetch une liste avec ses items */
export function useShoppingListDetail(listId: string | null) {
  return useQuery({
    queryKey: listKeys.detail(listId ?? ''),
    queryFn: () => api.get<ShoppingListWithItems>(`/shopping-lists/${listId}`),
    enabled: !!listId,
    staleTime: 30_000,
  });
}

/** Creer une nouvelle liste */
export function useCreateList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateListRequest) =>
      api.post<ShoppingList>('/shopping-lists', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listKeys.all });
    },
  });
}

/** Renommer une liste */
export function useUpdateList(listId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateListRequest) =>
      api.patch<ShoppingList>(`/shopping-lists/${listId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listKeys.all });
      queryClient.invalidateQueries({ queryKey: listKeys.detail(listId) });
    },
  });
}

/** Supprimer une liste */
export function useDeleteList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (listId: string) =>
      api.delete<null>(`/shopping-lists/${listId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listKeys.all });
    },
  });
}

/** Ajouter un article a une liste */
export function useAddItem(listId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddItemRequest) =>
      api.post<ShoppingListItem>(`/shopping-lists/${listId}/items`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listKeys.detail(listId) });
    },
  });
}

/** Modifier un article (categorie, quantite, checked) */
export function useUpdateItem(listId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      data,
    }: {
      itemId: string;
      data: UpdateItemRequest;
    }) =>
      api.patch<ShoppingListItem>(
        `/shopping-lists/${listId}/items/${itemId}`,
        data,
      ),
    onMutate: async ({ itemId, data }) => {
      await queryClient.cancelQueries({ queryKey: listKeys.detail(listId) });

      const previous = queryClient.getQueryData<ShoppingListWithItems>(
        listKeys.detail(listId),
      );

      if (previous) {
        queryClient.setQueryData<ShoppingListWithItems>(
          listKeys.detail(listId),
          {
            ...previous,
            items: previous.items.map((item) =>
              item.id === itemId ? { ...item, ...data } : item,
            ),
          },
        );
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          listKeys.detail(listId),
          context.previous,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: listKeys.detail(listId) });
    },
  });
}

/** Supprimer un article */
export function useDeleteItem(listId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) =>
      api.delete<null>(`/shopping-lists/${listId}/items/${itemId}`),
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: listKeys.detail(listId) });

      const previous = queryClient.getQueryData<ShoppingListWithItems>(
        listKeys.detail(listId),
      );

      if (previous) {
        queryClient.setQueryData<ShoppingListWithItems>(
          listKeys.detail(listId),
          {
            ...previous,
            items: previous.items.filter((item) => item.id !== itemId),
          },
        );
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          listKeys.detail(listId),
          context.previous,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: listKeys.detail(listId) });
    },
  });
}

/** Decocher tous les articles d'une liste */
export function useUncheckAll(listId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      api.post<null>(`/shopping-lists/${listId}/items/uncheck-all`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listKeys.detail(listId) });
    },
  });
}
