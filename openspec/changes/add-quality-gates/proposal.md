# Proposal: add-quality-gates

## Why

The baseline scaffold shipped with `lint` stubs (`echo 'no lint yet'`), zero tests, and a
CI that only typechecks — nothing enforces the repo's "agrees with reality" verification
bar or the architecture spec's invariants (deterministic handlers, superset indexing,
read-only API). Before feature changes (x402 indexer hardening, ERC-8004, profiles) start
landing, the repo needs real quality gates so regressions are caught by machines, not by
re-reading diffs.

## What Changes

- Replace every per-package `lint` echo stub with real ESLint 9 flat-config linting
  (typescript-eslint, shared root config) plus a prettier `format:check`.
- Add vitest at the repo root (projects mode) with required unit coverage:
  - Extract the indexer's calldata decoding into a pure, Ponder-free function
    (`apps/indexer/src/decode.ts`) and test it against real Base
    `transferWithAuthorization` calldata fixtures (fetched via RPC, hardcoded with tx
    hashes), covering the `0xe3ee160e` happy path and the garbage-calldata
    `needs_receipt` fallback.
  - Worker: unit-test the facilitator upsert data mapping / SQL usage with a stubbed pg
    client (no live DB).
  - Shared: sanity tests on chain constants (checksummed addresses, 32-byte topics).
- Add NestJS e2e tests (supertest) for `/health` and `/stats` with drizzle mocked at the
  DI provider boundary, plus a `test:integration` lane that runs the same suite against a
  real `DATABASE_URL` (skipping gracefully when absent).
- Rework `.github/workflows/ci.yml` into three required jobs: (a) lint + typecheck +
  unit tests, (b) builds (Next.js + OpenNext bundle, Nest build), (c) integration against
  a Postgres 16 service container seeded with the enrichment init SQL and a settlements
  fixture mirroring the live Ponder-created columns.
- Add two Claude Code review agents (`.claude/agents/spec-reviewer.md`,
  `.claude/agents/chain-reviewer.md`) that review diffs against the OpenSpec architecture
  requirements and against the verified chain constants in `docs/research/`.
- Document the gates in CLAUDE.md: what must be green before a PR, and that code-review
  passes invoke both custom agents.

## Capabilities

### New Capabilities
- `quality`: quality gates — lint/format rules, unit and API test requirements
  (including real-calldata decode fixtures), the three-lane CI contract, and the
  spec/chain review agents every code-review pass must run.

### Modified Capabilities
<!-- none — architecture requirements are unchanged; this adds enforcement around them -->

## Impact

- Adds devDependencies: eslint 9, typescript-eslint, prettier, vitest, supertest,
  @nestjs/testing (unit/CI tooling only — no runtime dependency changes).
- Refactors `apps/indexer/src/index.ts` to import the extracted decode function;
  handler behavior must remain semantically identical (verified by fixtures + typecheck).
- Replaces the single-job CI workflow with three required jobs; PRs now block on lint,
  tests, builds, and integration.
- Adds `scripts/ci/seed.sql` (CI-only settlements fixture) and `.claude/agents/*`.
- No product behavior, endpoint, docker-compose service, or ponder.config.ts change.
