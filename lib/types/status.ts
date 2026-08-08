// lib/types/status.ts
//
// Types de statut consommés par le frontend — miroir volontairement dupliqué des enums Prisma
// (ChainRunStatus / CollectionRunStatus, cf. prisma/schema.prisma) plutôt qu'un import direct de
// `@prisma/client` côté client. Décision Frontend (#5) : importer le client Prisma dans un
// composant client alourdirait inutilement le bundle navigateur (Prisma Client embarque des
// binaires/métadonnées non pertinents pour l'UI) et romprait la frontière HTTP entre le
// navigateur et le serveur — le frontend ne consomme que le JSON exposé par les endpoints
// (docs/API-ENDPOINTS.md), jamais les types internes de la couche persistance. Surface
// volontairement petite (6 valeurs) : à resynchroniser manuellement si les enums évoluent.

export type ChainStatus = 'pending' | 'running' | 'complete' | 'failed' | 'format_drift';
export type RunStatus = 'running' | 'partial' | 'complete' | 'failed';
export type AnyStatus = ChainStatus | RunStatus;

/** Jeton sémantique générique (docs/PALETTE.md §5) — couche d'indirection statut métier -> token. */
export type StatusToken = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export const STATUS_TOKEN_MAP: Record<AnyStatus, StatusToken> = {
  complete: 'success',
  format_drift: 'warning',
  failed: 'error',
  running: 'info',
  pending: 'neutral',
  partial: 'warning',
};

export const STATUS_LABEL_MAP: Record<AnyStatus, string> = {
  complete: 'Complet',
  format_drift: 'Dérive de format',
  failed: 'Échec',
  running: 'En cours',
  pending: 'En attente',
  partial: 'Partiel',
};
