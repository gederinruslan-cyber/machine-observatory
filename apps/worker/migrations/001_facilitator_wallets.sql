-- Known facilitator wallets, synced daily from the x402scan `facilitators` npm
-- package (design decision 2: superset indexing + join classification).
-- Worker-owned; applied idempotently on every startup — IF NOT EXISTS only.
CREATE TABLE IF NOT EXISTS enrichment.facilitator_wallets (
  address          text PRIMARY KEY, -- lowercased for EVM chains; verbatim for Solana (base58 is case-sensitive)
  facilitator_id   text NOT NULL,
  facilitator_name text NOT NULL,
  chain_id         text NOT NULL, -- CAIP-2, e.g. 'eip155:8453' for Base
  first_tx_date    date,
  synced_at        timestamptz NOT NULL
);
