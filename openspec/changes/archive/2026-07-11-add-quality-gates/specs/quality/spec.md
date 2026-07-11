# Spec delta: quality (add-quality-gates)

## ADDED Requirements

### Requirement: Repository-wide linting and formatting
The repository SHALL enforce ESLint 9 (flat config, typescript-eslint) via a single root
configuration shared by all packages, with a functional `lint` script in every workspace
package (no placeholder/echo stubs), and SHALL enforce prettier formatting via a root
`format:check` script. The ruleset SHALL be pragmatic — recommended rules plus a small
set of high-value correctness rules — with no stylistic rules that overlap prettier.

#### Scenario: Lint runs in every package
- **WHEN** `pnpm lint` is executed at the repository root
- **THEN** ESLint runs with the shared flat config over every workspace package and
  fails on any error-level violation

#### Scenario: Formatting drift detected
- **WHEN** a committed file diverges from prettier formatting and `pnpm format:check` runs
- **THEN** the command exits non-zero naming the offending file

### Requirement: Calldata decoding is a pure, fixture-tested unit
The indexer's settlement calldata decoding SHALL live in a pure module
(`apps/indexer/src/decode.ts`) with no Ponder imports, consumed by the event handler, and
SHALL be covered by vitest tests using real Base `transferWithAuthorization` calldata
fixtures fetched from the chain via RPC, each fixture annotated with its transaction hash
and asserting the exact expected buyer, seller, and amount. Tests SHALL cover the
`0xe3ee160e` selector happy path and the fallback where undecodable calldata yields
`needs_receipt` with null buyer/seller/amount.

#### Scenario: Real settlement calldata decodes
- **WHEN** the decode function receives the calldata of a real Base
  transferWithAuthorization transaction addressed to USDC
- **THEN** it returns the buyer, seller, and amount matching the on-chain values, with
  decode source `calldata`

#### Scenario: Garbage calldata falls back
- **WHEN** the decode function receives calldata that is not a known
  transferWithAuthorization encoding (or is not addressed to USDC)
- **THEN** it returns null buyer/seller/amount with decode source `needs_receipt` and
  does not throw

### Requirement: Worker and shared-constants unit tests
The worker's facilitator sync SHALL have unit tests exercising its data mapping and
upsert SQL against a stubbed pg client (no live database, no network), asserting CAIP-2
chain-id mapping, EVM address lowercasing, and the upsert target/parameters.
`packages/shared` SHALL have sanity tests asserting that exported addresses are valid
EIP-55 checksummed addresses and that event topics are 32-byte hex strings.

#### Scenario: Facilitator mapping tested without a database
- **WHEN** the worker unit tests run with a stub pg client
- **THEN** they verify rows are upserted into `enrichment.facilitator_wallets` with
  lowercased EVM addresses and CAIP-2 chain ids, without opening any real connection

#### Scenario: Shared constant regresses
- **WHEN** a chain constant is edited to an invalid form (bad checksum, wrong-length topic)
- **THEN** the shared sanity tests fail

### Requirement: API endpoint tests with a mocked and a real database lane
The API SHALL have supertest-based e2e tests for `/health` and `/stats` where the
database is mocked at the drizzle DI provider boundary, runnable with no database
available. A separate `test:integration` script SHALL run the same suite against a real
`DATABASE_URL`, and SHALL skip gracefully (not fail) when no `DATABASE_URL` is present.

#### Scenario: Unit lane needs no database
- **WHEN** the API test suite runs in the CI unit lane with no reachable Postgres
- **THEN** `/health` and `/stats` tests pass using the mocked drizzle provider

#### Scenario: Integration lane uses a real database
- **WHEN** `test:integration` runs with `DATABASE_URL` pointing at a Postgres containing
  a `settlements` table
- **THEN** the same endpoints are exercised against the real database and responses
  satisfy the response contract

#### Scenario: Integration lane without a database
- **WHEN** `test:integration` runs with no `DATABASE_URL` set
- **THEN** the integration tests are skipped and the command exits zero

### Requirement: Three-lane CI on every pull request
CI (`.github/workflows/ci.yml`) SHALL run three jobs on every pull request, all required:
(a) lint + format check + typecheck + unit tests, with ponder codegen run before
typechecking; (b) builds — the web app including the OpenNext Cloudflare bundle, and the
API Nest build; (c) integration — a Postgres 16 service container initialized with the
`docker/postgres-init` SQL plus a `scripts/ci/seed.sql` settlements fixture mirroring the
Ponder-created column names and types, then `test:integration`.

#### Scenario: Pull request gating
- **WHEN** a pull request is opened
- **THEN** the lint/typecheck/unit job, the build job, and the integration job all run
  and each must pass

#### Scenario: Integration job schema fidelity
- **WHEN** the integration job seeds its database
- **THEN** the fixture `settlements` table has the same column names and types as the
  live Ponder-created table (text ids/hex, integer log_index, numeric(78,0) bigints)

### Requirement: Spec and chain review agents
The repository SHALL provide two Claude Code agent definitions in `.claude/agents/`:
`spec-reviewer`, which reviews a diff against `openspec/specs/` and active change deltas
and flags violations of the architecture requirements (superset indexing, two schema
domains, deterministic handlers, API read-only, CAIP-2 keys); and `chain-reviewer`, which
verifies chain constants (addresses, topics, selectors) appearing in a diff against
`docs/research/*.md` and flags any constant not traceable to a verified source. Code
review passes SHALL invoke both agents on the diff.

#### Scenario: Architecture violation in a diff
- **WHEN** a diff adds an HTTP fetch inside a Ponder handler or a write path to the API
- **THEN** spec-reviewer flags it with the violated requirement named

#### Scenario: Unverified constant in a diff
- **WHEN** a diff introduces a contract address or event topic that does not appear in
  `docs/research/*.md`
- **THEN** chain-reviewer flags it as unverified and requests a source

### Requirement: Documented pre-PR quality bar
CLAUDE.md SHALL document the quality gates: lint, typecheck, and unit tests green locally
before any PR, CI enforcing all three lanes, and the instruction that code-review passes
invoke the spec-reviewer and chain-reviewer agents on the diff.

#### Scenario: Contributor consults CLAUDE.md
- **WHEN** a contributor reads CLAUDE.md before opening a PR
- **THEN** it states the commands that must pass locally and the CI lanes that will gate
  the PR
