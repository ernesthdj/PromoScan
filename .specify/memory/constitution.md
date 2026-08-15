<!--
Sync Impact Report
- Version change: [TEMPLATE] → 1.0.0 (initial ratification)
- Modified principles: n/a (first concrete version, template placeholders replaced)
- Added sections: Core Principles (6), Security & Technology Constraints, Development Workflow, Governance
- Removed sections: none
- Templates requiring updates: .specify/templates/plan-template.md (⚠ pending manual check — not modified by
  this command per Scope Guard), .specify/templates/spec-template.md (⚠ pending manual check),
  .specify/templates/tasks-template.md (⚠ pending manual check)
- Follow-up TODOs: TODO(RATIFICATION_DATE) resolved to constitution creation date (no earlier project charter
  predates this document); revisit if an earlier informal ratification date surfaces.
-->

# PromoScan Constitution

## Core Principles

### I. Security First (NON-NEGOTIABLE)
Every change MUST be evaluated against the OWASP Top 10 before being considered done. No
exceptions for "MVP speed". Concretely:
- No secrets, API keys, tokens, or credentials hard-coded in source; all secrets live in
  environment variables, validated at application startup, and are never logged.
- All inputs MUST be validated at system boundaries (API routes, forms, file/PDF/image uploads,
  scraped third-party content) before being trusted or persisted — scraped promotion data is
  untrusted input like any other and MUST be schema-validated and sanitized before storage or
  display (SQL injection and XSS are the two highest-risk vectors for this project).
- Any suspected vulnerability MUST be flagged immediately rather than deferred.
Rationale: PromoScan ingests third-party HTML/API content on an automated schedule and stores
user accounts; treating scraped data and user input as hostile by default is the cheapest point
to prevent injection and data-integrity incidents.

### II. Simplicity (YAGNI / DRY / KISS)
Do not build abstractions, configuration layers, or generalized frameworks for needs that do not
exist yet. Prefer the straightforward solution that solves the current, real requirement.
Duplicated logic beyond a small, justified threshold MUST be extracted; premature extraction
MUST NOT happen speculatively. No dead code, no debug `console.log`, no unresolved `// TODO`
without a tracked follow-up.
Rationale: A solo-developer MVP validating real usage cannot afford to service speculative
architecture; every hour spent on unneeded flexibility is an hour not spent validating the core
loop (collect → structure → recommend).

### III. Type Safety & Explicit Contracts
TypeScript runs in `strict` mode across the codebase. `any` is forbidden — use `unknown` with
type guards, or precise domain types. Public function/module boundaries (API route handlers,
adapters, use cases) MUST have explicit return types and validated shapes (e.g. Zod schemas
mirroring the TypeScript types) rather than relying on inference alone at the boundary.
Rationale: A pipeline built on scraped, semi-structured external data is only as safe as its
type contracts; implicit `any` at an adapter boundary is exactly where a format drift from a
store would silently corrupt the catalog.

### IV. Clean Architecture Boundaries
Business logic (entities, domain rules, use cases such as promotion collection orchestration,
matching, allocation) MUST NOT import framework, HTTP, ORM, or scraping-library code directly.
Domain code stays framework-agnostic; infrastructure (Next.js route handlers, Prisma, Playwright
adapters, Supabase clients) depends on the domain, never the reverse. Per-store integrations
(Colruyt, Delhaize, Aldi, Lidl) MUST be implemented behind a common adapter interface so the
orchestrator never depends on a store's specific fetch strategy.
Rationale: The store landscape changes independently of business rules (a site redesign should
never require touching allocation or budget logic), and an explicit adapter boundary is what
makes "one store's failure never blocks the others" achievable in practice, not just in the spec.

### V. Test Discipline
New business logic MUST ship with tests covering both the happy path and edge/error cases, not
happy-path only. Test names follow `should_<behavior>_when_<condition>`. Tests are fast,
deterministic, and do not depend on unmocked external services (live store websites, live
Supabase, live Claude API) — network and third-party boundaries are mocked or fixture-driven.
Domain logic is covered by pure unit tests first; use cases by mocked-dependency tests;
cross-cutting integration (DB, adapters) by dedicated integration tests against a test database.
Rationale: The project's riskiest surface (scraping four independently-changing external sites)
is also the least controllable; deterministic tests around adapters and validation are what
catch a silent format drift before it reaches the catalog, per the "never overwrite with an
empty/suspect result" business rule.

### VI. Git Discipline & Traceability
No commit is created without the user's explicit confirmation, ever — this applies to every
agent-driven or automated workflow, no exceptions. Commits follow Conventional Commits
(`feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `security`, `perf`) and are atomic; files are
staged explicitly by name, never via a blanket add without review. Hooks are never bypassed
(`--no-verify`) and force-push to a protected branch never happens without an explicit request.
Rationale: Traceability of *why* a change was made is a project asset (feeds the JOURNAL.md
workflow); confirmation-before-commit is the single control that prevents an automated agent
from taking an irreversible action on the user's behalf.

## Security & Technology Constraints

Sensitivity level: low-to-medium (user account via Supabase Auth, approximate location/region,
dietary habits; no payment or health data in the MVP) — standard GDPR handling applies, no
special-category data processing.

Non-negotiable technical constraints, applicable to every feature built on this stack:
- HTTPS everywhere (native on the hosting platform) — no plaintext transport.
- Any scheduled/automated data collection MUST respect each source's `robots.txt` disallow rules
  and declared `crawl-delay`; a scraping job MUST identify itself with a recognizable User-Agent
  and MUST NOT be tuned to evade a site's stated crawling policy.
- Automated/cron-triggered endpoints MUST be protected by a server-side secret check (reject
  unauthenticated triggers with 401); user-triggered equivalents MUST require an authenticated
  session.
- Logs MUST NOT contain raw scraped page content, credentials, tokens, or other PII — status,
  counts, and error codes only.
- A failed or anomalous data source (zero results where history shows non-zero, a single store
  erroring out) MUST degrade gracefully — never silently wipe previously valid data, never let
  one source's failure block the others.

## Development Workflow

- Every non-trivial task follows: Analysis (read existing code/specs first) → Plan (for
  multi-file or architectural changes) → Implementation (incremental, tested as it goes) →
  Review (security, quality, tests) → Commit (only after explicit user confirmation).
- Code review checks, at minimum: OWASP-relevant risks, adherence to the Clean Architecture
  boundary (Principle IV), absence of `any` (Principle III), and test coverage of the change
  (Principle V) before a change is considered mergeable.
- CI/CD configuration, Dockerfiles, and deployment/build configuration changes require explicit
  review and are never modified silently as a side effect of an unrelated task.
- External dependencies are never introduced silently; a new dependency is called out explicitly
  before or when it is added.

## Governance

This constitution supersedes ad hoc practice for this project; where a lower-level document
(a feature spec, a plan, a template) conflicts with a principle here, the principle here wins
unless the conflict is resolved by an explicit, documented amendment to this file.

Amendment procedure: propose the change (principle addition, removal, or redefinition) with
rationale; classify the version bump per the policy below; update this file via the
`speckit-constitution` workflow so the Sync Impact Report and version/date footer stay
consistent; record the change in the project journal.

Versioning policy (semantic versioning applied to governance, not code):
- MAJOR: backward-incompatible principle removal or redefinition.
- MINOR: a new principle or materially expanded section added.
- PATCH: wording clarifications, typo fixes, non-semantic refinements.

Compliance review: every feature plan and every code review MUST be checked against the
principles above; unresolved conflicts are escalated to the user (mentalyas) rather than
silently resolved by an agent. Runtime development guidance beyond this constitution lives in
`~/.claude/CLAUDE.md` (global standards) and this project's own `CLAUDE.md`.

**Version**: 1.0.0 | **Ratified**: 2026-08-15 | **Last Amended**: 2026-08-15
