# Machine Observatory

The identity and narrative layer over the on-chain AI agent economy (x402 + ERC-8004):
agent profiles, a narrated event feed, leaderboards, and a weekly digest.

## Architecture

```
Base chain ──> apps/indexer (Ponder) ──> Postgres 16 <── apps/worker (enrichment)
(settlements,      chain facts              │              facilitator lists, agent
 ERC-8004)                                  │              JSON, Bazaar, digests
                                            ▼
                              SQL views (chain facts × enrichment)
                                            │
                                   apps/api (NestJS)
                                            │
                                   apps/web (Next.js, Cloudflare)
```

Principles (full spec in `openspec/`): superset indexing with join-time x402
classification; deterministic indexer handlers; two schema domains (chain facts vs
enrichment); chain-agnostic CAIP-2 keys; API decoupled from the indexer.

Ground-truth chain research lives in `docs/research/`. Workflow is spec-first via
[OpenSpec](https://github.com/Fission-AI/OpenSpec) — see `CLAUDE.md`.

## Development

```bash
pnpm install
pnpm db:up                       # Postgres 16 on localhost:5439 (docker)
cp .env.example apps/indexer/.env.local
pnpm --filter @observatory/indexer dev   # live-index Base from a recent block
```

Indexer health: `curl localhost:42069/health`. Product API and web app: see
`apps/api`, `apps/web` (skeletons — being built per `openspec/changes/`).
