import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { pool } from "./db.js";
import { log } from "./log.js";

const MIGRATIONS_DIR = fileURLToPath(new URL("../migrations", import.meta.url));

/**
 * Plain-SQL migrations over the worker-owned `enrichment` schema (the schema
 * itself is created by docker/postgres-init). Idempotent by construction —
 * every statement must be IF NOT EXISTS — so we just replay all files, sorted,
 * on every startup.
 */
export async function migrate(): Promise<void> {
  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) {
    await pool.query(await readFile(path.join(MIGRATIONS_DIR, file), "utf8"));
    log.info(`migration applied: ${file}`);
  }
}
