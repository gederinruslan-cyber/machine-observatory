// Chain-level ground truth. Sources and verification: docs/research/*.md (2026-07-11).

/** CAIP-2 chain identifiers (architecture spec: "Chain-agnostic data model"). */
export const CHAIN_IDS = {
  base: "eip155:8453",
  ethereum: "eip155:1",
  bsc: "eip155:56",
  polygon: "eip155:137",
} as const;

/** Native Circle USDC on Base, 6 decimals. */
export const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;

export const USDC_DECIMALS = 6;

/** Event topics on USDC (keccak-256, cross-checked against x402scan constants). */
export const TOPICS = {
  transfer:
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
  authorizationUsed:
    "0x98de503528ee59b575ef0c0a2576a82497bfc029a5685b209e9ec333479b10a5",
  authorizationCanceled:
    "0x1cdd46ff242716cdaa72d159d339a485b3438398348d68f09d7c8c0a59353d81",
} as const;

/** transferWithAuthorization function selectors (EIP-3009 settlement calldata). */
export const SELECTORS = {
  /** (…, uint8 v, bytes32 r, bytes32 s) — x402 SDK default */
  transferWithAuthorizationVRS: "0xe3ee160e",
  /** (…, bytes signature) — FiatTokenV2_2, smart-wallet / EIP-1271 */
  transferWithAuthorizationBytes: "0xcf092995",
} as const;

/** x402 Permit2 settlement proxy (v2 spec; same CREATE2 address on every chain). */
export const X402_EXACT_PERMIT2_PROXY =
  "0x402085c248EeA27D92E8b30b2C58ed07f9E20001" as const;

/** ERC-8004 registries — identical CREATE2 addresses on every mainnet. */
export const ERC8004_MAINNET = {
  identityRegistry: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
  reputationRegistry: "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63",
  /** UNSTABLE: placeholder impl on Base/BSC as of 2026-07-11 — gate per chain. */
  validationRegistry: "0x8004Cb1BF31DAf7788923b405b754f57acEB4272",
} as const;

/** Coinbase CDP Bazaar discovery API (public, no key). */
export const BAZAAR_API = {
  resources:
    "https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources",
  search: "https://api.cdp.coinbase.com/platform/v2/x402/discovery/search",
  merchant: "https://api.cdp.coinbase.com/platform/v2/x402/discovery/merchant",
} as const;
