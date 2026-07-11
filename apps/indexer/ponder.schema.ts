import { onchainTable } from "ponder";

// Chain facts only (architecture spec: "Two schema domains"). Interpretations
// (is_x402, agent linkage, commerce_class) are joins/views — never columns here.
export const settlements = onchainTable("settlements", (t) => ({
  /** `${chainId}:${txHash}:${logIndex}` */
  id: t.text().primaryKey(),
  /** CAIP-2, e.g. eip155:8453 */
  chainId: t.text().notNull(),
  txHash: t.hex().notNull(),
  logIndex: t.integer().notNull(),
  blockNumber: t.bigint().notNull(),
  blockTimestamp: t.bigint().notNull(),
  /** Transaction sender — facilitator attribution key (superset indexing). */
  txFrom: t.hex().notNull(),
  /** EIP-3009 authorizer (== buyer for direct settlements). */
  authorizer: t.hex().notNull(),
  nonce: t.hex().notNull(),
  /** Decoded from calldata when possible; completed via receipt otherwise. */
  buyer: t.hex(),
  seller: t.hex(),
  /** USDC atomic units (6 decimals). */
  amount: t.bigint(),
  /** 'calldata' | 'needs_receipt' | 'receipt' */
  decodeSource: t.text().notNull(),
  /** 'confirmed' (EIP-3009 corroborated) | 'probable' */
  confidence: t.text().notNull(),
}));
