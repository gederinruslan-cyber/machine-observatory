import { Global, Module, OnApplicationShutdown } from "@nestjs/common";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export const DB = Symbol("DB");
export type Db = NodePgDatabase;

const DEFAULT_DATABASE_URL =
  "postgresql://observatory:observatory@localhost:5439/observatory";

// The API never writes (architecture spec: only Ponder writes chain facts,
// only the worker writes enrichment). Enforced at the session level so a
// stray mutation fails loudly instead of corrupting data.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
  options: "-c default_transaction_read_only=on",
});

@Global()
@Module({
  providers: [{ provide: DB, useValue: drizzle(pool) }],
  exports: [DB],
})
export class DbModule implements OnApplicationShutdown {
  async onApplicationShutdown() {
    await pool.end();
  }
}
