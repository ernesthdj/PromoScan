/**
 * SearchBar — Barre de recherche avec autocompletion dropdown.
 */

import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import clsx from 'clsx';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  suggestions?: string[];
  onSelect?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  suggestions = [],
  onSelect,
  placeholder = 'Rechercher...',
  className,
}: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsOpen(suggestions.length > 0 && value.length >= 2);
    setActiveIndex(-1);
  }, [suggestions, value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      onSelect?.(suggestions[activeIndex]);
      setIsOpen(false);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }

  return (
    <div ref={wrapperRef} className={clsx('relative', className)}>
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          aria-hidden="true"
        />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          className={clsx(
            'w-full pl-10 pr-9 py-2.5 rounded-lg border border-neutral-300',
            'text-base placeholder:text-neutral-400',
            'focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500',
            'transition-colors duration-fast',
          )}
        />
        {value && (
          <button
            onClick={() => onChange('')}
            aria-label="Effacer la recherche"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      {isOpen && (
        <ul
          role="listbox"
          className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          {suggestions.map((item, index) => (
            <li
              key={item}
              role="option"
              aria-selected={index === activeIndex}
              onClick={() => {
                onSelect?.(item);
                setIsOpen(false);
              }}
              className={clsx(
                'px-4 py-2 text-sm cursor-pointer',
                'transition-colors duration-fast',
                index === activeIndex
                  ? 'bg-accent-50 text-accent-700'
                  : 'text-neutral-700 hover:bg-neutral-50',
              )}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
