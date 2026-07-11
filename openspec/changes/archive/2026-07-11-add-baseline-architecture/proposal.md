# Proposal: add-baseline-architecture

## Why

Every subsequent change (x402 indexer, ERC-8004 indexer, profiles, feed) needs an agreed
foundation: how we index Base, where data lives, how the pieces talk. This was decided via a
3-proposal / 2-judge architecture panel (2026-07-11); both judges independently selected the
Ponder-first stack, with grafts from the losing proposals. This change records those decisions
as requirements and scaffolds the skeleton so implementation changes build on rails.

## What Changes

- Adopt the Ponder-first stack: self-hosted Ponder (v0.16.x) + Postgres 16 as the single
  source of chain facts on Base; a separate Node enrichment worker for all off-chain work;
  a standalone backend API service (NestJS + drizzle over SQL views) separate from the
  indexer; Next.js on Cloudflare as the frontend, talking only to the API.
- Adopt the superset-indexing principle: index ALL USDC `AuthorizationUsed` events;
  x402 classification is a SQL join against a synced facilitator table, never an
  index-time filter (facilitator wallet rotation retro-labels history with a view refresh).
- Adopt the two-schema-domain rule: Ponder-managed schemas hold immutable chain facts;
  an `enrichment` schema owned by the worker holds everything fetched/derived off-chain.
- Adopt chain-agnostic keys (CAIP-2 chain id on every row) so BSC/Polygon are config-only
  and a future Solana writer is additive.
- One-time historical backfill accelerated via a sender/topic-filtered HyperSync (or SQD
  Portal) extraction seeding a read-only `payments_archive`, so Ponder starts near head.
- Scaffold: pnpm monorepo (`apps/indexer`, `apps/worker`, `apps/web`, `packages/shared`),
  Docker Compose for Postgres, CI (typecheck + lint), `.env.example`.

## Capabilities

### New Capabilities
- `architecture`: baseline system architecture — component boundaries, indexing principles,
  data-model rules, correctness monitors, and cost/hosting constraints that all later
  capabilities must respect.

### Modified Capabilities
<!-- none — this is the first change -->

## Impact

- Creates the monorepo skeleton (no product features yet).
- Adds dependencies: ponder, viem, drizzle (via ponder), Next.js, pnpm workspaces.
- Hosting decision: one EU root server (Netcup RS-class or Hetzner CX43-class, ~€17–22/mo)
  running Postgres + Ponder + worker via Docker Compose; Cloudflare for the frontend
  (free tier permits commercial use). Marble (Ponder cloud) is NOT an option — sunset
  2026-04-08; self-hosting is permanent.
- Recurring vendor surface deliberately minimal: commodity JSON-RPC only (Chainstack
  $49/20M req or dRPC $0.30/M CU; Alchemy free 30M CU/mo possible for live-only after
  accelerated backfill). Target all-in under $100/mo at launch, ~$30–80/mo realistic.
