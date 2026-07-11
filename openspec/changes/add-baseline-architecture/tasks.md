# Tasks: add-baseline-architecture

## 1. Monorepo skeleton
- [x] 1.1 pnpm workspace: `apps/indexer`, `apps/worker`, `apps/api`, `apps/web`,
      `packages/shared`
- [x] 1.2 Shared TS config, ESLint, prettier; `packages/shared` exports chain constants
      (USDC address, event topics, registry addresses, CAIP-2 ids) sourced from
      docs/research values
- [x] 1.3 `.env.example` (RPC URLs, DATABASE_URL) and README architecture section

## 2. Local infrastructure
- [x] 2.1 Docker Compose: Postgres 16 with `enrichment` schema init script
- [x] 2.2 Makefile/package scripts: `dev`, `db:up`, `typecheck`, `lint`

## 3. Indexer skeleton (apps/indexer)
- [x] 3.1 `ponder create` app pinned to v0.16.x, Base chain config, startBlock near head
- [x] 3.2 Minimal proof handler: USDC `AuthorizationUsed` source recording
      (chain_id, tx_hash, tx_from, authorizer, block) — validates event.transaction.from
      and end-to-end write path; runs for 15 min against live Base and row counts match a
      basescan spot check
- [ ] 3.3 Stable views schema + `--views-schema` wiring verified by two consecutive deploys

## 4. Worker skeleton (apps/worker)
- [x] 4.1 node-cron scaffold with one real job: daily facilitator sync from the
      `facilitators` npm package into `enrichment.facilitator_wallets`
- [x] 4.2 Facilitator-candidate queue query + log-based alert stub

## 5. API skeleton (apps/api)
- [x] 5.1 Standalone NestJS service + drizzle over the stable views schema; endpoints:
      `/health`, `/stats` (live settlement count) — proves cross-schema reads; OpenAPI
      (Swagger module) enabled from day one
- [x] 5.2 Dockerfile + Compose entry; API stays up while indexer container restarts

## 6. Web skeleton (apps/web)
- [x] 6.1 Next.js app deployable to Cloudflare, one page rendering live settlement count
      from apps/api (proves the full pipe)

## 7. CI
- [ ] 7.1 GitHub Actions: typecheck + lint + indexer schema build on PR

## 8. Verification
- [x] 8.1 Reality check: 15-min live run, settlements decoded (buyer/seller/amount) for
      ≥95% of rows via calldata path; `needs_receipt` fallback exercised on at least one
      batched tx
- [ ] 8.2 `openspec validate add-baseline-architecture` passes; archive after deploy
