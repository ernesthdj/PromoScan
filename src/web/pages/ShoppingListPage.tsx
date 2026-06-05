/**
 * ShoppingListPage — Gestion complete des listes de courses.
 * CRUD listes + items groupes par categorie.
 */

import { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, ClipboardList } from 'lucide-react';
import {
  useShoppingLists,
  useShoppingListDetail,
  useCreateList,
  useDeleteList,
  useAddItem,
  useUpdateItem,
  useDeleteItem,
  useUncheckAll,
} from '../hooks/useShoppingList';
import { useProductSearch } from '../hooks/usePromotions';
import { ShoppingList } from '../components/organisms/ShoppingList';
import { EmptyState } from '../components/molecules/EmptyState';
import { Button } from '../components/atoms/Button';
import { Spinner } from '../components/atoms/Spinner';
import { Input } from '../components/atoms/Input';
import { useListStore } from '../stores/listStore';

export function ShoppingListPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [newListName, setNewListName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { activeListId, setActiveListId } = useListStore();
  const currentListId = id ?? activeListId;

  const { data: lists, isLoading: listsLoading } = useShoppingLists();
  const { data: listDetail, isLoading: detailLoading } = useShoppingListDetail(currentListId);
  const createList = useCreateList();
  const deleteList = useDeleteList();
  const { data: productResults } = useProductSearch(searchQuery);

  const addItem = useAddItem(currentListId ?? '');
  const updateItem = useUpdateItem(currentListId ?? '');
  const deleteItem = useDeleteItem(currentListId ?? '');
  const uncheckAll = useUncheckAll(currentListId ?? '');

  const handleCreateList = useCallback(() => {
    if (!newListName.trim()) return;
    createList.mutate(
      { name: newListName.trim() },
      {
        onSuccess: (newList) => {
          setActiveListId(newList.id);
          setNewListName('');
          setShowCreateForm(false);
          navigate(`/lists/${newList.id}`);
        },
      },
    );
  }, [newListName, createList, setActiveListId, navigate]);

  if (listsLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  // Pas de liste selectionnee : afficher la liste des listes
  if (!currentListId) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-800">Mes listes de courses</h1>
          <Button
            size="sm"
            icon={<Plus size={16} />}
            onClick={() => setShowCreateForm(true)}
          >
            Nouvelle liste
          </Button>
        </div>

        {showCreateForm && (
          <div className="flex gap-2 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
            <Input
              placeholder="Nom de la liste"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
            />
            <Button onClick={handleCreateList} loading={createList.isPending} size="sm">
              Creer
            </Button>
          </div>
        )}

        {!lists || lists.length === 0 ? (
          <EmptyState
            icon={<ClipboardList size={48} />}
            title="Aucune liste de courses"
            description="Creez votre premiere liste pour commencer a recevoir des suggestions de promos !"
            ctaLabel="Creer une liste"
            ctaAction={() => setShowCreateForm(true)}
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {lists.map((list) => (
              <li key={list.id}>
                <button
                  onClick={() => {
                    setActiveListId(list.id);
                    navigate(`/lists/${list.id}`);
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors text-left"
                >
                  <span className="font-medium text-neutral-800">{list.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // Detail d'une liste
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-800">
          {listDetail?.name ?? 'Ma liste'}
        </h1>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => uncheckAll.mutate()}
          >
            Decocher tout
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (currentListId) {
                deleteList.mutate(currentListId, {
                  onSuccess: () => {
                    setActiveListId(null);
                    navigate('/lists');
                  },
                });
              }
            }}
          >
            Supprimer
          </Button>
        </div>
      </div>

      {detailLoading ? (
        <Spinner size="lg" />
      ) : (
        <ShoppingList
          items={listDetail?.items ?? []}
          onCheck={(itemId, checked) =>
            updateItem.mutate({ itemId, data: { checked } })
          }
          onDelete={(itemId) => deleteItem.mutate(itemId)}
          onQuantityChange={(itemId, quantity) =>
            updateItem.mutate({ itemId, data: { quantity } })
          }
          onAdd={(productName, quantity) =>
            addItem.mutate({ productName, quantity })
          }
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          productSuggestions={productResults?.map((p) => p.name) ?? []}
        />
      )}

      {/* CTA vers suggestions */}
      {listDetail && listDetail.items.length > 0 && (
        <div className="mt-4 p-4 bg-primary-50 rounded-lg border border-primary-100">
          <Button onClick={() => navigate('/suggestions')} className="w-full">
            Voir les suggestions pour cette liste
          </Button>
        </div>
      )}
    </div>
  );
}
