import { getAddress, isAddress } from "viem";
import { describe, expect, it } from "vitest";

import {
  BAZAAR_API,
  CHAIN_IDS,
  ERC8004_MAINNET,
  SELECTORS,
  TOPICS,
  USDC_BASE,
  USDC_DECIMALS,
  X402_EXACT_PERMIT2_PROXY,
} from "./index.js";

// Sanity gates over chain-level ground truth (quality spec: "Worker and
// shared-constants unit tests"). These catch fat-fingered edits — provenance
// of the values themselves is docs/research/*.md, reviewed by chain-reviewer.

const BYTES32_HEX = /^0x[0-9a-f]{64}$/;
const SELECTOR_HEX = /^0x[0-9a-f]{8}$/;
const CAIP2_EIP155 = /^eip155:\d+$/;

describe("addresses", () => {
  const addresses: Record<string, string> = {
    USDC_BASE,
    X402_EXACT_PERMIT2_PROXY,
    ...ERC8004_MAINNET,
  };

  for (const [name, address] of Object.entries(addresses)) {
    it(`${name} is a valid, EIP-55 checksummed address`, () => {
      expect(isAddress(address, { strict: true })).toBe(true);
      expect(getAddress(address)).toBe(address);
    });
  }

  it("ERC-8004 registries live at the 0x8004… vanity prefix", () => {
    for (const address of Object.values(ERC8004_MAINNET)) {
      expect(address.toLowerCase().startsWith("0x8004")).toBe(true);
    }
  });
});

describe("event topics", () => {
  for (const [name, topic] of Object.entries(TOPICS)) {
    it(`${name} is 32-byte lowercase hex`, () => {
      expect(topic).toMatch(BYTES32_HEX);
    });
  }

  it("topics are distinct", () => {
    expect(new Set(Object.values(TOPICS)).size).toBe(
      Object.values(TOPICS).length,
    );
  });
});

describe("function selectors", () => {
  for (const [name, selector] of Object.entries(SELECTORS)) {
    it(`${name} is a 4-byte selector`, () => {
      expect(selector).toMatch(SELECTOR_HEX);
    });
  }
});

describe("chain ids", () => {
  for (const [name, id] of Object.entries(CHAIN_IDS)) {
    it(`${name} is CAIP-2 (eip155:<id>)`, () => {
      expect(id).toMatch(CAIP2_EIP155);
    });
  }

  it("base is eip155:8453", () => {
    expect(CHAIN_IDS.base).toBe("eip155:8453");
  });
});

describe("misc", () => {
  it("USDC has 6 decimals", () => {
    expect(USDC_DECIMALS).toBe(6);
  });

  it("Bazaar endpoints are https CDP URLs", () => {
    for (const url of Object.values(BAZAAR_API)) {
      expect(url).toMatch(/^https:\/\/api\.cdp\.coinbase\.com\//);
    }
  });
});
