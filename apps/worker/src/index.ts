// Enrichment worker: all off-chain, non-deterministic work lives here, never in
// Ponder handlers (design decision 8). Owns the `enrichment` schema exclusively.
import cron from "node-cron";

import { reportFacilitatorCandidates } from "./jobs/facilitator-candidates.js";
import { syncFacilitatorWallets } from "./jobs/facilitator-sync.js";
import { log } from "./log.js";
import { migrate } from "./migrate.js";

async function runDailyJobs(): Promise<void> {
  try {
    await syncFacilitatorWallets();
  } catch (err) {
    log.error("facilitator-sync failed", err);
  }
  await reportFacilitatorCandidates();
}

await migrate();

cron.schedule("0 6 * * *", () => void runDailyJobs(), { timezone: "UTC" });
log.info("worker up — facilitator sync scheduled daily at 06:00 UTC");

// `pnpm dev` sets RUN_ON_STARTUP so a fresh checkout syncs immediately instead
// of waiting for the next cron tick.
if (process.env.RUN_ON_STARTUP === "true") {
  await runDailyJobs();
}
