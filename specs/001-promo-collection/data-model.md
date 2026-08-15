# Data Model: Collecte & structuration des promotions (F1)

Source de vérité technique : `prisma/schema.prisma` (déjà implémenté). Ce document reformule le schéma en
termes de modèle de données pour la feature, aligné sur les entités clés de `spec.md` et enrichi des
décisions de `research.md` (§1, §2).

## StoreChain (Enseigne)

Représente une chaîne de magasins configurée comme source de promotions.

| Champ | Type | Règle |
|---|---|---|
| `id` | identifiant | généré |
| `slug` | string | unique — `"colruyt"` \| `"aldi"` \| `"delhaize"` \| `"lidl"` |
| `name` | string | nom affiché |
| `strategy` | enum | `api` \| `html` \| `headless` — stratégie technique de l'adaptateur (FR-005) |
| `baseUrl` | string | URL de base de la source |
| `isActive` | boolean | défaut `true` — une enseigne inactive est ignorée par les collectes (FR-001, Edge Case) |
| `crawlDelayMs` | int | défaut 2000 ; 5000 pour Colruyt (règle métier explicite) — FR-007 |
| `formatDriftThreshold` | float | défaut 0.5 — seuil relatif de dérive, voir `research.md` §2 — FR-009 |

**Validation**: `slug` unique et non modifiable après création (les adaptateurs sont codés en dur par
slug). Désactiver une enseigne (`isActive = false`) ne supprime aucune donnée historique (FR-015).

## Product (Produit canonique)

Référentiel produit utilisé pour regrouper des promotions équivalentes entre enseignes. Matching différé
à F4 (voir `research.md` §5) — hors comportement actif de F1, mais la structure existe pour ne pas
bloquer l'évolution future.

| Champ | Type | Règle |
|---|---|---|
| `id` | identifiant | généré |
| `canonicalName` | string | nom normalisé |
| `category` | string? | optionnel |
| `aliases` | string[] | variantes de nom connues |

## Promotion

Une offre promotionnelle telle que publiée par une enseigne, à un instant donné.

| Champ | Type | Règle |
|---|---|---|
| `id` | identifiant | généré |
| `storeChainId` | FK → StoreChain | obligatoire |
| `productId` | FK → Product? | optionnel (matching non actif en F1) |
| `rawProductName` | string | nom tel que publié par l'enseigne — obligatoire (FR-005/FR-006) |
| `category` | string? | optionnelle si non fournie par la source |
| `unitLabel` | string? | ex. "1 kg" |
| `regularPrice` | decimal? | optionnel (pas toujours publié) |
| `promoPrice` | decimal | obligatoire (FR-006) |
| `discountPercent` | float? | optionnel |
| `pricePerUnit` | decimal? | optionnel |
| `originLabel` | string? | ex. origine du produit |
| `validFrom` | date | obligatoire (FR-006) |
| `validTo` | date | obligatoire (FR-006) |
| `sourceUrl` | string | traçabilité (FR-005) |
| `collectedAt` | datetime | horodatage de collecte |

**Validation** (FR-006): un enregistrement sans `rawProductName`, `promoPrice`, `validFrom` ou `validTo`
est rejeté avant insertion (jamais de valeurs incomplètes en base).

**Contrainte d'idempotence** (FR-010): unique sur `(storeChainId, rawProductName, validFrom)` — un rejeu
de collecte identique produit un upsert, jamais un doublon.

**Vue "actuellement valide"** (Assumption spec.md): filtre applicatif `validFrom <= today <= validTo` pour
la vue par défaut du catalogue (FR-012) ; l'historique complet reste accessible sans ce filtre.

## CollectionRun (Collecte)

Un cycle de collecte, planifié (hebdomadaire) ou manuel — vue agrégée exposée à l'interface de contrôle.

| Champ | Type | Règle |
|---|---|---|
| `id` | identifiant | généré |
| `weekKey` | string? | unique si renseigné — ex. `"2026-W32"` ; `NULL` pour un déclenchement manuel (plusieurs manuels coexistent, voir `research.md` §1) |
| `trigger` | enum | `cron` \| `manual` |
| `startedAt` | datetime | |
| `finishedAt` | datetime? | renseigné quand toutes les enseignes du run sont dans un état terminal |
| `status` | enum | `running` \| `partial` \| `complete` \| `failed` — recalculé depuis les `CollectionRunChain` enfants (FR-011) |

**Transitions d'état** (`status`, recalculé, pas assigné directement) :
`running` → (tant qu'au moins une enseigne du run n'est pas dans un état terminal)
→ `complete` (si toutes les enseignes du run sont `complete`)
→ `partial` (si au moins une enseigne a réussi et au moins une a échoué/dérivé)
→ `failed` (si aucune enseigne du run n'a réussi)

## CollectionRunChain (Résultat par enseigne)

Résultat de collecte d'**une** enseigne pour un `CollectionRun` donné — table dédiée pour éliminer tout
risque d'écrasement concurrent entre les 4 processus indépendants (`research.md` §1).

| Champ | Type | Règle |
|---|---|---|
| `id` | identifiant | généré |
| `collectionRunId` | FK → CollectionRun | obligatoire |
| `storeChainId` | FK → StoreChain | obligatoire |
| `status` | enum | `pending` \| `running` \| `complete` \| `failed` \| `format_drift` |
| `itemsCollected` | int? | nombre d'éléments collectés avec succès |
| `errorMessage` | string? | statut/code d'erreur uniquement — **jamais** de contenu brut scrapé (règle sécurité FOUNDATION §7) |
| `startedAt` / `finishedAt` | datetime? | |

**Contrainte** : unique sur `(collectionRunId, storeChainId)` — une ligne par enseigne par run, écriture
isolée, rejouable sans doublon (FR-004, garde de concurrence par enseigne).

**Distinction `format_drift` vs `failed`** (FR-009, Edge Cases spec.md) : `format_drift` signifie que le
processus s'est exécuté sans erreur technique mais que le résultat a été jugé suspect et rejeté par
politique (catalogue préservé) ; `failed` signifie une erreur d'exécution (technique). L'interface de
contrôle (US2) doit distinguer visuellement les deux.

## Relations (vue d'ensemble)

```text
StoreChain 1──N Promotion
StoreChain 1──N CollectionRunChain
Product    1──N Promotion (optionnel, matching différé)
CollectionRun 1──N CollectionRunChain
```

Diagramme ERD complet et modèles F2/F3/F4 provisoires (User, DietProfile, Budget, Circuit,
StoreLocation) : hors périmètre de cette feature, voir `docs/FOUNDATION.md` §3 et `prisma/schema.prisma`.
