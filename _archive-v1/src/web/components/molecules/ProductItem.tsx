/**
 * ProductItem — Ligne d'article dans une liste de courses.
 * Checkbox + nom + quantite + categorie + suppression.
 */

import clsx from 'clsx';
import { Trash2, Minus, Plus } from 'lucide-react';
import { Checkbox } from '../atoms/Checkbox';
import { Badge } from '../atoms/Badge';
import { CATEGORY_LABELS } from '../../utils/constants';
import type { ProductCategory } from '../../../shared/enums';

interface ProductItemProps {
  id: string;
  name: string;
  quantity: number;
  category: ProductCategory;
  checked: boolean;
  onCheck: (checked: boolean) => void;
  onDelete: () => void;
  onQuantityChange: (quantity: number) => void;
  className?: string;
}

export function ProductItem({
  name,
  quantity,
  category,
  checked,
  onCheck,
  onDelete,
  onQuantityChange,
  className,
}: ProductItemProps) {
  return (
    <div
      className={clsx(
        'flex items-center gap-3 px-3 py-2 rounded-lg',
        'transition-colors duration-fast',
        'hover:bg-neutral-50',
        checked && 'opacity-60',
        className,
      )}
    >
      <Checkbox
        checked={checked}
        onChange={(e) => onCheck(e.currentTarget.checked)}
        aria-label={`Cocher ${name}`}
      />

      <div className="flex-1 min-w-0">
        <span
          className={clsx(
            'text-base text-neutral-800',
            checked && 'line-through text-neutral-400',
          )}
        >
          {name}
        </span>
        <Badge variant="category" className="ml-2">
          {CATEGORY_LABELS[category]}
        </Badge>
      </div>

      {/* Quantite */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
          disabled={quantity <= 1}
          aria-label={`Reduire la quantite de ${name}`}
          className="p-1 rounded hover:bg-neutral-200 disabled:opacity-30 transition-colors"
        >
          <Minus size={14} aria-hidden="true" />
        </button>
        <span className="w-6 text-center text-sm font-medium text-neutral-700">
          {quantity}
        </span>
        <button
          onClick={() => onQuantityChange(quantity + 1)}
          aria-label={`Augmenter la quantite de ${name}`}
          className="p-1 rounded hover:bg-neutral-200 transition-colors"
        >
          <Plus size={14} aria-hidden="true" />
        </button>
      </div>

      {/* Supprimer */}
      <button
        onClick={onDelete}
        aria-label={`Supprimer ${name}`}
        className="p-1.5 rounded hover:bg-red-50 text-neutral-400 hover:text-error-500 transition-colors"
      >
        <Trash2 size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
