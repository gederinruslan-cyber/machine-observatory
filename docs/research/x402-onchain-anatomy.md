# x402 settlement anatomy on Base (ground truth, researched 2026-07-11)

Facts below were read from primary sources: the x402scan source (github.com/Merit-Systems/x402scan),
the x402 spec repo (github.com/coinbase/x402), and CDP docs. Keccak topics computed and
cross-checked against x402scan constants.

## How a settlement appears on-chain

There is NO dedicated x402 settlement contract for the dominant flow. The `exact`/`eip3009`
scheme settles as a facilitator-submitted call to USDC `transferWithAuthorization` (EIP-3009):

- `tx.from` = facilitator EOA (gas payer, cannot alter amount/destination)
- `tx.to` = USDC on Base: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (6 decimals)
- Emits `Transfer(buyer → seller, value)` + `AuthorizationUsed(buyer, nonce)`

v2 adds a Permit2 path via `x402ExactPermit2Proxy` `0x402085c248EeA27D92E8b30b2C58ed07f9E20001`
(same CREATE2 address across chains) and ERC-7710 delegation. Volume split UNVERIFIED.

## Detection strategy (what x402scan does)

Primary filter: USDC `Transfer` logs where **the transaction sender is a known facilitator
address**. Calldata-agnostic — survives batching, multicall, Permit2. Secondary confirmation:
`AuthorizationUsed` in the same receipt proves EIP-3009.

IMPORTANT: standard `eth_getLogs` cannot filter by tx sender — x402scan uses Bitquery
(cutover from CDP SQL API 2026-06-09). An RPC-only indexer must fetch AuthorizationUsed logs
(topic-filterable) then join receipts for `tx.from`, or use a SQL-over-chain provider.

## Signatures / selectors

Events on USDC:
- `Transfer(address,address,uint256)` — topic0 `0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef`
- `AuthorizationUsed(address indexed authorizer, bytes32 indexed nonce)` — topic0 `0x98de503528ee59b575ef0c0a2576a82497bfc029a5685b209e9ec333479b10a5`
- `AuthorizationCanceled(address,bytes32)` — topic0 `0x1cdd46ff242716cdaa72d159d339a485b3438398348d68f09d7c8c0a59353d81`

Selectors (facilitator → USDC calldata):
- `transferWithAuthorization(...v,r,s)` = `0xe3ee160e` (x402 SDK default)
- `transferWithAuthorization(...bytes)` = `0xcf092995` (smart-wallet / EIP-1271 sigs)
- `receiveWithAuthorization` = `0xef55bec6` / `0x88b7ab63` — NOT used by x402 exact/eip3009

## Facilitators on Base (from x402scan `packages/external/facilitators`)

32 facilitators, ~150 wallets. Coinbase CDP alone has 46 wallets on Base, added in batches
(2025-05-05 original `0xdbdf3d8ed80f84c35d01c6c9f9271761bad90ba6`; batches on 2025-10-31,
2025-11-11, 2025-12-16, 2026-06-12/15). **A static facilitator list silently goes stale** —
x402scan maintains it as a versioned npm package with per-address first-tx dates as sync
cursors. Full address list: see x402scan `packages/external/facilitators/src/facilitators/*.ts`.

Cloudflare runs NO settlement wallet — it delegates settle to the Coinbase facilitator, so
Cloudflare-fronted traffic appears under CDP wallets. Other notable: PayAI (15 wallets,
facilitator.payai.network), x402rs (oldest, 2024-12-05), thirdweb (10), heurist, questflow,
fluxa, virtuals, daydreams, + ~20 single-wallet facilitators.

## Attribution: on-chain vs off-chain

On-chain: buyer (`Transfer.from` = EIP-3009 signer), seller (`Transfer.to` = advertised
`payTo`), amount, facilitator (`tx.from`). False-positive risk: a facilitator wallet doing
unrelated USDC transfers (accepted risk in x402scan's model).

NOT on-chain: resource/endpoint URL, HTTP method, price schedule, metadata. EIP-3009 nonce is
random — encodes nothing. Resource attribution = join `Transfer.to` against `accepts[].payTo`
from Bazaar / facilitator discovery lists. One payTo serving many resources → per-endpoint
attribution impossible from chain data alone.

## Bazaar / discovery APIs

- `GET https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources` — PUBLIC, no API key;
  paginate offset/limit (x402scan uses limit=100 w/ 429 backoff)
- `GET .../x402/discovery/search` (semantic), `GET .../x402/discovery/merchant` — public
- Item shape: `{resource, type, x402Version, accepts[] (scheme, network, asset, payTo, amount,
  maxTimeoutSeconds, extra), lastUpdated, metadata? (description, input/output schemas)}`
- `POST .../x402/verify` and `/settle` DO require CDP API keys (facilitator role — not us)
- Facilitators also expose paginated discovery lists via x402 SDK `useFacilitator().list()`
- Sellers additionally publish `/.well-known/x402` and `/openapi.json` w/ `x-payment-info`

## x402 v2 indexing-relevant changes

- Network IDs now CAIP-2 (`eip155:8453`), v1 used `"base"` — normalize both
- `amount` replaces `maxAmountRequired`; `payTo` may be a role constant, not always hex
- SettlementResponse now includes tx hash + payer + amount (off-chain join key if captured)
- EIP-3009-only indexers miss Permit2/7710 settlements; sender-based Transfer filter does not
