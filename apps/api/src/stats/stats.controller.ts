import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { StatsDto } from "./stats.dto";
import { StatsService } from "./stats.service";

@ApiTags("stats")
@Controller("stats")
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  @ApiOperation({ summary: "Live settlement stats straight from Postgres" })
  @ApiOkResponse({ type: StatsDto })
  stats(): Promise<StatsDto> {
    return this.statsService.stats();
  }
}
