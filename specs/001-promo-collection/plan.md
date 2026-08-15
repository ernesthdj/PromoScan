# Implementation Plan: Collecte & structuration des promotions (F1)

**Branch**: `001-promo-collection` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-promo-collection/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Collecter, valider et structurer automatiquement les promotions alimentaires des 4 enseignes belges
ciblées (Colruyt, Delhaize, Aldi, Lidl) dans un catalogue interne fiable, avec tolérance de panne
partielle par enseigne et une interface de contrôle protégée. Approche technique (voir `research.md`) :
un adaptateur `StoreAdapter` par enseigne derrière une interface commune (Strategy pattern), orchestré
par **4 Vercel Cron Jobs indépendants** (un par enseigne, plutôt qu'un orchestrateur séquentiel unique) qui
convergent sous un même `CollectionRun` hebdomadaire via une clé `weekKey`, avec le résultat de chaque
enseigne isolé dans une table `CollectionRunChain` dédiée pour éliminer tout risque d'écrasement concurrent.

**Note de contexte importante pour ce test** : contrairement au flux Spec Kit standard (spec → plan →
implémentation), ce projet a déjà été implémenté avant l'installation de Spec Kit, via le pipeline d'agents
Hub & Spoke du workspace (`docs/ARCHITECTURE.md`, `docs/API-ENDPOINTS.md`, `prisma/schema.prisma`, code
sous `app/`, `lib/domain`, `lib/application`, `lib/infrastructure`). Ce plan documente donc rétroactivement
l'architecture réellement construite, en s'appuyant sur `docs/FOUNDATION.md` §5 et §10.1 comme demandé, et
en le complétant par les décisions déjà prises et tracées dans `docs/ARCHITECTURE.md` là où elles précisent
ou corrigent la conception initiale de FOUNDATION (voir `research.md` pour le détail de chaque écart).

## Technical Context

**Language/Version**: TypeScript 5.5 (strict mode), Node.js >= 18.18 (runtime Next.js)

**Primary Dependencies**: Next.js 14.2 (App Router, Route Handlers), Prisma 5.18 (`@prisma/client`), Zod
3.23 (validation de frontière), Playwright-core 1.46 + `@sparticuz/chromium` (rendu headless
Delhaize/Lidl), `cheerio` (parsing HTML statique Aldi), `@supabase/ssr` + `@supabase/supabase-js` (Auth +
client DB), `@anthropic-ai/sdk` (fallback extraction IA / US3), `@tanstack/react-query` (frontend)

**Storage**: PostgreSQL (Supabase, hébergement managé) via Prisma ORM — schéma détaillé dans
`data-model.md`

**Testing**: NEEDS CLARIFICATION dans le code existant → **résolu en Phase 0** : aucun test runner n'est
actuellement installé (`package.json` ne déclare ni `vitest` ni `jest`, `tests/` est vide) alors que la
Constitution (Principe V) impose des tests pour toute nouvelle logique métier. Voir `research.md` pour la
décision retenue.

**Target Platform**: Vercel (Serverless/Edge Functions Node.js runtime pour les routes nécessitant
Playwright ; navigateur pour le frontend Next.js)

**Project Type**: Application web full-stack en projet unique (Next.js App Router : frontend + API Route
Handlers dans le même projet, pas de backend séparé)

**Performance Goals**: Pas d'objectif de débit formel (usage solo, faible concurrence) ; contrainte dure =
chaque invocation de collecte par enseigne doit rester sous le `maxDuration` de la fonction Vercel
concernée (raison même de la décision "4 crons distincts" plutôt qu'un orchestrateur séquentiel — voir
`research.md`).

**Constraints**: Respect strict du `robots.txt`/`crawl-delay` par enseigne (`StoreChain.crawlDelayMs`,
5000 ms pour Colruyt, 2000 ms par défaut) ; jamais de contenu brut scrapé en logs ou en réponse API ; jamais
d'écrasement du catalogue par un résultat vide/suspect (politique de dérive de format, seuil relatif
configurable par enseigne, défaut -50 %).

**Scale/Scope**: 4 enseignes au lancement, jusqu'à ~1000+ produits par enseigne (Delhaize constaté), 1 seul
utilisateur (rôle propriétaire/admin) au MVP.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Évalué contre `.specify/memory/constitution.md` (v1.0.0) :

| Principe | Statut | Évaluation |
|----------|--------|------------|
| I. Security First | ✅ PASS | Secrets via env (`CRON_SECRET`, clés Supabase/Claude), pas de contenu scrapé loggé, validation Zod à la frontière (donnée scrapée = entrée non fiable) — conforme dès la conception FOUNDATION §7 et confirmé dans `docs/API-ENDPOINTS.md`. |
| II. Simplicity (YAGNI/DRY/KISS) | ✅ PASS | Pas d'endpoint dédié pour lister les enseignes (YAGNI explicite, `docs/API-ENDPOINTS.md` notes transverses) ; passage de 1 orchestrateur à 4 crons est une réponse à une contrainte réelle mesurée (durée d'exécution), pas une sur-ingénierie spéculative — voir justification en `research.md`. |
| III. Type Safety & Explicit Contracts | ✅ PASS | TypeScript strict, schémas Zod partagés (`lib/domain/promotionSchema.ts`) comme unique source de vérité des types de sortie API (pas de redéfinition côté frontend). |
| IV. Clean Architecture Boundaries | ✅ PASS | Séparation déjà en place : `lib/domain/` (aucun import framework), `lib/application/` (cas d'usage, dépend de `domain/` uniquement), `lib/infrastructure/` (Prisma, Playwright, Supabase, adaptateurs par enseigne). L'interface `StoreAdapter` isole l'orchestrateur des stratégies concrètes par enseigne (Strategy pattern), conforme au principe. |
| V. Test Discipline | ⚠️ GAP IDENTIFIÉ | Aucun test runner installé, `tests/` vide, malgré une logique domaine déjà bien isolée et testable en théorie (`formatDriftPolicy.ts`, `promotionSchema.ts`, `weekKey.ts` sont des fonctions pures). **Non bloquant pour ce plan** (le principe s'applique à la *nouvelle* logique métier ; ce plan documente rétroactivement une base existante) mais **doit être traité avant toute nouvelle story implémentée sur cette feature** — voir décision et recommandation en `research.md` et tâche dédiée dans `tasks.md`. |
| VI. Git Discipline & Traceability | N/A pour ce plan | Aucun commit n'est effectué dans le cadre de cette exécution de Spec Kit (contrainte explicite de ce test). |

**Verdict** : PASS avec une réserve documentée (Principe V) — aucune violation ne nécessite d'entrée dans
`Complexity Tracking`, le gap de test est un rattrapage à planifier, pas un écart architectural à justifier.

*Post-Phase 1 re-check* : inchangé — la conception (`data-model.md`, `contracts/`) n'introduit aucune
nouvelle violation ; elle documente l'existant. Le gap Principe V reste ouvert et est repris explicitement
comme tâche dans `tasks.md`.

## Project Structure

### Documentation (this feature)

```text
specs/001-promo-collection/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
│   └── promo-collection-api.md
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

**Structure Decision**: Option "Single project" adaptée à Next.js App Router — un seul projet contient à
la fois le frontend et l'API (Route Handlers), avec une séparation Clean Architecture interne
(`domain/application/infrastructure`) plutôt qu'une séparation `backend/`/`frontend/` en projets distincts.
Cette structure existe déjà dans le dépôt (constatée, non modifiée par ce plan) :

```text
app/
├── (auth)/login/                            # Page de connexion (Supabase Auth)
├── (dashboard)/dashboard/collecte/          # UC-5 — interface de contrôle protégée
└── api/
    ├── cron/collect-promotions/[chain]/     # POST — déclenchement planifié, 1 route par enseigne (§ research.md)
    ├── promotions/                          # GET — catalogue filtrable (US2)
    ├── collection-runs/                     # GET — historique des collectes (US2)
    └── collections/
        ├── trigger/                         # POST — déclenchement manuel (US2)
        └── status/                          # GET — statut d'un run en cours (support UI)

lib/
├── domain/                                  # Aucun import framework — Clean Architecture
│   ├── StoreAdapter.ts                      # Interface commune + type RawPromotion
│   ├── formatDriftPolicy.ts                 # Fonction pure — évalue le seuil de dérive
│   └── promotionSchema.ts                   # Schémas Zod (frontière de validation)
├── application/                             # Cas d'usage — dépend de domain/, pas d'infra concrète
│   ├── collectChainUseCase.ts               # fetch → validate → drift → upsert POUR UNE enseigne
│   └── runAggregationUseCase.ts             # Recalcule CollectionRun.status depuis les CollectionRunChain
├── infrastructure/                          # Implémentations concrètes, imports framework autorisés
│   ├── adapters/                            # ColruytAdapter, AldiAdapter, DelhaizeAdapter, LidlAdapter
│   ├── repositories/                        # storeChainRepository, collectionRunRepository, ...
│   ├── supabase/                            # server.ts, middleware.ts
│   ├── prisma.ts
│   └── claudeVisionFallback.ts              # UC-3 / US3 — fallback IA formats non structurés
└── types/, hooks/, utils/

prisma/schema.prisma                          # Modèle de données (voir data-model.md)
tests/                                        # Existe mais vide — voir Constitution Check (Principe V)
```

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Aucune violation constitutionnelle bloquante identifiée — cette section reste intentionnellement vide.
Le seul écart (Principe V — absence de tests) est traité comme un gap de couverture à planifier, pas
comme une violation architecturale nécessitant une justification de complexité.
