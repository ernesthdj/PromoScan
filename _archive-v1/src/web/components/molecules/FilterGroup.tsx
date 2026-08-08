/**
 * FilterGroup — Groupe de filtres sous forme de chips selectionnables.
 */

import clsx from 'clsx';
import { Tag } from '../atoms/Tag';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterGroupProps {
  label: string;
  options: FilterOption[];
  selectedValues: string[];
  onChange: (value: string) => void;
  className?: string;
}

export function FilterGroup({
  label,
  options,
  selectedValues,
  onChange,
  className,
}: FilterGroupProps) {
  return (
    <fieldset className={clsx('flex flex-col gap-2', className)}>
      <legend className="text-sm font-medium text-neutral-600">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Tag
            key={option.value}
            variant="category"
            selected={selectedValues.includes(option.value)}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Tag>
        ))}
      </div>
    </fieldset>
  );
}
