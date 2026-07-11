import { ponder } from "ponder:registry";
import { settlements } from "ponder:schema";
import { decodeFunctionData } from "viem";

import { UsdcAbi } from "../abis/Usdc";

const CHAIN_ID = "eip155:8453";
const USDC = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const SELECTORS = new Set(["0xe3ee160e", "0xcf092995"]);

ponder.on("Usdc:AuthorizationUsed", async ({ event, context }) => {
  const { transaction } = event;

  // Calldata-first decoding (design decision 3): direct transferWithAuthorization
  // calls decode in-process; batched/multicall settlements fall back to the
  // enrichment worker's receipt-completion job.
  let buyer: `0x${string}` | null = null;
  let seller: `0x${string}` | null = null;
  let amount: bigint | null = null;
  let decodeSource = "needs_receipt";

  const selector = transaction.input.slice(0, 10);
  if (transaction.to?.toLowerCase() === USDC && SELECTORS.has(selector)) {
    try {
      const { args } = decodeFunctionData({
        abi: UsdcAbi,
        data: transaction.input,
      });
      buyer = args[0];
      seller = args[1];
      amount = args[2];
      decodeSource = "calldata";
    } catch {
      // Non-standard encoding — leave for receipt completion.
    }
  }

  await context.db.insert(settlements).values({
    id: `${CHAIN_ID}:${event.transaction.hash}:${event.log.logIndex}`,
    chainId: CHAIN_ID,
    txHash: event.transaction.hash,
    logIndex: event.log.logIndex,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    txFrom: transaction.from,
    authorizer: event.args.authorizer,
    nonce: event.args.nonce,
    buyer,
    seller,
    amount,
    decodeSource,
    confidence: "confirmed", // AuthorizationUsed IS the EIP-3009 corroboration
  });
});
