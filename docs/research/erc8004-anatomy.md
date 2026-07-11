# ERC-8004 (Trustless Agents) anatomy (ground truth, researched 2026-07-11)

Sources: EIP text (eips.ethereum.org/EIPS/eip-8004), reference Solidity
(github.com/erc-8004/erc-8004-contracts), live RPC verification (eth_getCode + ERC-1967
impl slots, 2026-07-11), agent0lab/subgraph.

## Deployed addresses — SAME on every chain (CREATE2 via SAFE Singleton Factory)

Mainnets (Ethereum, Base, BSC, Arbitrum, Optimism, Polygon, + ~18 more):
- IdentityRegistry:   `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`
- ReputationRegistry: `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63`
- ValidationRegistry: `0x8004Cb1BF31DAf7788923b405b754f57acEB4272`

Testnets: Identity `0x8004A818BFB912233c491871b3d84c89A494BD9e`, Reputation
`0x8004B663056A597Dffe9eCcC1965A193B7388713`, Validation same as mainnet.

All three are UUPS-upgradeable ERC-1967 proxies (owner-upgradeable, NOT immutable) —
subscribe to `Upgraded(address)` and version ABI handling. Verified live: Validation has a
real implementation on Ethereum mainnet ONLY; on Base/BSC the proxy still points to the
MinimalUUPS placeholder (not activated). Validation spec marked unstable (TEE community
revision pending) — gate per chain. agent0lab subgraph has Validation paused everywhere.

Registries are expected singletons per chain but permissionless to redeploy — data model
should key agents by (chainId, registryAddress, agentId). Registration files carry a
`registrations[]` array of `{agentId, agentRegistry}` for cross-chain presence.

## Identity Registry (ERC-721, name "AgentIdentity" / symbol "AGENT")

On-chain: agentId (tokenId), owner, agentURI (tokenURI), key/value metadata, reserved
`agentWallet` metadata key.

Events:
- `Registered(uint256 indexed agentId, string agentURI, address indexed owner)` —
  topic0 `0xca52e62c367d81bb2e328eb795f7c7ba24afb478408a26c0e201d155c449bc4a`
- `MetadataSet(uint256 indexed agentId, string indexed indexedMetadataKey, string metadataKey, bytes metadataValue)` —
  topic0 `0x2c149ed548c6d2993cd73efe187df6eccabe4538091b33adbd25fafdb8a1468b`
- `URIUpdated(uint256 indexed agentId, string newURI, address indexed updatedBy)` —
  topic0 `0x3a2c7fffc2cba7582c690e3b82c453ea02a308326a98a3ad7576c606336409fb`
- Plus ERC-721 `Transfer` (ownership tracking — NFT transfer auto-clears agentWallet),
  ERC-4906 metadata events, UUPS `Upgraded`.

NOTE: `string indexed` params (metadataKey, tag1) arrive as keccak hashes in topics with
plaintext duplicated in event data — decode from data.

## The identity ↔ payments join (critical for us)

1. **`agentWallet` reserved metadata key** — "the address where the agent receives payments";
   set via `setAgentWallet(agentId, newWallet, deadline, signature)` (EIP-712 w/ ERC-1271
   fallback); cleared on NFT transfer. THE standard on-chain link to x402 Transfer.to.
2. `x402Support: true` boolean in the off-chain registration JSON.
3. Off-chain feedback files may carry `proofOfPayment: {fromAddress, toAddress, chainId, txHash}`
   — direct feedback↔payment tx join.

## Registration file (agentURI → JSON; https, ipfs://, or data: URIs)

Required: `type` = "https://eips.ethereum.org/EIPS/eip-8004#registration-v1", `name`,
`description`, `image`. Also: `services[]` ({name: web|A2A|MCP|OASF|ENS|DID|email, endpoint,
version}), `x402Support`, `active`, `supportedTrust[]`, `registrations[]`. Optional reverse
domain proof at `https://{domain}/.well-known/agent-registration.json`.

## Reputation Registry

Per (agentId, clientAddress, feedbackIndex): value int128 + valueDecimals (0-18), tag1, tag2,
isRevoked; off-chain payload via feedbackURI + feedbackHash (keccak commitment). Self-feedback
by owner/operators blocked in code. Tag conventions: starred 0-100, uptime (2 decimals),
reachable, successRate, responseTime, tradingYield.

Events:
- `NewFeedback(uint256 indexed agentId, address indexed clientAddress, uint64 feedbackIndex, int128 value, uint8 valueDecimals, string indexed indexedTag1, string tag1, string tag2, string endpoint, string feedbackURI, bytes32 feedbackHash)` —
  topic0 `0x6a4a61743519c9d648a14e6493f47dbe3ff1aa29e7785c96c8326a205e58febc`
- `FeedbackRevoked(agentId, clientAddress, feedbackIndex)` —
  topic0 `0x25156fd3288212246d8b008d5921fde376c71ed14ac2e072a506eb06fde6d09d`
- `ResponseAppended(agentId, clientAddress, feedbackIndex, responder, responseURI, responseHash)` —
  topic0 `0xb1c6be0b5b8aef6539e2fac0fd131a2faa7b49edf8e505b5eb0ad487d56051d4`

On-chain `getSummary` requires an explicit client list (Sybil guard) — real scoring is
expected indexer-side. Feedback is append-only + revocable, with response/dispute mechanism.

## Validation Registry (UNSTABLE — spec under revision)

`ValidationRequest(address indexed validatorAddress, uint256 indexed agentId, string requestURI, bytes32 indexed requestHash)` —
topic0 `0x530436c3634a98e1e626b0898be2f1e9980cc1bd2a78c07a0aba52d0a48a5059`
`ValidationResponse(validatorAddress, agentId, requestHash, uint8 response (0-100), responseURI, responseHash, tag)` —
topic0 `0xafddf629e874ccc3963b6a888c477bd464a6c8525024fc88759ea3b2326349ae`

## Reference implementations to learn from

- **agent0lab/subgraph** (MIT, Consensys-backed) — best reference: indexes exactly these
  events across ETH/Base/BSC/Polygon/Monad; File Data Sources pull IPFS/HTTPS registration
  and feedback JSON into entities.
- 8004scan.io (AltLayer) — hosted, closed source, public API, 7-dimension agent scoring.
- Eversmile12/erc-8004-agents-explorer-demo, erc-8004-js / erc-8004-py SDKs.
