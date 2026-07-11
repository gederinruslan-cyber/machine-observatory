import { Module } from "@nestjs/common";

import { DbModule } from "./db/db.module";
import { HealthController } from "./health/health.controller";
import { StatsController } from "./stats/stats.controller";
import { StatsService } from "./stats/stats.service";

@Module({
  imports: [DbModule],
  controllers: [HealthController, StatsController],
  providers: [StatsService],
})
export class AppModule {}
