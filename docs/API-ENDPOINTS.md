# API Endpoints — PromoScan (F1 — Collecte & structuration des promotions)

> Agent : Software Architect (#2) — Phase 2 (Fondation) du pipeline Hub & Spoke
> Date : 2026-08-08
> Source : `docs/FOUNDATION.md` §10.1, `docs/brainstorm/L3-f1-collecte-promotions.md` §1, `docs/USER-STORIES.md`, `docs/ARCHITECTURE.md` (décision cron §5)
> Périmètre : **F1 uniquement**. Format de réponse uniforme : `{ success, data, error }` (standard global CLAUDE.md).

---

## Vue d'ensemble

| Endpoint | Méthode | Auth | Story tracée |
|----------|---------|------|---------------|
| `/api/cron/collect-promotions/[chain]` | POST | `CRON_SECRET` (Bearer) | US-F1-01 à US-F1-08, US-F1-12 |
| `/api/promotions` | GET | Session Supabase | US-F1-09 |
| `/api/collection-runs` | GET | Session Supabase | US-F1-10 |
| `/api/collections/trigger` | POST | Session Supabase | US-F1-11 |

> Changement vs FOUNDATION §10.1 / L3 §1 : `/api/cron/collect-promotions` devient une **route dynamique par enseigne** (`[chain]`), conséquence directe de la décision cron n°2 (`docs/ARCHITECTURE.md` §5 — un cron distinct par enseigne pour éviter le dépassement de `maxDuration` sur les enseignes headless). La logique métier partagée (fetch → validate → drift → upsert) reste identique à celle décrite en L3, désormais scopée à une seule enseigne par invocation.

---

## 1. `POST /api/cron/collect-promotions/[chain]`

**Rôle :** point d'entrée invoqué par un Vercel Cron Job (un par enseigne) pour déclencher la collecte planifiée d'**une seule** enseigne.

**Auth :** header `Authorization: Bearer <CRON_SECRET>`. Ce header est injecté automatiquement par Vercel Cron lorsque la variable d'environnement `CRON_SECRET` est configurée sur le projet et que l'endpoint est déclaré dans `vercel.json` — jamais exposé publiquement, jamais atteignable sans ce secret.

**Paramètre de route**
| Nom | Type | Contrainte |
|-----|------|------------|
| `chain` | string (segment d'URL) | Doit correspondre à un `StoreChain.slug` existant avec `isActive = true` — validé en base avant toute exécution, jamais fait confiance à la valeur brute |

**Entrée (body) :** aucune.

**Traitement (résumé, détail complet dans `docs/ARCHITECTURE.md` §5.1) :**
1. Vérifie le secret (401 sinon).
2. Valide `chain` contre `StoreChain` actif (404 sinon).
3. Vérifie qu'aucune `CollectionRunChain` de cette enseigne n'est déjà `running`/`pending` en dehors du délai de timeout de secours (409 sinon).
4. `upsert` du `CollectionRun` de la semaine courante (`weekKey`), exécute l'adaptateur de l'enseigne, valide (Zod), applique la politique de dérive de format, upsert du catalogue ou marquage `format_drift`, écrit le résultat dans `CollectionRunChain`.
5. Recalcule le statut agrégé du `CollectionRun` parent si toutes les enseignes sont dans un état terminal.

**Sortie — `200 OK`**
```json
{
  "success": true,
  "data": {
    "runId": "clx...",
    "chainSlug": "colruyt",
    "status": "complete",
    "itemsCollected": 184
  }
}
```
`status` ∈ `complete` | `format_drift` | `failed`.

**Codes d'erreur**
| Code | Cas |
|------|-----|
| `401` | `CRON_SECRET` absent ou invalide |
| `404` | `chain` ne correspond à aucun `StoreChain.slug` actif |
| `409` | Une collecte pour **cette enseigne** est déjà en cours (`running`/`pending` dans le délai de timeout de secours) |
| `500` | Erreur non anticipée (l'enseigne est alors marquée `failed` dans `CollectionRunChain`, les autres enseignes ne sont jamais affectées — RG-3) |

---

## 2. `GET /api/promotions`

**Rôle :** lister les promotions collectées, filtrables, pour l'interface de contrôle `/dashboard/collecte` (US-F1-09).

**Auth :** session utilisateur valide (cookie Supabase, vérifié côté serveur via `supabase.auth.getUser()` dans le Route Handler). Aucun rôle particulier requis pour le MVP solo (mentalyas est le seul utilisateur) — la vérification de session suffit.

**Entrée — query params**
| Param | Type | Obligatoire | Détail |
|-------|------|--------------|--------|
| `storeChain` | string (slug) | non | Filtre sur `StoreChain.slug` |
| `category` | string | non | Filtre sur `Promotion.category` |
| `page` | number | non (défaut 1) | Pagination |
| `limit` | number | non (défaut 25, max 100) | Pagination — plafond serveur pour éviter une requête abusive sur ~1000+ lignes (Delhaize) |

**Sortie — `200 OK`**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "clx...",
        "storeChain": "delhaize",
        "rawProductName": "Poulet fermier 1kg",
        "category": "viande",
        "unitLabel": "1 kg",
        "regularPrice": 9.99,
        "promoPrice": 6.99,
        "discountPercent": 30,
        "pricePerUnit": 6.99,
        "validFrom": "2026-08-10",
        "validTo": "2026-08-16"
      }
    ],
    "total": 1042,
    "page": 1
  }
}
```

**Codes d'erreur**
| Code | Cas |
|------|-----|
| `401` | Pas de session valide |
| `400` | `page`/`limit` hors bornes acceptées (ex. `limit > 100`, valeurs non numériques) |

---

## 3. `GET /api/collection-runs`

**Rôle :** consulter l'historique des cycles de collecte (US-F1-10), vue agrégée par `CollectionRun` avec détail par enseigne.

**Auth :** session utilisateur valide (identique à `/api/promotions`).

**Entrée — query params**
| Param | Type | Obligatoire | Détail |
|-------|------|--------------|--------|
| `page` | number | non (défaut 1) | Pagination |
| `limit` | number | non (défaut 20, max 50) | Pagination |

**Sortie — `200 OK`**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "clx...",
        "weekKey": "2026-W32",
        "trigger": "cron",
        "startedAt": "2026-08-10T03:00:00Z",
        "finishedAt": "2026-08-10T03:14:00Z",
        "status": "partial",
        "chains": [
          { "chainSlug": "colruyt", "status": "complete", "itemsCollected": 184, "error": null },
          { "chainSlug": "aldi", "status": "complete", "itemsCollected": 96, "error": null },
          { "chainSlug": "delhaize", "status": "format_drift", "itemsCollected": 12, "error": null },
          { "chainSlug": "lidl", "status": "failed", "itemsCollected": null, "error": "timeout" }
        ]
      }
    ],
    "total": 27
  }
}
```
`chains[].status` distingue explicitement `format_drift` (US-F1-07) de `failed` (US-F1-06) — condition explicite du DoD US-F1-10, portée par l'UI via ce champ. Résultats triés par `startedAt` décroissant (run le plus récent en premier).

**Codes d'erreur**
| Code | Cas |
|------|-----|
| `401` | Pas de session valide |
| `400` | Pagination hors bornes |

---

## 4. `POST /api/collections/trigger`

**Rôle :** déclencher une collecte manuelle à la demande depuis `/dashboard/collecte` (US-F1-11), sans attendre le prochain cron hebdomadaire.

**Auth :** session utilisateur valide (cookie Supabase). Ne partage jamais le mécanisme `CRON_SECRET` — deux points d'entrée distincts vers la même logique métier (`collectChainUseCase`), conformément au contrat initial du L3 §1.

**Entrée — body (JSON), optionnel**
```json
{ "chainSlug": "colruyt" }
```
| Champ | Type | Obligatoire | Détail |
|-------|------|--------------|--------|
| `chainSlug` | string | non | Si fourni, déclenche uniquement cette enseigne (usage debug — cf. justification `docs/ARCHITECTURE.md` §5.2). Si absent, déclenche les 4 enseignes actives en parallèle |

**Traitement :** crée un nouveau `CollectionRun` (`weekKey: null`, `trigger: "manual"`), jamais joint au run hebdomadaire en cours. Exécute `collectChainUseCase` pour l'enseigne ciblée (ou les 4 en parallèle via `Promise.allSettled`).

**Sortie — `200 OK`**
```json
{
  "success": true,
  "data": {
    "runId": "clx...",
    "trigger": "manual",
    "chains": [
      { "chainSlug": "colruyt", "status": "complete", "itemsCollected": 184 }
    ]
  }
}
```
Même forme de corps que `/api/cron/collect-promotions/[chain]` pour la ou les enseignes déclenchées (cohérent avec l'exigence L3 : "Même corps que `/api/cron/collect-promotions`").

**Codes d'erreur**
| Code | Cas |
|------|-----|
| `401` | Pas de session valide |
| `400` | `chainSlug` fourni mais ne correspond à aucun `StoreChain.slug` actif |
| `409` | Sans `chainSlug` : au moins une enseigne a déjà un run `running`/`pending`. Avec `chainSlug` : **cette** enseigne précise a déjà un run `running`/`pending` (les autres enseignes peuvent être déclenchées librement pendant ce temps — indépendance de processus, cf. décision cron §5) |

L'UI doit afficher un message clair sur `409` (pas un code brut) et désactiver le bouton de déclenchement tant qu'un run est en cours pour la portée concernée (US-F1-11, feedback < 200ms).

---

## Notes transverses pour Backend (#4) et Frontend (#5)

- Format uniforme `{ success, data, error }` sur toutes les réponses, y compris les erreurs (`{ success: false, error: { code, message } }`).
- Les 4 endpoints partagent les mêmes schémas Zod de sortie (`lib/domain/promotionSchema.ts`) — pas de redéfinition de types côté frontend, réutilisation directe (cohérent avec le standard global TypeScript strict / pas de `any`).
- Aucun endpoint ne renvoie le contenu brut scrapé (sécurité — FOUNDATION §7) : seuls les champs structurés (`rawProductName`, prix, dates, statut, compteurs) transitent par l'API.
- La liste des enseignes valides pour le filtre `storeChain` de `/api/promotions` n'est pas exposée par un endpoint dédié (YAGNI — 4 enseignes fixes au MVP) ; le frontend peut soit la coder en dur, soit la dériver des valeurs distinctes déjà présentes dans les réponses de `/api/collection-runs`.
