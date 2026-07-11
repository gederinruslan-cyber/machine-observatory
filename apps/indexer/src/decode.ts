// Pure calldata decoding (quality spec: "Calldata decoding is a pure,
// fixture-tested unit"). No `ponder:*` imports here — this module must load
// under vitest without Ponder's virtual modules.
import { decodeFunctionData } from "viem";

import { UsdcAbi } from "../abis/Usdc";

/** Native Circle USDC on Base, lowercased for comparison against tx.to. */
export const USDC_BASE_LOWER = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";

/** transferWithAuthorization selectors: (…v,r,s) and (…bytes signature). */
const SELECTORS = new Set(["0xe3ee160e", "0xcf092995"]);

export interface DecodedSettlement {
  buyer: `0x${string}` | null;
  seller: `0x${string}` | null;
  amount: bigint | null;
  decodeSource: "calldata" | "needs_receipt";
}

const NEEDS_RECEIPT: DecodedSettlement = {
  buyer: null,
  seller: null,
  amount: null,
  decodeSource: "needs_receipt",
};

/**
 * Calldata-first decoding (architecture design decision 3): direct
 * transferWithAuthorization calls to USDC decode in-process; anything else
 * (multicall, batching, proxied settlements) returns `needs_receipt` and is
 * completed asynchronously by the enrichment worker via the tx receipt.
 *
 * Note: viem tolerates trailing bytes after the ABI-encoded args — CDP
 * facilitators append a CBOR marker (e.g. {"w":"cdp_facil1"}) to their
 * calldata, and those transactions still decode on the happy path.
 */
export function decodeSettlementCalldata(
  to: `0x${string}` | null | undefined,
  input: `0x${string}`,
): DecodedSettlement {
  const selector = input.slice(0, 10);
  if (to?.toLowerCase() !== USDC_BASE_LOWER || !SELECTORS.has(selector)) {
    return NEEDS_RECEIPT;
  }
  try {
    const { args } = decodeFunctionData({ abi: UsdcAbi, data: input });
    return {
      buyer: args[0],
      seller: args[1],
      amount: args[2],
      decodeSource: "calldata",
    };
  } catch {
    // Non-standard encoding — leave for receipt completion.
    return NEEDS_RECEIPT;
  }
}
