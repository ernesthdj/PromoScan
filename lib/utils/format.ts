// lib/utils/format.ts
//
// Formatage d'affichage (devise, dates, temps relatif) — fonctions pures, aucune dépendance
// externe (date-fns/dayjs non nécessaires pour ce périmètre, YAGNI).

const CURRENCY_FORMATTER = new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' });
const DATETIME_FORMATTER = new Intl.DateTimeFormat('fr-BE', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});
const DATE_FORMATTER = new Intl.DateTimeFormat('fr-BE', { day: '2-digit', month: '2-digit' });

export function formatPrice(value: number): string {
  return CURRENCY_FORMATTER.format(value);
}

export function formatDateTime(iso: string): string {
  return DATETIME_FORMATTER.format(new Date(iso));
}

export function formatDateShort(iso: string): string {
  return DATE_FORMATTER.format(new Date(iso));
}

/**
 * Temps relatif en français ("il y a 2 h", "à l'instant"). Granularité volontairement grossière
 * (minute/heure/jour) — suffisant pour un dashboard technique (UI-DESIGN §3.1 RelativeTime),
 * `title` du composant appelant porte la date ISO complète pour la précision exacte.
 */
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const diffMs = now - new Date(iso).getTime();
  if (Number.isNaN(diffMs)) return '—';
  if (diffMs < 30_000) return "à l'instant";

  const diffMinutes = Math.floor(diffMs / 60_000);
  if (diffMinutes < 60) return `il y a ${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `il y a ${diffHours} h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `il y a ${diffDays} j`;

  const diffWeeks = Math.floor(diffDays / 7);
  return `il y a ${diffWeeks} sem.`;
}
