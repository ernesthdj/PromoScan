// lib/domain/weekKey.ts
//
// Fonction pure (aucun import framework) calculant la clé de semaine ISO 8601 (ex. "2026-W32")
// utilisée pour joindre les 4 crons hebdomadaires indépendants sous un même CollectionRun
// (docs/ARCHITECTURE.md §2.1, décision cron #2). Extraite du gestionnaire de route pour rester
// testable isolément, comme formatDriftPolicy.ts.

export function computeIsoWeekKey(date: Date = new Date()): string {
  // Copie UTC pour éviter toute dépendance au fuseau horaire du runtime serverless.
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

  // Jeudi de la semaine ISO courante (l'année ISO est celle du jeudi de la semaine).
  const dayNr = (target.getUTCDay() + 6) % 7; // lundi = 0 ... dimanche = 6
  target.setUTCDate(target.getUTCDate() - dayNr + 3);

  const isoYear = target.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
  const firstThursdayDayNr = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstThursdayDayNr + 3);

  const weekNumber =
    1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000));

  return `${isoYear}-W${String(weekNumber).padStart(2, '0')}`;
}
