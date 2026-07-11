# Machine Observatory

The identity and narrative layer over the on-chain AI agent economy (x402 + ERC-8004).
Existing explorers (x402scan, 8004scan, agenteconomy.to) answer "how much"; we answer
"who, what, and why is this interesting" — agent profiles, a narrated event feed,
leaderboards, and a weekly digest.

## Iron rule: spec first

No implementation without an approved OpenSpec change. Every capability starts as
`/opsx:propose`, gets human approval on `proposal.md` + spec deltas, and only then
moves to implementation against `tasks.md`. After deploy, `openspec archive` folds
deltas into `openspec/specs/` — read those specs for context before any work.

## Domain glossary

- **x402** — HTTP-402 payment protocol (Linux Foundation). Agents pay per-request in
  USDC, settled on Base via facilitator contracts (Coinbase CDP, Cloudflare, AWS).
- **ERC-8004** — trustless agent standard: Identity, Reputation, and Validation
  registries. Live on mainnet/Base since Jan 2026.
- **Bazaar** — Coinbase CDP discovery API auto-cataloging x402 services (metadata,
  schemas, pricing). Services with no settlements for 30 days are evicted.
- **Agent profile** — our core object: ERC-8004 identity joined with x402 payment
  behavior and reputation into one canonical page.
- **Real commerce filter** — classifier separating genuine service payments from
  speculation/wash loops (e.g., the PING pay-to-mint frenzy). Our numbers must be
  believable where competitors count spam.

## Conventions

- TypeScript throughout; stack specifics live in `openspec/specs/` once the
  architecture change is approved — do not assume a framework before reading them.
- Verification bar is "agrees with reality", not "tests pass": indexer changes are
  validated against live Base data and cross-checked against public x402scan numbers.
- Never commit RPC URLs or API keys; use `.env` (gitignored).
