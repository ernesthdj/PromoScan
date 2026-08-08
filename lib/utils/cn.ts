// lib/utils/cn.ts
//
// Combineur de classes minimal — évite d'ajouter `clsx`/`tailwind-merge` pour un besoin aussi
// simple (concaténation conditionnelle) sur ce seul écran (YAGNI).

export type ClassValue = string | number | null | undefined | false;

export function cn(...values: ClassValue[]): string {
  return values.filter((value): value is string | number => Boolean(value)).join(' ');
}
