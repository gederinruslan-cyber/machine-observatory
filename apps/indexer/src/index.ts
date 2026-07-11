import { ponder } from "ponder:registry";
import { settlements } from "ponder:schema";

import { decodeSettlementCalldata } from "./decode";

const CHAIN_ID = "eip155:8453";

ponder.on("Usdc:AuthorizationUsed", async ({ event, context }) => {
  const { transaction } = event;

  // Calldata-first decoding (design decision 3): direct transferWithAuthorization
  // calls decode in-process; batched/multicall settlements fall back to the
  // enrichment worker's receipt-completion job. Pure logic lives in decode.ts
  // so it is unit-testable against real Base calldata fixtures.
  const { buyer, seller, amount, decodeSource } = decodeSettlementCalldata(
    transaction.to,
    transaction.input,
  );

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
