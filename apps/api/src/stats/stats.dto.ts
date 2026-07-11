import { ApiProperty } from "@nestjs/swagger";

export class StatsDto {
  @ApiProperty({ description: "Total indexed settlements", example: 1514 })
  settlements!: number;

  @ApiProperty({
    description: "Percent of settlements decoded from calldata",
    example: 95.64,
  })
  decodedPct!: number;

  @ApiProperty({
    description: "Distinct transaction senders (facilitator candidates)",
    example: 36,
  })
  uniqueSenders!: number;
}
