# Tasks: add-quality-gates

## 1. Lint + format

- [x] 1.1 Root `eslint.config.mjs`: ESLint 9 flat config, typescript-eslint
      recommended(-type-checked where cheap) + high-value rules; ignore generated/dist/
      .next/.open-next/ponder generated files
- [x] 1.2 Replace `lint` echo stubs with `eslint .` in all five packages; root `lint`
      stays `pnpm -r lint`; add root `format:check` (prettier) + `.prettierignore`
- [x] 1.3 Fix any violations surfaced across apps/* and packages/* (no rule-disabling
      unless justified inline)

## 2. Vitest unit tests

- [x] 2.1 Root vitest (projects mode) + `pnpm test` script; per-package `test` scripts
      for indexer, worker, shared, api
- [x] 2.2 Extract pure `decodeSettlementCalldata` into `apps/indexer/src/decode.ts`
      (no ponder imports); refactor `src/index.ts` to use it — handler semantics
      unchanged
- [x] 2.3 Fetch 2–3 real Base transferWithAuthorization txs via base.drpc.org
      (eth_getLogs AuthorizationUsed → eth_getTransactionByHash), hardcode calldata +
      expected buyer/seller/amount as fixtures (tx hash in comment); tests for the
      0xe3ee160e happy path and garbage-calldata `needs_receipt` fallback
- [x] 2.4 Worker unit tests: facilitator mapping + upsert SQL with stubbed pg client and
      mocked `facilitators`/upstream source (CAIP-2 mapping, EVM lowercasing,
      merge precedence, upsert params)
- [x] 2.5 packages/shared sanity tests: EIP-55 checksummed addresses, 32-byte hex topics,
      selector shape, CAIP-2 id shape

## 3. API tests

- [x] 3.1 NestJS e2e suite (supertest) for `/health` + `/stats` with drizzle mocked at
      the `DB` provider boundary (no live DB)
- [x] 3.2 `test:integration` script running the same suite against a real `DATABASE_URL`
      (real drizzle provider, shape assertions); graceful skip when env var absent
- [x] 3.3 Verify integration mode green against the live local DB
      (postgresql://observatory:observatory@localhost:5439/observatory)

## 4. CI

- [x] 4.1 `scripts/ci/seed.sql`: settlements fixture table mirroring live Ponder columns
      (verified via psql \d against the local DB) + a few representative rows
- [x] 4.2 Rework `.github/workflows/ci.yml` into three jobs: checks (codegen → lint,
      format:check, typecheck, unit tests), build (web + OpenNext bundle, api nest
      build), integration (postgres:16 service, init SQL + seed.sql, test:integration)

## 5. Review agents + docs

- [x] 5.1 `.claude/agents/spec-reviewer.md`: reviews diffs against openspec/specs/ +
      active change deltas; flags superset-indexing / two-schema-domain / deterministic-
      handler / read-only-API / CAIP-2 violations
- [x] 5.2 `.claude/agents/chain-reviewer.md`: verifies chain constants in diffs against
      docs/research/*.md; flags unverified constants
- [x] 5.3 CLAUDE.md "Quality gates" section: local green bar (lint, typecheck, unit
      tests), three CI lanes, review passes invoke both agents

## 6. Verification

- [x] 6.1 `pnpm lint`, `pnpm typecheck` (after ponder codegen), `pnpm test`,
      `pnpm format:check` all green locally
- [x] 6.2 `pnpm test:integration` green against the live local DB; decode fixtures
      verified against chain values
- [x] 6.3 pnpm-workspace.yaml allowBuilds entries explicit true/false (no placeholder
      lines); `openspec validate add-quality-gates` passes
