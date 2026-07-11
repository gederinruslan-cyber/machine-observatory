import { createConfig } from "ponder";

import { UsdcAbi } from "./abis/Usdc";

const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

export default createConfig({
  chains: {
    base: {
      id: 8453,
      rpc: process.env.PONDER_RPC_URL_8453!,
    },
  },
  contracts: {
    Usdc: {
      chain: "base",
      abi: UsdcAbi,
      address: USDC_BASE,
      // Recent block for the skeleton proof run; full history arrives via the
      // payments_archive backfill seed (architecture spec: "Historical backfill").
      startBlock: 48506300,
      filter: { event: "AuthorizationUsed", args: {} },
    },
  },
});
