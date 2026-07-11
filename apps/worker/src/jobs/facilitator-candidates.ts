import { pool } from "../db.js";
import { log } from "../log.js";

// Local dev: Ponder writes to `public`; prod will point this at the stable
// views schema. Values come from a fixed allowlist-shaped env var, not user input.
const SETTLEMENTS_TABLE = process.env.SETTLEMENTS_TABLE ?? "public.settlements";

/**
 * Facilitator-candidate queue (design decision 2, corollary): tx senders
 * emitting AuthorizationUsed that the `facilitators` npm package does not know
 * yet. Early warning ahead of the package — keeps us self-sufficient if it
 * stops being maintained. Alerting is a WARN log line per candidate for now.
 */
export async function reportFacilitatorCandidates(): Promise<void> {
  try {
    const { rows } = await pool.query<{ tx_from: string; settlements: string }>(
      `SELECT s.tx_from, count(*)::text AS settlements
       FROM ${SETTLEMENTS_TABLE} s
       LEFT JOIN enrichment.facilitator_wallets fw ON fw.address = lower(s.tx_from)
       WHERE fw.address IS NULL
       GROUP BY s.tx_from
       ORDER BY count(*) DESC`,
    );

    if (rows.length === 0) {
      log.info("facilitator-candidates: no unknown senders — all attributed");
      return;
    }
    log.info(`facilitator-candidates: ${rows.length} unknown sender(s) found`);
    for (const row of rows) {
      log.warn(
        `facilitator-candidate: ${row.tx_from} (${row.settlements} settlements, not in facilitator_wallets)`,
      );
    }
  } catch (err) {
    // Settlements table may not exist yet (indexer not deployed / fresh db) —
    // degrade to a warning instead of crashing the worker.
    log.warn(
      `facilitator-candidates: query failed (${SETTLEMENTS_TABLE} missing?): ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}
