# Tasks: add-baseline-architecture

## 1. Monorepo skeleton
- [ ] 1.1 pnpm workspace: `apps/indexer`, `apps/worker`, `apps/web`, `packages/shared`
- [ ] 1.2 Shared TS config, ESLint, prettier; `packages/shared` exports chain constants
      (USDC address, event topics, registry addresses, CAIP-2 ids) sourced from
      docs/research values
- [ ] 1.3 `.env.example` (RPC URLs, DATABASE_URL) and README architecture section

## 2. Local infrastructure
- [ ] 2.1 Docker Compose: Postgres 16 with `enrichment` schema init script
- [ ] 2.2 Makefile/package scripts: `dev`, `db:up`, `typecheck`, `lint`

## 3. Indexer skeleton (apps/indexer)
- [ ] 3.1 `ponder create` app pinned to v0.16.x, Base chain config, startBlock near head
- [ ] 3.2 Minimal proof handler: USDC `AuthorizationUsed` source recording
      (chain_id, tx_hash, tx_from, authorizer, block) — validates event.transaction.from
      and end-to-end write path; runs for 15 min against live Base and row counts match a
      basescan spot check
- [ ] 3.3 Stable views schema + `--views-schema` wiring verified by two consecutive deploys

## 4. Worker skeleton (apps/worker)
- [ ] 4.1 node-cron scaffold with one real job: daily facilitator sync from the
      `facilitators` npm package into `enrichment.facilitator_wallets`
- [ ] 4.2 Facilitator-candidate queue query + log-based alert stub

## 5. Web skeleton (apps/web)
- [ ] 5.1 Next.js app deployable to Cloudflare, one page rendering live settlement count
      from the API (proves the full pipe)

## 6. CI
- [ ] 6.1 GitHub Actions: typecheck + lint + indexer schema build on PR

## 7. Verification
- [ ] 7.1 Reality check: 15-min live run, settlements decoded (buyer/seller/amount) for
      ≥95% of rows via calldata path; `needs_receipt` fallback exercised on at least one
      batched tx
- [ ] 7.2 `openspec validate add-baseline-architecture` passes; archive after deploy
