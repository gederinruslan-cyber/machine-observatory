import { beforeEach, describe, expect, it, vi } from "vitest";

// Unit tests for the facilitator upsert mapping (quality spec: "Worker and
// shared-constants unit tests"): pg is a stub client capturing query calls —
// no live database, no network.

const queryMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
);

vi.mock("../db.js", () => ({
  pool: { query: queryMock },
}));

const upstreamMock = vi.hoisted(() => vi.fn());
vi.mock("./x402scan-source.js", () => ({
  fetchUpstreamFacilitatorWallets: upstreamMock,
}));

vi.mock("facilitators", () => ({
  allFacilitators: [
    {
      id: "cdp",
      metadata: { name: "Coinbase CDP" },
      addresses: {
        // Mixed-case on purpose: EVM addresses must be lowercased to match
        // the indexer-written tx_from.
        base: [
          {
            address: "0xDBdf3D8ed80F84C35D01c6C9F9271761Bad90BA6",
            dateOfFirstTransaction: new Date("2025-05-05T00:00:00Z"),
          },
        ],
        // Base58 is case-sensitive — must be stored verbatim.
        solana: [
          {
            address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
            dateOfFirstTransaction: null,
          },
        ],
        // Networks we do not map must be skipped, not crash.
        "made-up-chain": [{ address: "0x1111", dateOfFirstTransaction: null }],
      },
    },
  ],
}));

const { syncFacilitatorWallets } = await import("./facilitator-sync.js");

function upsertedRows(): unknown[][] {
  return queryMock.mock.calls
    .filter(([sql]) => String(sql).includes("INSERT INTO"))
    .map(([, values]) => values as unknown[]);
}

beforeEach(() => {
  queryMock.mockClear();
  upstreamMock.mockReset();
});

describe("syncFacilitatorWallets", () => {
  it("upserts package wallets into enrichment.facilitator_wallets", async () => {
    upstreamMock.mockResolvedValue([]);
    await syncFacilitatorWallets();

    const sql = String(queryMock.mock.calls[0]?.[0]);
    expect(sql).toContain("INSERT INTO enrichment.facilitator_wallets");
    expect(sql).toContain("ON CONFLICT (address) DO UPDATE");

    const rows = upsertedRows();
    expect(rows).toHaveLength(2); // unknown network skipped

    // Parameter order: address, facilitator_id, facilitator_name, chain_id, first_tx_date.
    expect(rows[0]).toEqual([
      "0xdbdf3d8ed80f84c35d01c6c9f9271761bad90ba6", // lowercased EVM
      "cdp",
      "Coinbase CDP",
      "eip155:8453", // CAIP-2, never the short network name
      new Date("2025-05-05T00:00:00Z"),
    ]);
    expect(rows[1]).toEqual([
      "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM", // verbatim base58
      "cdp",
      "Coinbase CDP",
      "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
      null,
    ]);
  });

  it("lets fresher upstream data win over the npm package on conflict", async () => {
    upstreamMock.mockResolvedValue([
      {
        facilitatorId: "cdp",
        facilitatorName: "Coinbase CDP (renamed)",
        network: "base",
        address: "0xDBDF3D8ED80F84C35D01C6C9F9271761BAD90BA6", // same wallet, different casing
        firstTxDate: new Date("2025-05-06T00:00:00Z"),
      },
      {
        facilitatorId: "payai",
        facilitatorName: "PayAI",
        network: "polygon",
        address: "0xAAAA00000000000000000000000000000000AAAA",
        firstTxDate: null,
      },
    ]);
    await syncFacilitatorWallets();

    const rows = upsertedRows();
    expect(rows).toHaveLength(3);

    const cdp = rows.find(
      (r) => r[0] === "0xdbdf3d8ed80f84c35d01c6c9f9271761bad90ba6",
    );
    expect(cdp?.[2]).toBe("Coinbase CDP (renamed)"); // upstream overrode the package
    expect(cdp?.[4]).toEqual(new Date("2025-05-06T00:00:00Z"));

    const payai = rows.find(
      (r) => r[0] === "0xaaaa00000000000000000000000000000000aaaa",
    );
    expect(payai?.[3]).toBe("eip155:137"); // polygon → CAIP-2
  });

  it("degrades to package-only sync when the upstream fetch fails", async () => {
    upstreamMock.mockRejectedValue(new Error("github down"));
    await expect(syncFacilitatorWallets()).resolves.toBeUndefined();
    expect(upsertedRows()).toHaveLength(2);
  });
});
