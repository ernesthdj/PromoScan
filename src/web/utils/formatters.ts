/**
 * Formatters — Fonctions de formatage pour l'affichage UI.
 * Prix en EUR, dates, pourcentages, distances.
 */

/** Formate un prix en euros (ex: 5.99 -> "5,99 EUR") */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-BE', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

/** Formate un pourcentage de reduction (ex: 33 -> "-33%") */
export function formatDiscount(pct: number | null): string {
  if (pct === null || pct === 0) return '';
  return `-${Math.round(pct)}%`;
}

/** Formate une date en format court belge (ex: "12/06") */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-BE', {
    day: '2-digit',
    month: '2-digit',
  }).format(d);
}

/** Formate une date en format long (ex: "12 juin 2026") */
export function formatDateLong(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-BE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/** Formate une distance en km (ex: 1.234 -> "1,2 km") */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1).replace('.', ',')} km`;
}

/** Formate une duree en minutes (ex: 22 -> "22 min") */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

/** Formate une economie (ex: 14.30 -> "14,30 EUR") */
export function formatSavings(amount: number): string {
  return formatPrice(amount);
}

/** Retourne "Jusq. 12/6" pour une date de fin */
export function formatEndDate(date: Date | string): string {
  return `Jusq. ${formatDateShort(date)}`;
}
