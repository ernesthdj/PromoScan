/**
 * ShoppingList — Liste de courses complete.
 * Barre d'ajout + items groupes par categorie + actions.
 */

import { useState, useMemo } from 'react';
import clsx from 'clsx';
import { Plus } from 'lucide-react';
import { ProductItem } from '../molecules/ProductItem';
import { SearchBar } from '../molecules/SearchBar';
import { Button } from '../atoms/Button';
import { CATEGORY_LABELS } from '../../utils/constants';
import type { ShoppingListItem } from '../../../shared/types/index';
import type { ProductCategory } from '../../../shared/enums';

interface ShoppingListProps {
  items: ShoppingListItem[];
  onCheck: (itemId: string, checked: boolean) => void;
  onDelete: (itemId: string) => void;
  onQuantityChange: (itemId: string, quantity: number) => void;
  onAdd: (productName: string, quantity: number) => void;
  productSuggestions?: string[];
  onSearchChange?: (query: string) => void;
  searchQuery?: string;
  className?: string;
}

export function ShoppingList({
  items,
  onCheck,
  onDelete,
  onQuantityChange,
  onAdd,
  productSuggestions = [],
  onSearchChange,
  searchQuery = '',
  className,
}: ShoppingListProps) {
  const [newProduct, setNewProduct] = useState('');
  const [newQuantity, setNewQuantity] = useState(1);

  /** Grouper les items par categorie, non-coches en premier */
  const groupedItems = useMemo(() => {
    const unchecked = items.filter((item) => !item.checked);
    const checked = items.filter((item) => item.checked);

    const groups: Record<string, ShoppingListItem[]> = {};

    for (const item of [...unchecked, ...checked]) {
      const cat = item.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }

    return groups;
  }, [items]);

  function handleAdd() {
    const name = newProduct.trim();
    if (!name) return;
    onAdd(name, newQuantity);
    setNewProduct('');
    setNewQuantity(1);
  }

  return (
    <div className={clsx('flex flex-col gap-4', className)}>
      {/* Barre d'ajout */}
      <div className="flex flex-col gap-2 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
        <SearchBar
          value={searchQuery || newProduct}
          onChange={(v) => {
            setNewProduct(v);
            onSearchChange?.(v);
          }}
          suggestions={productSuggestions}
          onSelect={(v) => {
            setNewProduct(v);
            onSearchChange?.('');
          }}
          placeholder="Rechercher un produit..."
        />
        <div className="flex items-center gap-2">
          <label className="text-sm text-neutral-600">Quantite :</label>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setNewQuantity(Math.max(1, newQuantity - 1))}
              aria-label="Reduire quantite"
              className="px-2 py-1 border border-neutral-300 rounded text-sm hover:bg-neutral-100"
            >
              -
            </button>
            <span className="w-8 text-center text-sm font-medium">{newQuantity}</span>
            <button
              onClick={() => setNewQuantity(newQuantity + 1)}
              aria-label="Augmenter quantite"
              className="px-2 py-1 border border-neutral-300 rounded text-sm hover:bg-neutral-100"
            >
              +
            </button>
          </div>
          <Button
            onClick={handleAdd}
            disabled={!newProduct.trim()}
            size="sm"
            icon={<Plus size={16} />}
            className="ml-auto"
          >
            Ajouter
          </Button>
        </div>
      </div>

      {/* Items groupes par categorie */}
      <div className="flex flex-col gap-2">
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <section key={category}>
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide px-3 py-2 border-b border-neutral-100">
              {CATEGORY_LABELS[category as ProductCategory] ?? category}
            </h3>
            <ul role="list" className="divide-y divide-neutral-50">
              {categoryItems.map((item) => (
                <li key={item.id}>
                  <ProductItem
                    id={item.id}
                    name={item.productName}
                    quantity={item.quantity}
                    category={item.category}
                    checked={item.checked}
                    onCheck={(checked) => onCheck(item.id, checked)}
                    onDelete={() => onDelete(item.id)}
                    onQuantityChange={(qty) => onQuantityChange(item.id, qty)}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
