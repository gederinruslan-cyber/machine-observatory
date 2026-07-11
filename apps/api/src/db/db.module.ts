import { Global, Inject, Module, OnApplicationShutdown } from "@nestjs/common";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export const DB = Symbol("DB");
export const PG_POOL = Symbol("PG_POOL");
export type Db = NodePgDatabase;

const DEFAULT_DATABASE_URL =
  "postgresql://observatory:observatory@localhost:5439/observatory";

// The API never writes (architecture spec: only Ponder writes chain facts,
// only the worker writes enrichment). Enforced at the session level so a
// stray mutation fails loudly instead of corrupting data.
//
// The pool is a DI-owned provider (not module-scoped state) so every Nest
// application instance — including e2e test apps — owns and closes its own
// pool. Runtime behavior is unchanged: one pool, closed on shutdown.
@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      useFactory: () =>
        new Pool({
          connectionString: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
          options: "-c default_transaction_read_only=on",
        }),
    },
    {
      provide: DB,
      useFactory: (pool: Pool) => drizzle(pool),
      inject: [PG_POOL],
    },
  ],
  exports: [DB],
})
export class DbModule implements OnApplicationShutdown {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onApplicationShutdown() {
    await this.pool.end();
  }
}
