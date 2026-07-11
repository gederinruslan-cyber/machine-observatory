# architecture Specification

## Purpose
TBD - created by archiving change add-baseline-architecture. Update Purpose after archive.
## Requirements
### Requirement: Single source of chain facts
The system SHALL index chain data via a self-hosted Ponder application writing to a
self-owned Postgres 16 instance, and all chain facts (settlements, agent registrations,
feedback, metadata events) SHALL live in Ponder-managed schemas published through a stable
views schema. No component other than Ponder SHALL write to chain-fact tables.

#### Scenario: Zero-downtime redeploy
- **WHEN** a new indexer deployment finishes syncing into its per-deployment schema
- **THEN** the stable views schema is flipped to the new deployment without API downtime

### Requirement: Superset indexing with join-time classification
The indexer SHALL record every USDC `AuthorizationUsed` event on Base regardless of
transaction sender, storing `tx_from` on each row. Classification of a settlement as x402
SHALL be computed by joining against the `enrichment.facilitator_wallets` table, never by
filtering at index time.

#### Scenario: Facilitator wallet batch added
- **WHEN** new facilitator wallets appear in the synced facilitators package
- **THEN** historical settlements from those wallets become classified as x402 via view
  refresh, with no re-indexing

#### Scenario: Unknown sender early warning
- **WHEN** an address not present in `facilitator_wallets` submits transactions emitting
  `AuthorizationUsed`
- **THEN** it appears in a facilitator-candidate queue for review

### Requirement: Settlement attribution and decoding
For each indexed settlement the system SHALL record buyer, seller, amount, facilitator
(`tx.from`), block, and tx hash. Decoding SHALL be attempted from transaction calldata
(selectors 0xe3ee160e, 0xcf092995); rows that fail calldata decoding SHALL be flagged
`needs_receipt` and completed asynchronously via transaction receipts. Each settlement row
SHALL carry a confidence value: `confirmed` (EIP-3009 corroborated) or `probable`.

#### Scenario: Batched settlement
- **WHEN** a settlement arrives inside a multicall whose calldata does not match known
  selectors
- **THEN** the row is stored flagged `needs_receipt` and the worker completes buyer/seller/
  amount from the receipt within one worker cycle

### Requirement: Deterministic indexer handlers
Ponder handlers SHALL be deterministic: no HTTP fetches, LLM calls, or clock-dependent
logic. All off-chain work SHALL run in the enrichment worker.

#### Scenario: Cache replay
- **WHEN** a handler or schema changes and the indexer re-runs
- **THEN** indexing replays entirely from the local ponder_sync cache with zero RPC calls
  and produces identical chain-fact rows

### Requirement: Two schema domains
Off-chain data (facilitator wallets, registration files, feedback files, Bazaar resources,
notable events, digests) SHALL live in an `enrichment` schema owned exclusively by the
worker. Product reads SHALL be SQL views joining chain-fact and enrichment schemas;
derived interpretations (is_x402, agent linkage, resource attribution, commerce_class)
SHALL be views or derived tables, never columns written by the indexer.

#### Scenario: Interpretation change
- **WHEN** the definition of real commerce vs wash trading changes
- **THEN** reclassification is a view/derived-table update requiring no indexer change

### Requirement: Chain-agnostic data model
Every chain-fact and enrichment row SHALL carry a CAIP-2 chain identifier (e.g.
`eip155:8453`); agents SHALL be keyed by (chain_id, registry_address, agent_id). v1
network names (e.g. "base") SHALL be normalized to CAIP-2 at ingestion.

#### Scenario: Second EVM chain
- **WHEN** BSC indexing is enabled
- **THEN** it requires only chain configuration (same registry addresses), no schema change

### Requirement: ERC-8004 registry indexing safety
The system SHALL subscribe to UUPS `Upgraded` events on all indexed registries and alert
on upgrade. The Validation registry SHALL be gated off on chains where its proxy points to
a placeholder implementation.

#### Scenario: Registry upgraded
- **WHEN** an `Upgraded` event is emitted by a registry proxy
- **THEN** an operator alert is raised before ABI-dependent processing continues

### Requirement: Historical backfill via one-shot extraction
Full Base history (from ~2024-12) SHALL be seeded via a one-time sender/topic-filtered
extraction (HyperSync or SQD Portal) into a read-only `payments_archive` table; live
indexing starts near head; API views SHALL present archive + live as one continuous
dataset. No recurring dependency on the extraction provider is permitted.

#### Scenario: All-time leaderboard
- **WHEN** an all-time earnings leaderboard is queried
- **THEN** results reflect the union of archived and live settlements with no gap or overlap
  at the seam

### Requirement: Correctness monitors
The system SHALL run a daily reconciliation of settlement counts against x402scan public
totals, alerting at >1% divergence, and a nightly gap sweep verifying block-range
continuity.

#### Scenario: Divergence detected
- **WHEN** daily counts diverge from x402scan by more than 1%
- **THEN** an operator alert is raised with the divergent block range

### Requirement: API decoupled from indexer
Product-facing endpoints SHALL be served by a standalone API service reading the stable
SQL views; the indexer process SHALL expose only internal health/metrics. The frontend
SHALL communicate exclusively with the API service.

#### Scenario: Indexer redeploy during traffic
- **WHEN** the indexer is restarting, backfilling, or re-syncing
- **THEN** API endpoints continue serving from Postgres without interruption

### Requirement: Cost and hosting envelope
The launch deployment SHALL run on a single EU root server (Postgres colocated with the
indexer) with Cloudflare-hosted frontend, with total recurring cost under $100/month, and
the only recurring data vendor SHALL be commodity JSON-RPC (swappable without code change).

#### Scenario: RPC provider swap
- **WHEN** the RPC provider changes pricing unfavorably
- **THEN** switching providers requires only an environment-variable change

