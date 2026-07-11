# Design: baseline architecture

## Context

Machine Observatory joins ERC-8004 agent identity with x402 payment behavior on Base and
narrates it. Ground truth (docs/research/): x402 settlements are facilitator-submitted USDC
`transferWithAuthorization` calls; attribution needs `tx.from`, which `eth_getLogs` cannot
filter; live volume ~600k events/day; ~150 facilitator wallets rotating in batches; ERC-8004
registries at identical CREATE2 addresses on every chain; full history since ~2024-12 required
for credible all-time boards.

Decided via architecture panel (3 champion proposals — Ponder / custom viem / provider-backed —
scored by 2 independent judges, 2026-07-11). Both judges picked Ponder-first (38, 39 pts);
panel transcript facts verified against July-2026 docs and pricing.

## Goals / Non-Goals

**Goals:**
- One self-owned Postgres holding chain facts + enrichment, optimized for joins (the product
  is 80% joins: identity × payments × reputation × Bazaar metadata).
- Solo-dev operability for years: framework owns reorgs, crash recovery, caching, replay.
- Retroactive classification: facilitator/wallet knowledge changes must never force re-indexing.
- Cheap iteration: schema/handler changes replay from local cache, not from RPC.

**Non-Goals:**
- Solana/BSC/Polygon indexing (schema is ready; writers come later — SQD Portal earmarked
  for Solana).
- Permit2/ERC-7710 settlement coverage at launch (measured first, added as a follow-up change).
- Real-time (<1 block) latency; minutes-fresh is fine for an observatory.

## Decisions

1. **Ponder (self-hosted, v0.16.x) over custom viem worker and provider-backed extraction.**
   Log events expose `event.transaction.from` by default (block-body fetches, receipts stay
   off) — the domain's hardest problem solved inside a maintained framework. `ponder_sync`
   caches all RPC responses in Postgres, so every re-index replays locally — the best
   iteration property of any option. Custom viem (judge total 36.5/37) buys $35/mo but hands
   us reorgs/gaps/cursors forever, and its claimed 13x cost edge over Ponder was factually
   wrong. Provider-backed SQD (34.5/38) is fastest to MVP but its $40/mo assumes a free
   Portal tier that SQD documents as dev-only, pre-priced escalation ~$140/mo. Marble
   (Ponder cloud) was sunset 2026-04-08 — self-hosting is permanent, accepted.

2. **Superset indexing + join classification.** Index every USDC `AuthorizationUsed` event
   regardless of sender. `is_x402` is a join against `enrichment.facilitator_wallets`
   (synced daily from the x402scan `facilitators` npm package). Wallet-batch rotations
   retro-label history via view refresh. Corollary (graft from custom-viem proposal):
   unknown `tx.from` senders emitting AuthorizationUsed are surfaced in a
   facilitator-candidate queue — early warning ahead of the npm package.

3. **Buyer/seller/amount decoding: calldata-first, receipts as fallback.** Decode
   `event.transaction.input` against selectors `0xe3ee160e`/`0xcf092995`; rows that don't
   decode (multicall, batching, smart wallets) are flagged `needs_receipt` and completed by
   the worker via `eth_getTransactionReceipt`. Keeps `includeTransactionReceipts` off the
   hot path.

4. **Two schema domains.** Ponder-managed per-deployment schemas = immutable chain facts,
   published through a stable views schema (zero-downtime redeploys). `enrichment` schema
   (worker-owned) = facilitator_wallets, registration_files, feedback_files,
   bazaar_resources, notable_events, digest_issues. Product reads are views joining both;
   leaderboards are materialized views on cron. Chain facts are append-only; every
   interpretation (is_x402, agent linkage, resource attribution, commerce_class) is derived —
   changeable without touching the indexer.

5. **Settlement confidence column** (graft from provider-backed proposal): `confirmed`
   (AuthorizationUsed corroboration) vs `probable` (sender-filtered Transfer only) — absorbs
   the Permit2/v2 gap cleanly when we add it.

6. **Chain-agnostic keys.** Every row keyed with CAIP-2 chain id; agents keyed
   (chain_id, registry_address, agent_id) per ERC-8004 guidance. EVM chains become
   config-only; Solana lands as an additive writer into the same tables.

7. **Backfill via one-shot HyperSync/SQD extraction** (graft from both judges): a
   sender/topic-filtered historical pull seeds read-only `payments_archive` in hours,
   Ponder starts near head; API views UNION archive + live. Removes the 3–5-day raw-RPC
   backfill risk and may allow Alchemy free tier (30M CU/mo) for live-only. No recurring
   provider dependency.

8. **Deterministic handlers only.** Nothing non-deterministic (HTTP fetches, LLM calls)
   inside Ponder handlers — required for sound cache replay. All off-chain work (agentURI /
   feedbackURI JSON with hash verification and ipfs multi-gateway fallback, Bazaar hourly
   pagination with 429 backoff, facilitator npm sync, receipt completion, digest composition)
   lives in the worker (node-cron, same Docker Compose).

9. **Correctness monitors as first-class** (graft): daily reconciliation of our settlement
   counts vs x402scan public totals with alert at >1% divergence; nightly gap sweep; UUPS
   `Upgraded` events on ERC-8004 registries alert (ABI may change); Validation registry
   gated off on Base until its proxy leaves the placeholder impl.

10. **API & frontend.** Ponder's built-in Hono server serves REST (drizzle over stable
    views): /agents/:id, /feed, /leaderboards, /digest. `ponder serve` replicas scale reads
    if needed. Frontend: Next.js on Cloudflare (free tier permits commercial use; Vercel
    Hobby does not).

11. **Hosting.** One EU root server (Netcup RS 2000-class or Hetzner CX43, ~€17–22/mo,
    NVMe ≥512GB preferred for ponder_sync growth) running Postgres 16 + Ponder + worker via
    Docker Compose; Postgres colocated (Ponder wants <50ms roundtrip). Budget: ~$30–80/mo.

## Risks / Trade-offs

- [Ponder block-body fetch cost scales with blocks-containing-events, which on Base is ~every
  block] → live-only load is bounded (~43k blocks/day); measured before committing to a paid
  RPC tier; dRPC/Chainstack/Alchemy all verified viable and swappable.
- [AuthorizationUsed misses Permit2/v2-proxy settlements] → sender-filtered Transfer heuristic
  + confidence column; a sampling job quantifies v2 share (bounded account-source scan from
  proxy deploy block) before we invest in full coverage.
- [Facilitator wallet doing unrelated USDC transfers → false positive] → same accepted risk
  as x402scan; commerce_class column allows later reclassification.
- [x402scan stops maintaining the facilitators package] → candidate queue (Decision 2) makes
  us self-sufficient at degraded latency; package is MIT, we can fork.
- [Single-server SPOF] → nightly pg_dump offsite; ponder_sync + archive seed make full
  rebuild hours-scale; acceptable for a side project pre-revenue.
- [ponder_sync cache growth (can exceed 100GB)] → prune policy once handlers stabilize;
  512GB NVMe headroom.

## Migration Plan

Greenfield. Deploy order: Postgres → backfill seed (archive) → Ponder from recent block →
worker → API views → web. Rollback = redeploy previous Ponder deployment schema (views flip).

## Open Questions

- Exact HyperSync vs SQD Portal choice for the one-shot backfill (pricing is quote-based;
  decide in change 1 with a bounded test extraction).
- Netcup vs Hetzner final pick (immaterial cost delta; decide at first deploy).
- Whether Bazaar `resource` URLs should be fetched/health-checked at launch or post-MVP.
