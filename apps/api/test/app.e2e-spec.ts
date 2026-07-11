import "reflect-metadata";

import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import type { App } from "supertest/types";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { AppModule } from "../src/app.module";
import { DB } from "../src/db/db.module";

// One suite, two lanes (quality spec: "API endpoint tests with a mocked and a
// real database lane"):
// - unit: drizzle mocked at the DB provider boundary — controllers, routing,
//   and DTO serialization stay real; no database needed (CI unit lane).
// - integration: `pnpm test:integration` sets TEST_INTEGRATION=1 and the same
//   endpoints run against the real DATABASE_URL; skipped gracefully when the
//   env var is absent.

interface StatsRow {
  settlements: number;
  decoded: number;
  uniqueSenders: number;
}

/** Narrow drizzle stub: exactly the `select(...).from(...)` chain StatsService uses. */
function dbStub(rows: StatsRow[]) {
  return {
    select: () => ({ from: () => Promise.resolve(rows) }),
  };
}

/** Typed wrapper — Nest's getHttpServer() returns `any`. */
function http(app: INestApplication) {
  return request(app.getHttpServer() as App);
}

async function createApp(rows: StatsRow[]): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(DB)
    .useValue(dbStub(rows))
    .compile();
  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}

describe("API e2e (mocked drizzle provider)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp([{ settlements: 3, decoded: 2, uniqueSenders: 2 }]);
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /health returns ok", async () => {
    const res = await http(app).get("/health").expect(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("GET /stats aggregates settlement counts", async () => {
    const res = await http(app).get("/stats").expect(200);
    expect(res.body).toEqual({
      settlements: 3,
      decodedPct: 66.67, // 2/3, rounded to 2 decimals
      uniqueSenders: 2,
    });
  });

  it("GET /stats handles an empty settlements table", async () => {
    const empty = await createApp([]);
    try {
      const res = await http(empty).get("/stats").expect(200);
      expect(res.body).toEqual({
        settlements: 0,
        decodedPct: 0,
        uniqueSenders: 0,
      });
    } finally {
      await empty.close();
    }
  });
});

const runIntegration =
  process.env.TEST_INTEGRATION === "1" && !!process.env.DATABASE_URL;

describe.skipIf(!runIntegration)("API e2e (real DATABASE_URL)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    // No override: the real read-only pg pool + drizzle provider from DbModule.
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /health returns ok", async () => {
    const res = await http(app).get("/health").expect(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("GET /stats reads the real settlements table", async () => {
    const res = await http(app).get("/stats").expect(200);
    const body = res.body as {
      settlements: number;
      decodedPct: number;
      uniqueSenders: number;
    };
    // Contract assertions, not exact counts — the table keeps growing.
    expect(body.settlements).toBeGreaterThan(0);
    expect(body.uniqueSenders).toBeGreaterThan(0);
    expect(body.decodedPct).toBeGreaterThanOrEqual(0);
    expect(body.decodedPct).toBeLessThanOrEqual(100);
    expect(Number.isInteger(body.settlements)).toBe(true);
    expect(Number.isInteger(body.uniqueSenders)).toBe(true);
  });
});
