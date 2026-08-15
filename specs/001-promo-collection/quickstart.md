# Quickstart: Validate F1 — Collecte & structuration des promotions

Guide de validation manuelle de bout en bout. Ne duplique pas les détails de contrat ou de schéma — voir
`contracts/promo-collection-api.md` et `data-model.md`.

## Prérequis

- Variables d'environnement renseignées (voir `.env.example`) : `DATABASE_URL`, `DIRECT_URL` (Supabase
  Postgres), `CRON_SECRET`, clés Supabase Auth, clé `@anthropic-ai/sdk` (uniquement nécessaire pour valider
  US3).
- Base de données migrée : `npm run prisma:migrate` (ou `prisma:deploy` en environnement non interactif).
- Au moins les 4 lignes `StoreChain` seed (colruyt, aldi, delhaize, lidl) présentes avec `isActive = true`.
- `npm run dev` démarré localement (ou déploiement Vercel preview).

## Scénario 1 — Collecte planifiée simulée (US1, FR-001 à FR-010)

1. Déclencher manuellement chacune des 4 routes de collecte comme le ferait un cron :
   `POST /api/cron/collect-promotions/colruyt` avec `Authorization: Bearer <CRON_SECRET>` (répéter pour
   `aldi`, `delhaize`, `lidl`).
2. **Attendu** : chaque appel retourne `200` avec `status ∈ { complete, format_drift }` et un `runId`
   partagé identique pour les 4 appels effectués la même semaine (`weekKey` commun).
3. Vérifier en base que `CollectionRun.status` est `complete` une fois les 4 `CollectionRunChain` dans un
   état terminal (voir transitions dans `data-model.md`).

## Scénario 2 — Tolérance de panne partielle (US1, UC-4, FR-008)

1. Désactiver temporairement l'accès réseau à une seule enseigne (ou pointer `baseUrl` vers une URL
   invalide pour cette enseigne uniquement) puis relancer le Scénario 1.
2. **Attendu** : l'enseigne ciblée se retrouve en `failed` dans `CollectionRunChain`, mais les 3 autres
   passent en `complete`/`format_drift` normalement ; le `CollectionRun` global passe en `partial`
   (jamais `failed` tant qu'au moins une enseigne a réussi).
3. Vérifier que le catalogue (`GET /api/promotions?storeChain=<enseigne_en_échec>`) contient toujours les
   promotions collectées lors d'un run antérieur réussi (pas de suppression silencieuse — FR-015).

## Scénario 3 — Dérive de format détectée (US1, FR-009)

1. Sur une enseigne ayant déjà un run `complete` avec un `itemsCollected` connu (baseline), simuler un
   retour anormalement bas (ex. modifier temporairement le sélecteur HTML attendu par l'adaptateur pour
   qu'il ne trouve presque rien) puis redéclencher la collecte pour cette seule enseigne.
2. **Attendu** : `CollectionRunChain.status = format_drift` (pas `complete`, pas `failed`), aucun upsert
   effectué sur le catalogue de cette enseigne, le catalogue existant reste inchangé.

## Scénario 4 — Interface de contrôle (US2, FR-011 à FR-013)

1. Se connecter avec un compte ayant le rôle propriétaire/admin sur `/dashboard/collecte`.
2. **Attendu** : la liste des promotions actuellement valides s'affiche, filtrable par enseigne et
   catégorie ; l'historique des collectes affiche chaque run avec son statut global et le détail par
   enseigne, `format_drift` visuellement distinct de `failed`.
3. Déclencher une collecte manuelle depuis l'interface (`POST /api/collections/trigger`, sans `chainSlug`).
4. **Attendu** : un nouveau `CollectionRun` (`trigger: "manual"`, `weekKey: null`) apparaît dans
   l'historique, indépendant du run hebdomadaire planifié en cours le cas échéant.
5. Redéclencher immédiatement une collecte manuelle globale pendant que la précédente tourne encore.
6. **Attendu** : `409`, message clair affiché côté UI (pas un code brut) — voir contrat.
7. Se déconnecter (ou utiliser une session sans le rôle requis) et tenter d'accéder à
   `/dashboard/collecte` ou d'appeler les endpoints protégés directement.
8. **Attendu** : accès refusé (`401`).

## Scénario 5 — Extraction assistée par IA (US3, UC-3) — validation de principe uniquement

Aucune des 4 enseignes actives ne l'exerce en usage normal (voir `research.md` §4) ; ce scénario valide
seulement que le mécanisme de secours respecte le même contrat de sortie que les autres enseignes.

1. Configurer une `StoreChain` de test avec une source de type document non structuré et déclencher sa
   collecte.
2. **Attendu** : les promotions extraites via `claudeVisionFallback` respectent le même schéma Zod
   (`promotionSchema.ts`) que les autres enseignes ; un résultat non conforme au schéma est rejeté et
   logué comme les autres échecs de validation (pas de traitement spécial silencieux).

## Ce que ce quickstart ne couvre pas

Validation de charge/volumétrie (~1000+ produits), calibrage réel du seuil `formatDriftThreshold` sur
données de production, et tout ce qui dépend de F2/F3/F4 — hors périmètre de cette feature.
