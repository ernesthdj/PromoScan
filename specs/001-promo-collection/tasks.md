---

description: "Task list template for feature implementation"
---

# Tasks: Collecte & structuration des promotions (F1)

**Input**: Design documents from `/specs/001-promo-collection/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Included below. Not explicitly requested as TDD in spec.md, but `plan.md`'s Constitution Check
flags a real gap against Principle V (Test Discipline — no test runner installed, `tests/` empty) and
commits to addressing it here; test tasks are therefore in scope for this feature's task list.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each
story.

**Context note**: the F1 implementation (adapters, use cases, API routes, Prisma schema) already exists in
this repository (built via the project's Hub & Spoke agent pipeline before Spec Kit was installed — see
`plan.md` Summary). Tasks below therefore mix genuinely new work (test coverage, seed data, a real
inconsistency found between `spec.md` and the existing API) with verification tasks against the existing
code, rather than from-scratch build tasks.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single project (Next.js App Router) — `app/`, `lib/`, `prisma/`, `tests/` at repository root, per
`plan.md` Project Structure.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Close the tooling gaps identified in `plan.md`/`research.md` before any story-level work.

- [ ] T001 Verify all environment variables in `.env.example` are configured in the target environment
      (`DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
      `CRON_SECRET`, `ANTHROPIC_API_KEY`)
- [ ] T002 [P] Add Vitest as a dev dependency and create `vitest.config.ts` at repository root, plus a
      `"test": "vitest run"` script in `package.json` (research.md §3 decision)
- [ ] T003 [P] Apply Prisma migrations against the target database: `npm run prisma:migrate` (dev) or
      `npm run prisma:deploy` (non-interactive), using the existing `prisma/schema.prisma`

**Checkpoint**: tooling in place; no story work should start before this phase is done.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be verified end-to-end.

**CRITICAL**: No user story validation can begin until this phase is complete — without seeded
`StoreChain` rows, every collection attempt fails at the FR-001 boundary.

- [ ] T004 Create a seed script (`prisma/seed.ts`) inserting the 4 required `StoreChain` rows (`colruyt`,
      `aldi`, `delhaize`, `lidl`) with correct `strategy`, `baseUrl`, `crawlDelayMs` (5000 for Colruyt,
      2000 default for the others) and `isActive: true` — currently missing from the repository (FR-001)
- [ ] T005 [P] Wire the seed script into `package.json` (`prisma.seed` config entry, and a
      `"prisma:seed": "prisma db seed"` script) so it runs via the standard Prisma CLI
- [ ] T006 [P] Unit tests for `lib/domain/formatDriftPolicy.ts` (pure function, no DB dependency) in
      `tests/unit/formatDriftPolicy.test.ts` — covers baseline-absent, zero-result, below-threshold, and
      above-threshold cases (FR-009, research.md §2)
- [ ] T007 [P] Unit tests for `lib/domain/promotionSchema.ts` validation rules in
      `tests/unit/promotionSchema.test.ts` — covers rejection of a promotion missing `rawProductName`,
      `promoPrice`, `validFrom`, or `validTo` (FR-006)
- [ ] T008 [P] Unit tests for `lib/domain/weekKey.ts` in `tests/unit/weekKey.test.ts` — covers ISO week
      formatting used to join the 4 per-chain crons under one `CollectionRun` (research.md §1)

**Checkpoint**: Foundation ready — user story verification can now proceed.

---

## Phase 3: User Story 1 - Catalogue collecté automatiquement (Priority: P1) 🎯 MVP

**Goal**: A structured, up-to-date promotion catalog exists for all 4 configured chains without manual
intervention, and one chain's failure or format drift never corrupts or blocks the others.

**Independent Test**: Trigger a collection run (or its test-environment equivalent) and verify the catalog
contains structured promotions for every chain that responded successfully, per `quickstart.md` Scénarios
1-3.

### Tests for User Story 1

- [ ] T009 [P] [US1] Integration test — `collectChainUseCase` happy path (mocked `StoreAdapter` +
      repository) in `tests/integration/collectChainUseCase.test.ts` (FR-005, FR-006)
- [ ] T010 [P] [US1] Integration test — `collectChainUseCase` format-drift rejection path (catalog
      untouched, `CollectionRunChain.status = format_drift`) in
      `tests/integration/collectChainUseCase.formatDrift.test.ts` (FR-009)
- [ ] T011 [P] [US1] Integration test — re-running `collectChainUseCase` with an identical payload produces
      an upsert, never a duplicate row, in `tests/integration/collectChainUseCase.idempotence.test.ts`
      (FR-010)
- [ ] T012 [US1] Integration test — `runAggregationUseCase` computes `complete`/`partial`/`failed`
      correctly from a mixed set of `CollectionRunChain` states in
      `tests/integration/runAggregationUseCase.test.ts` (FR-008, FR-011)

### Implementation for User Story 1

- [ ] T013 [P] [US1] Verify `lib/infrastructure/adapters/ColruytAdapter.ts` conforms to the
      `StoreAdapter`/`RawPromotion` contract in `lib/domain/StoreAdapter.ts` (contracts/promo-collection-api.md)
- [ ] T014 [P] [US1] Verify `lib/infrastructure/adapters/AldiAdapter.ts` conforms to the same contract
- [ ] T015 [P] [US1] Verify `lib/infrastructure/adapters/DelhaizeAdapter.ts` (headless) conforms to the
      same contract and respects `crawlDelayMs`
- [ ] T016 [P] [US1] Verify `lib/infrastructure/adapters/LidlAdapter.ts` (headless) conforms to the same
      contract and respects `crawlDelayMs`
- [ ] T017 [US1] Run `quickstart.md` Scénario 1 (collecte planifiée simulée) against a seeded environment
      and record the actual result per chain
- [ ] T018 [US1] Run `quickstart.md` Scénario 2 (tolérance de panne partielle) and confirm the other 3
      chains are unaffected
- [ ] T019 [US1] Run `quickstart.md` Scénario 3 (dérive de format détectée) and confirm the catalog is left
      unchanged

**Checkpoint**: User Story 1 is independently verified — the core catalog is trustworthy end-to-end.

---

## Phase 4: User Story 2 - Consultation et déclenchement manuel (Priority: P2)

**Goal**: An authorized user can view the current catalog and run history, and trigger a manual collection,
through a protected control interface.

**Independent Test**: Authenticate as an authorized user, browse `/dashboard/collecte`, filter promotions,
view run history, and trigger a manual collection — per `quickstart.md` Scénario 4.

### Tests for User Story 2

- [ ] T020 [P] [US2] Contract test for `GET /api/promotions` (filters, pagination bounds, default "valid
      only" view) in `tests/contract/promotions.test.ts` (FR-012)
- [ ] T021 [P] [US2] Contract test for `GET /api/collection-runs` (pagination, `format_drift` vs `failed`
      distinction in the payload) in `tests/contract/collectionRuns.test.ts` (FR-011)
- [ ] T022 [P] [US2] Contract test for `POST /api/collections/trigger`, including the `409` concurrent-run
      case scoped per chain, in `tests/contract/collectionsTrigger.test.ts` (FR-003, FR-004)

### Implementation for User Story 2

- [ ] T023 [US2] **Reconcile a real inconsistency found during this planning pass**: `spec.md` (FR-013,
      Clarifications) resolves control-interface access to the owner/admin role only, but
      `docs/API-ENDPOINTS.md` §2 states explicitly "Aucun rôle particulier requis pour le MVP solo — la
      vérification de session suffit." Confirm with the project owner which is authoritative, then align
      the authorization check in `app/api/promotions/`, `app/api/collection-runs/`, and
      `app/api/collections/trigger/` (currently a plain Supabase session check) with the decision. Do not
      silently pick one side — this is a genuine spec/implementation conflict, not a wording nuance.
- [ ] T024 [US2] Run `quickstart.md` Scénario 4 (interface de contrôle) end-to-end, including the
      unauthenticated/unauthorized-access check (step 7-8)

**Checkpoint**: User Stories 1 AND 2 both independently verified.

---

## Phase 5: User Story 3 - Extraction assistée par IA en secours (Priority: P3)

**Goal**: A future chain publishing only unstructured documents (PDF/image) can still be integrated,
without weakening catalog validation.

**Independent Test**: Submit a representative unstructured document and verify the extracted promotions
pass the same validation as any other chain — per `quickstart.md` Scénario 5.

### Tests for User Story 3

- [ ] T025 [P] [US3] Unit test — `lib/infrastructure/claudeVisionFallback.ts` rejects a Claude Vision
      response that does not conform to `promotionSchema.ts`, without corrupting the catalog, in
      `tests/unit/claudeVisionFallback.test.ts` (mocked Anthropic client) (FR-014)

### Implementation for User Story 3

- [ ] T026 [US3] Run `quickstart.md` Scénario 5 (extraction assistée par IA) with a test `StoreChain`
      configured for a non-structured source, and record the actual result

**Checkpoint**: All three user stories independently functional and verified.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories.

- [ ] T027 [P] Record the manual validation results from `quickstart.md` (Scénarios 1-5) in
      `docs/JOURNAL.md`, per the project's journal convention
- [ ] T028 Security review pass against Constitution Principle I across all 4 endpoints: confirm no raw
      scraped page content ever appears in logs or API responses (FOUNDATION §7, `data-model.md`
      `CollectionRunChain.errorMessage`)
- [ ] T029 [P] Add a `npm run typecheck && npm test` pre-deploy check (CI script or `vercel.json`
      `buildCommand` addition) so the new test suite actually gates deployment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories (no seeded
  `StoreChain` rows means no collection can succeed for any story)
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - US1 has no dependency on US2/US3
  - US2 depends on US1 having produced at least some catalog data to be meaningfully browsable, but its
    own tests/contract checks can run against mocked/seeded data independently
  - US3 has no dependency on US1/US2 (it exercises a separate code path — `claudeVisionFallback`)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — no dependency on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) — independently testable via contract
  tests even before US1's adapters are exercised live, since it depends on the API/DB shape, not on live
  scraping
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) — fully independent of US1/US2

### Within Each User Story

- Tests are written before the corresponding verification/implementation task
- Contract/integration tests before end-to-end quickstart runs
- Story complete before moving to the next priority (for a solo-developer sequential execution)

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T002, T003)
- Foundational unit-test tasks marked [P] can run in parallel (T006, T007, T008) — T004/T005 (seed script)
  are sequential (T005 depends on T004 existing)
- Once Foundational completes, US1, US2, US3 test-writing tasks can proceed in parallel across stories
- Within US1: T009-T012 (tests) in parallel with each other; T013-T016 (adapter contract checks) in
  parallel with each other

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Integration test collectChainUseCase happy path in tests/integration/collectChainUseCase.test.ts"
Task: "Integration test collectChainUseCase format-drift path in tests/integration/collectChainUseCase.formatDrift.test.ts"
Task: "Integration test collectChainUseCase idempotence in tests/integration/collectChainUseCase.idempotence.test.ts"
Task: "Integration test runAggregationUseCase in tests/integration/runAggregationUseCase.test.ts"

# Launch all adapter contract-compliance checks for User Story 1 together:
Task: "Verify ColruytAdapter against StoreAdapter contract"
Task: "Verify AldiAdapter against StoreAdapter contract"
Task: "Verify DelhaizeAdapter against StoreAdapter contract"
Task: "Verify LidlAdapter against StoreAdapter contract"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories; seed data is the actual blocker here)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: run `quickstart.md` Scénarios 1-3 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (tooling + seed data + domain unit tests)
2. Add/verify User Story 1 → test independently → deploy/demo (MVP)
3. Add/verify User Story 2 → test independently → deploy/demo (resolve the T023 role-access conflict first)
4. Add/verify User Story 3 → test independently → deploy/demo
5. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- T023 is the one task in this list that is not routine verification: it is a genuine, previously
  undetected conflict between `spec.md` and `docs/API-ENDPOINTS.md` surfaced while writing these tasks —
  do not resolve it silently by editing either document without the project owner's confirmation
- Commit after each task or logical group (per project Constitution Principle VI — never without explicit
  user confirmation)
- Stop at any checkpoint to validate story independently
