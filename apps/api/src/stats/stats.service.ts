import { Inject, Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";

import { DB, type Db } from "../db/db.module";
import { settlements } from "../db/schema";
import type { StatsDto } from "./stats.dto";

@Injectable()
export class StatsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async stats(): Promise<StatsDto> {
    const rows = await this.db
      .select({
        settlements: sql<number>`count(*)::int`,
        decoded: sql<number>`count(*) filter (where ${settlements.decodeSource} = 'calldata')::int`,
        uniqueSenders: sql<number>`count(distinct ${settlements.txFrom})::int`,
      })
      .from(settlements);

    const row = rows[0] ?? { settlements: 0, decoded: 0, uniqueSenders: 0 };
    const decodedPct =
      row.settlements === 0
        ? 0
        : Math.round((row.decoded / row.settlements) * 10000) / 100;

    return {
      settlements: row.settlements,
      decodedPct,
      uniqueSenders: row.uniqueSenders,
    };
  }
}
