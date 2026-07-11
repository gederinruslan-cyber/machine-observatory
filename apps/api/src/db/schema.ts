import { integer, numeric, pgTable, text } from "drizzle-orm/pg-core";

// Read-only mapping of the Ponder-written settlements table (chain facts).
// Column shapes verified against the live DB: Ponder stores t.bigint() as
// numeric(78,0). In local dev this lives in `public`; once task 3.3 lands it
// is read through the stable views schema instead.
export const settlements = pgTable("settlements", {
  /** `${chainId}:${txHash}:${logIndex}` */
  id: text("id").primaryKey(),
  /** CAIP-2, e.g. eip155:8453 */
  chainId: text("chain_id").notNull(),
  txHash: text("tx_hash").notNull(),
  logIndex: integer("log_index").notNull(),
  blockNumber: numeric("block_number", { mode: "bigint" }).notNull(),
  blockTimestamp: numeric("block_timestamp", { mode: "bigint" }).notNull(),
  /** Transaction sender — facilitator attribution key (superset indexing). */
  txFrom: text("tx_from").notNull(),
  authorizer: text("authorizer").notNull(),
  nonce: text("nonce").notNull(),
  buyer: text("buyer"),
  seller: text("seller"),
  /** USDC atomic units (6 decimals). */
  amount: numeric("amount", { mode: "bigint" }),
  /** 'calldata' | 'needs_receipt' | 'receipt' */
  decodeSource: text("decode_source").notNull(),
  /** 'confirmed' | 'probable' */
  confidence: text("confidence").notNull(),
});
