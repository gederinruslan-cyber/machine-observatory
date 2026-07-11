-- CI-only settlements fixture (quality spec: "Three-lane CI on every pull request").
--
-- Mirrors the Ponder-created `settlements` table (source of truth:
-- apps/indexer/ponder.schema.ts; column names/types verified against the live
-- local DB via `psql ... -c '\d settlements'` on 2026-07-12: Ponder stores
-- t.hex() as text, t.bigint() as numeric(78,0)). If ponder.schema.ts changes,
-- re-derive this file the same way — the integration lane failing on a column
-- mismatch is the drift signal.
--
-- Applied by .github/workflows/ci.yml after docker/postgres-init/*.sql.

CREATE TABLE IF NOT EXISTS public.settlements (
  id              text PRIMARY KEY,
  chain_id        text NOT NULL,
  tx_hash         text NOT NULL,
  log_index       integer NOT NULL,
  block_number    numeric(78,0) NOT NULL,
  block_timestamp numeric(78,0) NOT NULL,
  tx_from         text NOT NULL,
  authorizer      text NOT NULL,
  nonce           text NOT NULL,
  buyer           text,
  seller          text,
  amount          numeric(78,0),
  decode_source   text NOT NULL,
  confidence      text NOT NULL
);

-- Rows copied from the live local DB (indexed from Base mainnet), plus one
-- needs_receipt row so decodedPct is a real fraction.
INSERT INTO public.settlements
  (id, chain_id, tx_hash, log_index, block_number, block_timestamp,
   tx_from, authorizer, nonce, buyer, seller, amount, decode_source, confidence)
VALUES
  ('eip155:8453:0x0dc3d73feca4fa4c5538c7676a17b1ea7f8520a80f5ce491778cc212651a98c0:5',
   'eip155:8453',
   '0x0dc3d73feca4fa4c5538c7676a17b1ea7f8520a80f5ce491778cc212651a98c0',
   5, 48506300, 1783801947,
   '0x772003a2e9c2ccc8af956870a37a66f64f8cec38',
   '0x2b4ee3387008e5ff1a9996fc8b48d2fd61389037',
   '0xd5d8e43b69d79d71004fad259d44d22e81fe2d072d5c048b75264c93e3c1e2f9',
   '0x2b4ee3387008e5ff1a9996fc8b48d2fd61389037',
   '0xe9030014f5dae217d0a152f02a043567b16c1abf',
   12493, 'calldata', 'confirmed'),
  ('eip155:8453:0xfacb6e7a75564d345762b1801d1df6c9646c9fe971341e9047ad700db663fa3b:3',
   'eip155:8453',
   '0xfacb6e7a75564d345762b1801d1df6c9646c9fe971341e9047ad700db663fa3b',
   3, 48506300, 1783801947,
   '0x625d8a65134079f8faaac39a7947c73d93c6ac39',
   '0x2b4ee3387008e5ff1a9996fc8b48d2fd61389037',
   '0x48f68e247ea37c08d309aa00b9153c5a22d2da048b50f3b7ca5faaa8fd0df464',
   '0x2b4ee3387008e5ff1a9996fc8b48d2fd61389037',
   '0xe9030014f5dae217d0a152f02a043567b16c1abf',
   16722, 'calldata', 'confirmed'),
  ('eip155:8453:0xc335db9ab1048c389f2f6f5b121a33c0b0e673e1ffffd640a7b7b47b3cdcb01c:202',
   'eip155:8453',
   '0xc335db9ab1048c389f2f6f5b121a33c0b0e673e1ffffd640a7b7b47b3cdcb01c',
   202, 48506302, 1783801951,
   '0x59e8887b40fcff4a55b835dea32095aaf750d823',
   '0xa16c3e52232c2373a305c90784e796fe830d42c7',
   '0x06c8e2b875cb36282f40803310bc41ac546a0cebb5993db73fed435ada052467',
   NULL, NULL, NULL, 'needs_receipt', 'confirmed')
ON CONFLICT (id) DO NOTHING;
