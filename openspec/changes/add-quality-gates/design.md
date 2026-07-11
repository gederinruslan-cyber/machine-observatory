# Design: quality gates

## Context

The monorepo (pnpm; apps/indexer on Ponder 0.16, apps/worker on node-cron + pg, apps/api
on NestJS 11 + drizzle, apps/web on Next.js 16 + OpenNext, packages/shared) has typecheck
as its only automated gate. Lint scripts are echo stubs, no test runner exists, and the
architecture spec's invariants live only in prose. The repo convention "agrees with
reality" implies decode logic must be tested against real Base calldata, not synthetic
bytes. Constraints: no product-behavior changes, docker-compose services untouched,
ponder.config.ts untouched, no live-DB dependency in the CI unit lane.

## Goals / Non-Goals

**Goals:**
- One command each for lint, format check, typecheck, unit tests; all green locally and on PR.
- Decode logic testable in isolation with fixtures verified against the chain.
- API endpoints testable without a database; the same suite reusable against a real one.
- CI that catches lint/type/test/build/DB-contract regressions in three parallel lanes.
- Review agents that mechanize the two review axes machines are bad at grepping for:
  architecture-spec conformance and chain-constant provenance.

**Non-Goals:**
- Coverage thresholds, mutation testing, or E2E browser tests (premature for a skeleton).
- Web unit tests (one static page today; gate is typecheck + real OpenNext build in CI).
- Testing Ponder's own runtime (framework territory; our unit is the pure decode fn).
- CD / deploy automation (hosting change lands separately).

## Decisions

1. **ESLint 9 flat config at the root, consumed by every package** via `eslint .` with
   per-package `lint` scripts (so `pnpm -r lint` keeps working and editors resolve the
   nearest config). One root `eslint.config.mjs` using `typescript-eslint` recommended
   (non-type-checked) + a handful of high-value rules (`no-floating-promises` needs type
   info, so we use `recommendedTypeChecked` scoped with `projectService`). Alternative —
   per-package configs — rejected: five copies of the same 40 lines. Prettier stays the
   sole formatter; `format:check` is a root script (prettier is already the de-facto
   formatter of the scaffold, just never enforced).

2. **Vitest in projects mode from a root `vitest.config.ts`**, one project per package
   that has tests (indexer, worker, shared, api). Root `pnpm test` runs everything;
   `pnpm --filter <pkg> test` stays available. Alternative — per-package standalone
   vitest configs invoked by `pnpm -r test` — rejected: slower (N processes), no unified
   reporter, and the api package needs different settings (globals for Nest DI) that
   projects mode expresses cleanly.

3. **Decode extraction: `apps/indexer/src/decode.ts` exports a pure
   `decodeSettlementCalldata(to, input)`** returning `{buyer, seller, amount,
   decodeSource}` — exactly the fields the handler writes today. No `ponder:*` imports so
   vitest can load it without Ponder's virtual modules; the handler in `index.ts` becomes
   a thin call + insert. Fixtures are real Base transactions: recent `AuthorizationUsed`
   logs found via `eth_getLogs` on https://base.drpc.org, calldata pulled with
   `eth_getTransactionByHash`, expected buyer/seller/amount cross-checked against the
   decoded args, and each fixture carries its tx hash in a comment so anyone can
   re-verify. This is the "agrees with reality" bar applied to unit tests.

4. **Worker tests stub pg, not the network.** `syncFacilitatorWallets` takes its pool
   from `../db.js`; tests mock that module with a stub capturing `query(text, values)`
   calls, and mock the `facilitators` package + upstream fetch to feed known inputs. What
   is asserted: CAIP-2 mapping, EVM lowercasing vs Solana verbatim, upstream-overrides-
   package merge, and the upsert SQL targeting `enrichment.facilitator_wallets` with the
   right parameter order. Alternative — pg-mem — rejected: heavier, and the unit under
   test is the mapping, not Postgres.

5. **API tests mock at the drizzle DI boundary.** The e2e suite builds the Nest app with
   `Test.createTestingModule({imports:[AppModule]}).overrideProvider(DB)` and a stub
   whose `select().from()` chain resolves canned rows — the narrowest seam that keeps
   controllers, DTO serialization, and routing real. The same spec file doubles as the
   integration suite: when `DATABASE_URL` is set (and `TEST_INTEGRATION=1`), it skips the
   override and asserts against the real DB (shape assertions, not exact counts).
   `describe.skipIf` gives the graceful skip. Alternative — separate integration file —
   rejected: two suites drift; one suite with a boundary switch cannot.

6. **CI: three independent jobs** (`checks`, `build`, `integration`) so failures are
   attributable and lanes parallelize. `checks` runs ponder codegen first (indexer
   typecheck needs `ponder-env.d.ts` / generated types), then lint, format:check,
   typecheck, unit tests. `build` compiles web (incl. OpenNext Cloudflare bundle) and
   api (nest build). `integration` uses a `postgres:16` service container, applies
   `docker/postgres-init/*.sql` then `scripts/ci/seed.sql` (a fixture `settlements` table
   mirroring the live Ponder-created columns — `numeric(78,0)` for bigints, text for hex
   — verified against the running local DB), then runs `test:integration`. Seeding via
   psql rather than running Ponder in CI keeps the lane fast and RPC-free.

7. **Review agents as Claude Code agent definitions** (`.claude/agents/*.md`, YAML
   frontmatter + system prompt). `spec-reviewer` gets the concrete, greppable invariants
   (superset indexing, two schema domains, deterministic handlers, read-only API, CAIP-2
   keys) with instructions to read `openspec/specs/` and active change deltas before
   judging. `chain-reviewer` treats `docs/research/*.md` as the only source of truth for
   addresses/topics/selectors and flags any constant in a diff it cannot trace there.
   Both are read-only (no Edit/Write tools) and report findings with file:line.

## Risks / Trade-offs

- [Fixture transactions rely on drpc.org availability at authoring time] → fixtures are
  hardcoded after one fetch; tests never touch the network. Tx hashes in comments allow
  re-verification against any Base RPC or explorer.
- [CI seed.sql drifts from Ponder's real DDL when ponder.schema.ts changes] → seed
  header documents the source of truth and the psql command to re-derive it; the
  integration lane fails loudly on column mismatch, which is the drift signal we want.
- [Type-checked lint rules slow `pnpm lint`] → `projectService` scoping and excluding
  generated/dist paths keeps it seconds-scale at current repo size; revisit if it grows.
- [Mocked drizzle chain in API tests couples tests to query shape] → the stub implements
  only `select().from()` (what StatsService uses); if queries get richer, integration
  mode still exercises the real path, so false confidence is bounded.
- [Ponder codegen in CI needs no RPC] → verified: `ponder codegen` only emits types from
  ponder.schema.ts/config; a dummy `PONDER_RPC_URL_8453` env var satisfies the config's
  non-null assertion.

## Migration Plan

Pure addition: land tooling + tests + CI in one PR on `change/add-quality-gates`. The
only source refactor is index.ts importing decode.ts (semantically identical). Rollback =
revert the PR; no data or deploy surface involved.

## Open Questions

- Whether the web app should get vitest + testing-library now or with its first
  interactive component (deferred to the profiles change).
- Whether `format:check` should be folded into `lint` via eslint-config-prettier +
  plugin, or stay a separate prettier invocation (chosen: separate — faster, zero rule
  conflicts by construction).
