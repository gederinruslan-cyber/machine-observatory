import { CHAIN_IDS } from "@observatory/shared";
import { allFacilitators } from "facilitators";

import { pool } from "../db.js";
import { log } from "../log.js";
import { fetchUpstreamFacilitatorWallets } from "./x402scan-source.js";

// The `facilitators` package (Merit-Systems/x402scan, MIT) keys wallets by short
// network name; we store CAIP-2 (design decision 6: chain-agnostic keys).
const NETWORK_TO_CAIP2: Record<string, string> = {
  base: CHAIN_IDS.base,
  polygon: CHAIN_IDS.polygon,
  // Solana mainnet genesis-hash id; not in shared CHAIN_IDS (EVM-only there).
  solana: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
};

interface WalletRow {
  address: string;
  facilitatorId: string;
  facilitatorName: string;
  chainId: string;
  firstTxDate: Date | null;
}

// Lowercase EVM addresses to match indexer-written tx_from; Solana base58 is
// case-sensitive and stored verbatim.
function normalize(address: string, chainId: string): string {
  return chainId.startsWith("eip155:") ? address.toLowerCase() : address;
}

/** Wallets from the installed npm package — typed, but stale since 2025-11. */
function packageWallets(): WalletRow[] {
  const rows: WalletRow[] = [];
  for (const facilitator of allFacilitators) {
    for (const [network, wallets] of Object.entries(facilitator.addresses)) {
      const chainId = NETWORK_TO_CAIP2[network];
      if (!chainId) {
        log.warn(
          `facilitator-sync: unknown network "${network}" on ${facilitator.id} — skipped`,
        );
        continue;
      }
      for (const wallet of wallets ?? []) {
        rows.push({
          address: normalize(wallet.address, chainId),
          facilitatorId: facilitator.id,
          facilitatorName: facilitator.metadata.name,
          chainId,
          firstTxDate: wallet.dateOfFirstTransaction ?? null,
        });
      }
    }
  }
  return rows;
}

const UPSERT = `
  INSERT INTO enrichment.facilitator_wallets
    (address, facilitator_id, facilitator_name, chain_id, first_tx_date, synced_at)
  VALUES ($1, $2, $3, $4, $5, now())
  ON CONFLICT (address) DO UPDATE SET
    facilitator_id   = EXCLUDED.facilitator_id,
    facilitator_name = EXCLUDED.facilitator_name,
    chain_id         = EXCLUDED.chain_id,
    first_tx_date    = EXCLUDED.first_tx_date,
    synced_at        = EXCLUDED.synced_at
`;

/**
 * Daily sync of known facilitator wallets into enrichment.facilitator_wallets
 * (design decision 2). `is_x402` is a join against this table, so wallet-batch
 * rotations retro-label history without re-indexing. Sources: the `facilitators`
 * npm package, overlaid with the fresher GitHub-main data (which wins on
 * conflict); an upstream fetch failure degrades to package-only sync.
 */
export async function syncFacilitatorWallets(): Promise<void> {
  const rows = new Map<string, WalletRow>();
  for (const row of packageWallets()) rows.set(row.address, row);
  const fromPackage = rows.size;

  try {
    for (const wallet of await fetchUpstreamFacilitatorWallets()) {
      const chainId = NETWORK_TO_CAIP2[wallet.network];
      if (!chainId) continue;
      rows.set(normalize(wallet.address, chainId), {
        address: normalize(wallet.address, chainId),
        facilitatorId: wallet.facilitatorId,
        facilitatorName: wallet.facilitatorName,
        chainId,
        firstTxDate: wallet.firstTxDate,
      });
    }
    log.info(
      `facilitator-sync: github main added ${rows.size - fromPackage} wallets over the npm package (${fromPackage})`,
    );
  } catch (err) {
    log.warn(
      `facilitator-sync: upstream source fetch failed, npm package data only: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }

  for (const row of rows.values()) {
    await pool.query(UPSERT, [
      row.address,
      row.facilitatorId,
      row.facilitatorName,
      row.chainId,
      row.firstTxDate,
    ]);
  }
  log.info(`facilitator-sync: upserted ${rows.size} facilitator wallets`);
}
