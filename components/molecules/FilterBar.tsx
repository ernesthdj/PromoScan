'use client';

import { useEffect, useState } from 'react';
import { Select, TextInput, Button } from '@/components/atoms';

interface ChainOption {
  slug: string;
  name: string;
}

interface FilterBarProps {
  storeChain: string | null;
  category: string;
  chainOptions: ChainOption[];
  onStoreChainChange: (slug: string | null) => void;
  onCategoryChange: (category: string) => void;
  onReset: () => void;
  /** Debounce du filtre texte (ms) — UI-DESIGN §5 : évite une requête par frappe clavier. */
  debounceMs?: number;
}

/**
 * `Select` (enseigne) + `TextInput` (catégorie, debounce) + bouton "Réinitialiser" — réapparaît
 * seulement si ≥1 filtre actif (pas de bruit visuel sinon, UI-DESIGN §3.2).
 */
export function FilterBar({
  storeChain,
  category,
  chainOptions,
  onStoreChainChange,
  onCategoryChange,
  onReset,
  debounceMs = 300,
}: FilterBarProps) {
  const [categoryDraft, setCategoryDraft] = useState(category);

  // Resynchronise le brouillon local si le parent réinitialise la valeur (ex. bouton Réinitialiser).
  useEffect(() => {
    setCategoryDraft(category);
  }, [category]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (categoryDraft !== category) {
        onCategoryChange(categoryDraft);
      }
    }, debounceMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ne redéclencher que sur la frappe locale
  }, [categoryDraft, debounceMs]);

  const hasActiveFilter = Boolean(storeChain) || category.length > 0;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Select
        label="Enseigne"
        value={storeChain ?? ''}
        onChange={(event) => onStoreChainChange(event.target.value || null)}
        options={[{ value: '', label: 'Toutes' }, ...chainOptions.map((c) => ({ value: c.slug, label: c.name }))]}
      />
      <TextInput
        label="Catégorie"
        placeholder="ex. viande, frais…"
        value={categoryDraft}
        onChange={(event) => setCategoryDraft(event.target.value)}
      />
      {hasActiveFilter && (
        <Button variant="secondary" size="sm" onClick={onReset}>
          Réinitialiser
        </Button>
      )}
    </div>
  );
}
