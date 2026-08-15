# Interface Contract: API Collecte & structuration des promotions (F1)

Format de réponse uniforme sur tous les endpoints : `{ success, data, error }` (succès) ou
`{ success: false, error: { code, message } }` (échec) — standard global du projet.

Source de vérité détaillée (exemples de payload complets, codes d'erreur) : `docs/API-ENDPOINTS.md`.
Ce contrat en reprend la substance au niveau attendu d'un artefact `/speckit-plan`.

## 1. `POST /api/cron/collect-promotions/[chain]`

Déclenche la collecte planifiée d'**une seule** enseigne (FR-002, FR-007). Une route par enseigne —
conséquence de la décision "4 crons distincts" (`research.md` §1), pas un endpoint générique multi-enseigne.

- **Auth**: `Authorization: Bearer <CRON_SECRET>` — 401 si absent/invalide.
- **Route param**: `chain` (slug) — doit correspondre à un `StoreChain.slug` actif ; 404 sinon.
- **Body**: aucun.
- **200**: `{ success: true, data: { runId, chainSlug, status, itemsCollected } }` où
  `status ∈ { complete, format_drift, failed }`.
- **Erreurs**: `401` secret invalide · `404` enseigne inconnue/inactive · `409` collecte déjà en cours pour
  **cette** enseigne (FR-004, garde de concurrence par enseigne) · `500` erreur non anticipée (l'enseigne
  est marquée `failed`, les autres ne sont jamais affectées — FR-008).

## 2. `GET /api/promotions`

Liste les promotions du catalogue, filtrable — alimente US2 / FR-012.

- **Auth**: session utilisateur valide (rôle propriétaire/admin — FR-013).
- **Query**: `storeChain?`, `category?`, `page?` (défaut 1), `limit?` (défaut 25, max 100).
- **200**: `{ success: true, data: { items: Promotion[], total, page } }` — par défaut ne renvoie que les
  promotions actuellement valides (voir `data-model.md`, vue "actuellement valide").
- **Erreurs**: `401` pas de session · `400` pagination hors bornes.

## 3. `GET /api/collection-runs`

Historique des collectes, vue agrégée par run avec détail par enseigne — alimente US2 / FR-011.

- **Auth**: session utilisateur valide (FR-013).
- **Query**: `page?` (défaut 1), `limit?` (défaut 20, max 50).
- **200**: `{ success: true, data: { items: CollectionRunSummary[], total } }`, triés par `startedAt`
  décroissant ; chaque item inclut `chains[]` avec `status` distinguant explicitement `format_drift` de
  `failed` (voir `data-model.md`).
- **Erreurs**: `401` pas de session · `400` pagination hors bornes.

## 4. `POST /api/collections/trigger`

Déclenchement manuel à la demande — alimente US2 / FR-003.

- **Auth**: session utilisateur valide (rôle propriétaire/admin — FR-013). Mécanisme d'auth totalement
  distinct de `CRON_SECRET`.
- **Body** (optionnel): `{ chainSlug?: string }` — absent ⇒ déclenche les 4 enseignes actives en parallèle ;
  fourni ⇒ déclenche uniquement cette enseigne.
- **Traitement**: crée toujours un **nouveau** `CollectionRun` (`weekKey: null`, `trigger: "manual"`),
  jamais joint au run hebdomadaire planifié en cours (voir `research.md` §1).
- **200**: `{ success: true, data: { runId, trigger: "manual", chains: [...] } }`.
- **Erreurs**: `401` pas de session · `400` `chainSlug` fourni mais invalide/inactif · `409` collecte déjà
  en cours pour la portée demandée (FR-004 ; sans `chainSlug`, au moins une enseigne est déjà en cours ;
  avec `chainSlug`, seule cette enseigne précise est bloquante — les autres restent déclenchables).

## Interface interne : `StoreAdapter`

Contrat implémenté par chaque enseigne (Strategy pattern, FOUNDATION §6, confirmé `lib/domain/StoreAdapter.ts`) :

```ts
interface StoreAdapter {
  chainSlug: string;
  strategy: "api" | "html" | "headless";
  fetchPromotions(): Promise<RawPromotion[]>;
}

interface RawPromotion {
  rawProductName: string;
  category: string | null;
  unitLabel: string | null;
  regularPrice: number | null;
  promoPrice: number;
  discountPercent: number | null;
  pricePerUnit: number | null;
  validFrom: string;
  validTo: string;
  sourceUrl: string;
  originLabel: string | null;
}
```

L'orchestrateur (route par enseigne) ne connaît jamais la stratégie technique concrète d'une enseigne — il
appelle uniquement `fetchPromotions()` puis passe le résultat au pipeline commun Extract → Validate (Zod)
→ Drift policy → Load (upsert), quel que soit `strategy`.

## Codes d'erreur communs à tous les endpoints ci-dessus

| Code | Signification générale |
|---|---|
| `401` | Authentification absente ou invalide (secret cron, ou session utilisateur) |
| `400` | Entrée invalide (paramètres hors bornes, `chainSlug` non whitelisté) |
| `404` | Ressource référencée introuvable (enseigne inconnue) |
| `409` | Conflit de concurrence — une collecte est déjà en cours dans la portée demandée |
| `500` | Erreur non anticipée — isolée à l'enseigne concernée, ne se propage jamais aux autres |
