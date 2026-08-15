# Phase 0 Research: Collecte & structuration des promotions (F1)

Chaque décision ci-dessous résout soit une inconnue du "Technical Context" du plan, soit un des "Points
ouverts / décisions restantes" listés dans `docs/FOUNDATION.md` §12 pour F1. Sources : `docs/FOUNDATION.md`
(§5, §10.1, §12), `docs/ARCHITECTURE.md`, `docs/API-ENDPOINTS.md`, `prisma/schema.prisma`, code existant
sous `lib/`.

## 1. Architecture du cron : orchestrateur unique vs cron par enseigne

- **Decision**: 4 Vercel Cron Jobs distincts, un par enseigne, joints sous un même `CollectionRun`
  hebdomadaire via une clé `weekKey` (contrainte unique Postgres), avec le résultat de chaque enseigne
  écrit isolément dans une table `CollectionRunChain` (`@@unique([collectionRunId, storeChainId])`).
- **Rationale**: FOUNDATION §10.1 laissait ce point ouvert ("à confirmer selon les temps d'exécution
  mesurés à l'implémentation"). L'estimation de volumétrie de FOUNDATION elle-même (~1000+ produits chez
  Delhaize, 2 enseignes en rendu headless Playwright) rend un orchestrateur séquentiel unique susceptible
  de dépasser le `maxDuration` d'une fonction Vercel. Isoler chaque enseigne dans sa propre invocation
  ramène la durée à couvrir à celle de la plus lente des 4 prise isolément, jamais leur somme — et
  renforce au niveau infrastructure (pas seulement applicatif) la règle métier RG-3 ("une enseigne en
  échec ne bloque jamais la collecte des autres").
- **Alternatives considered**:
  - *Orchestrateur séquentiel unique* (option par défaut suggérée par FOUNDATION §10.1) — rejetée : risque
    concret de timeout sur les enseignes headless, couplage temporel entre 4 sources indépendantes.
  - *`resultsByChain` en JSON sur une seule ligne `CollectionRun`* (FOUNDATION §3) — rejetée au profit de
    la table `CollectionRunChain` : 4 fonctions serverless indépendantes écrivant concurremment le même
    champ JSON créeraient un risque de race condition (dernier writer gagne) ; une ligne dédiée par
    enseigne avec contrainte unique élimine ce risque sans verrou applicatif.
- **Impact sur le contrat API**: `/api/cron/collect-promotions` (FOUNDATION §10.1) devient une route
  dynamique `/api/cron/collect-promotions/[chain]`, un appel = une enseigne. Documenté dans
  `contracts/promo-collection-api.md`.

## 2. Seuil de détection de dérive de format (US-F1-07 / FR-009)

- **Decision**: seuil relatif configurable par enseigne, `StoreChain.formatDriftThreshold` (défaut `0.5`,
  soit une baisse de plus de 50 % du nombre d'éléments collectés vs le dernier run réussi de la même
  enseigne) ; un résultat à zéro est toujours traité comme une dérive, indépendamment du seuil.
- **Rationale**: FOUNDATION §9.1/§10.1 mentionnait la règle qualitativement ("dérive de format = 0
  résultat inattendu") sans formule ni seuil chiffré pour les cas non nuls (ex. passage de 184 à 40
  éléments sans être à zéro). Un seuil relatif à la baseline de la même enseigne évite un chiffre absolu
  arbitraire qui ne conviendrait pas à toutes les enseignes (Aldi et Delhaize n'ont pas le même volume).
- **Alternatives considered**: seuil absolu unique pour toutes les enseignes — rejeté (volumes très
  différents par enseigne, un seuil absolu serait soit trop strict pour les petites enseignes, soit trop
  laxiste pour les grandes).

## 3. Testing (gap Constitution Principe V)

- **Decision**: introduire **Vitest** comme test runner, en commençant par les fonctions pures déjà
  isolées dans `lib/domain/` (`formatDriftPolicy.ts`, `promotionSchema.ts`, `weekKey.ts`) — tests unitaires
  sans dépendance DB — puis des tests de cas d'usage sur `lib/application/` avec les repositories mockés,
  avant d'envisager des tests d'intégration contre une base de test pour les repositories Prisma.
- **Rationale**: le code existant est déjà structuré en couches Clean Architecture, ce qui rend le domaine
  et les cas d'usage testables sans environnement lourd — c'est le point d'entrée le moins coûteux pour
  combler le gap identifié dans le Constitution Check du plan. Vitest est choisi plutôt que Jest pour sa
  compatibilité native TypeScript/ESM et son intégration simple avec l'écosystème Next.js/Vite déjà présent
  dans les dépendances modernes du projet (cohérence avec Principe II — Simplicity : pas de configuration
  Babel/transform supplémentaire nécessaire).
- **Alternatives considered**: Jest (plus lourd à configurer avec ESM/TypeScript strict dans ce contexte),
  Playwright Test pour tout (adapté aux tests end-to-end de l'interface `/dashboard/collecte`, mais pas
  substituable aux tests unitaires rapides et déterministes exigés par le Principe V pour la logique
  domaine).
- **Note**: ce n'est pas un blocage à ce plan (feature déjà implémentée), mais une tâche de rattrapage
  explicite portée dans `tasks.md`.

## 4. Fallback d'extraction assistée par IA (US3 / UC-3)

- **Decision**: Claude API (Vision) via `@anthropic-ai/sdk`, déclenché uniquement pour une enseigne future
  configurée avec une source non structurée (PDF/image) ; la réponse est validée contre le même schéma Zod
  (`promotionSchema.ts`) que les autres enseignes avant tout upsert.
- **Rationale**: FOUNDATION §5 identifie ce choix explicitement ("Extraction IA (fallback formats non
  structurés)") ; confirmé par la présence de `lib/infrastructure/claudeVisionFallback.ts` dans le code
  existant. Aucune des 4 enseignes actuelles n'en a besoin (toutes ont une source HTML/API/headless
  exploitable, vérifié FOUNDATION §9.1) — capacité de résilience pour l'extensibilité, pas un chemin actif
  au lancement.
- **Alternatives considered**: aucun autre fournisseur OCR/vision évalué dans FOUNDATION ; hors périmètre
  de re-décision pour ce plan (choix déjà validé et implémenté).

## 5. Matching produit ↔ catégorie (Fuse.js vs `pg_trgm`)

- **Decision**: **non résolu par ce plan — reste un point ouvert**, explicitement hors périmètre de F1.
- **Rationale**: FOUNDATION §12 le classe comme dépendant du "volume/qualité de données récupérées via F1
  en conditions réelles" — c'est-à-dire qu'il ne peut être tranché qu'après que cette feature (F1)
  fonctionne en production. Le tenter maintenant serait une décision prématurée (violerait Principe II —
  YAGNI) puisque F1 ne consomme pas lui-même ce matching (il est utilisé par F4, hors périmètre ici).
- **Alternatives considered**: n/a — décision volontairement différée, pas comparée à ce stade.

## Résumé des inconnues résolues

| Inconnue (Technical Context / FOUNDATION §12) | Statut |
|---|---|
| Testing (aucun runner configuré) | ✅ Résolu — Vitest, voir §3 |
| Architecture cron (orchestrateur vs par enseigne) | ✅ Résolu — 4 crons distincts, voir §1 |
| Seuil de dérive de format | ✅ Résolu — seuil relatif configurable, voir §2 |
| Granularité localisation utilisateur (région/CP/GPS) | Hors périmètre F1 (concerne F4) — non traité ici |
| Matching produit (Fuse.js vs `pg_trgm`) | Volontairement différé — voir §5, hors périmètre F1 |
