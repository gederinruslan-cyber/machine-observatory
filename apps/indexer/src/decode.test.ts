import { describe, expect, it } from "vitest";

import { decodeSettlementCalldata, USDC_BASE_LOWER } from "./decode";

// Real Base mainnet transactions, fetched 2026-07-12 via https://base.drpc.org
// (eth_getLogs on USDC topic0 AuthorizationUsed → eth_getTransactionByHash).
// Expected buyer/seller/amount were cross-checked against each receipt's
// Transfer(from, to, value) log — the "agrees with reality" bar. Amounts are
// USDC atomic units (6 decimals).

const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;

// tx 0x7dcdd07c4a5fd13957b7fc471f8b5eba0a88d3281b994534902fd1fc6e67bc34
// block 48502984, tx.from 0x323ae8934f15f8b75c0231364fb8b4afe870a4f2.
// Plain transferWithAuthorization(v,r,s): exactly selector + 9 ABI words.
const TX_PLAIN = {
  input:
    "0xe3ee160e000000000000000000000000725a6871423596fd5a6e3e92f49db97978dd9b590000000000000000000000007dbb4bdcfe614398d1a68ecc219f15280d0959e0000000000000000000000000000000000000000000000000000000000eb06c7d0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006a52aa8988b5b2942d29af628638b677f2adca95ddc36c3e29038a1843cb8de6a8684de5000000000000000000000000000000000000000000000000000000000000001c2fc22203f0ff3623e7f0ebc9e0b9057e2d63dc66b5a4c9b3ba2a5f8f98de8b6a7f67c33f5b93bf0bc3cbb5e95d49435e6011faffd781271a3fb7045cd5569ee3",
  buyer: "0x725a6871423596Fd5A6E3e92F49dB97978Dd9b59",
  seller: "0x7DBB4bdCfE614398D1a68ecc219F15280d0959E0",
  amount: 246443133n,
} as const;

// tx 0xfe111b9832ebc9b70b42213f155c29c7b966269fd51a01447ef8814023556308
// block 48507783, tx.from 0x4c934c63c786157fefd990945b25ea60a0fb0205 (CDP
// facilitator). Carries the CDP CBOR marker {"w":"cdp_facil1"} appended after
// the ABI args — must still decode (viem ignores trailing bytes).
const TX_CDP_SUFFIX = {
  input:
    "0xe3ee160e0000000000000000000000002b4ee3387008e5ff1a9996fc8b48d2fd61389037000000000000000000000000e9030014f5dae217d0a152f02a043567b16c1abf00000000000000000000000000000000000000000000000000000000000007d0000000000000000000000000000000000000000000000000000000006a52b195000000000000000000000000000000000000000000000000000000006a52b519eb1eb9a39e81d5681c93ddd1b7779640b83a5ac2e9aff52a11dbcc267d7d0b84000000000000000000000000000000000000000000000000000000000000001be7306bd7f4aac4871be86499b8bb60e82fecd22d26cb986d8bc3f20ed84d929a14828b6a7b0389b7fb968054e1492dda6ef20184e4d7eb2ec7c51170c69149f7a161776a6364705f666163696c31000e0280218021802180218021802180218021",
  buyer: "0x2B4Ee3387008E5fF1A9996fc8B48D2fd61389037",
  seller: "0xe9030014F5DAe217d0A152f02A043567b16c1aBf",
  amount: 2000n,
} as const;

// tx 0x569a7999aaee5b26882a47237fd6b65f314db316ba18bdb2b4aa5ed370f9fa63
// block 48502983, tx.from 0xca5e87f82b3fa093800e6ad67d621a427d79c70d.
// validAfter = 0 variant, also CDP-suffixed.
const TX_ZERO_VALID_AFTER = {
  input:
    "0xe3ee160e000000000000000000000000b5446c91ca38460dc35788d513f9453565e17eb900000000000000000000000062026146c70e8181f171bae5790dfabe9744481300000000000000000000000000000000000000000000000000000000000027100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006a528ea95dbff5d97074e8846d0ff6ad710f2b37d5003cdfc45d92c8a110343903669f1e000000000000000000000000000000000000000000000000000000000000001c2d7884ba0f0db0e85ec55ff005edc39dc9047265de4a65faf50c20bad06a08651474664378b7b42d45afe4ba92e4b1526ffde6e027cd9ad70140459b161c12b6a161776a6364705f666163696c31000e0280218021802180218021802180218021",
  buyer: "0xb5446C91Ca38460dC35788d513F9453565E17Eb9",
  seller: "0x62026146C70E8181f171BaE5790DFAbe97444813",
  amount: 10000n,
} as const;

// tx 0x8eba89055681f776b966d70fb8480bd07764450b4497693c948baf6d3a52f59a
// block 48502986: a REAL settlement routed through a proxy contract
// (tx.to 0x6d27486790ce5918f1bc68be3fccc25304d09d31, selector 0xcf092995,
// AuthorizationUsed by 0x6460886fad4d84ee54a9f463804b9022f26c3e5e). Because
// tx.to is not USDC, calldata decoding must defer to receipt completion.
const TX_PROXIED = {
  to: "0x6d27486790ce5918f1bc68be3fccc25304d09d31",
  input:
    "0xcf0929950000000000000000000000006460886fad4d84ee54a9f463804b9022f26c3e5e0000000000000000000000009c955c40dc98fce89a133f402ffbf94070e6e29900000000000000000000000000000000000000000000000000000000000003e8000000000000000000000000000000000000000000000000000000006a528e72000000000000000000000000000000000000000000000000000000006a528eaf848fd583e1e26b4c51330a8485ef2c8e844824abfb1edbaeb24143816ab1199d00000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000000416c5911ca3f832f066ecb72e0c6bb7b1e6fb9903dd32acde3d7bf892a9fdbd2a57234cff145c9d1fec8935edeaf3ba80e2137d3fee25e79f7b27c6962b7db8e121b00000000000000000000000000000000000000000000000000000000000000",
} as const;

const NOT_DECODED = {
  buyer: null,
  seller: null,
  amount: null,
  decodeSource: "needs_receipt",
} as const;

describe("decodeSettlementCalldata — 0xe3ee160e happy path (real Base calldata)", () => {
  it("decodes a plain transferWithAuthorization call", () => {
    expect(decodeSettlementCalldata(USDC, TX_PLAIN.input)).toEqual({
      buyer: TX_PLAIN.buyer,
      seller: TX_PLAIN.seller,
      amount: TX_PLAIN.amount,
      decodeSource: "calldata",
    });
  });

  it("decodes CDP calldata with a trailing CBOR marker", () => {
    expect(decodeSettlementCalldata(USDC, TX_CDP_SUFFIX.input)).toEqual({
      buyer: TX_CDP_SUFFIX.buyer,
      seller: TX_CDP_SUFFIX.seller,
      amount: TX_CDP_SUFFIX.amount,
      decodeSource: "calldata",
    });
  });

  it("decodes a validAfter=0 settlement", () => {
    expect(decodeSettlementCalldata(USDC, TX_ZERO_VALID_AFTER.input)).toEqual({
      buyer: TX_ZERO_VALID_AFTER.buyer,
      seller: TX_ZERO_VALID_AFTER.seller,
      amount: TX_ZERO_VALID_AFTER.amount,
      decodeSource: "calldata",
    });
  });

  it("accepts tx.to in any casing (checksummed vs lowercased)", () => {
    const lower = USDC_BASE_LOWER as `0x${string}`;
    expect(decodeSettlementCalldata(lower, TX_PLAIN.input).decodeSource).toBe(
      "calldata",
    );
  });
});

describe("decodeSettlementCalldata — needs_receipt fallback", () => {
  it("defers a real proxied settlement (tx.to is not USDC)", () => {
    expect(decodeSettlementCalldata(TX_PROXIED.to, TX_PROXIED.input)).toEqual(
      NOT_DECODED,
    );
  });

  it("defers garbage calldata carrying a known selector", () => {
    expect(decodeSettlementCalldata(USDC, "0xe3ee160edeadbeef")).toEqual(
      NOT_DECODED,
    );
  });

  it("defers unknown selectors", () => {
    expect(
      decodeSettlementCalldata(USDC, "0xa9059cbb0000000000000000000000000000"),
    ).toEqual(NOT_DECODED);
  });

  it("defers empty calldata and contract creations (to = null)", () => {
    expect(decodeSettlementCalldata(USDC, "0x")).toEqual(NOT_DECODED);
    expect(decodeSettlementCalldata(null, TX_PLAIN.input)).toEqual(NOT_DECODED);
    expect(decodeSettlementCalldata(undefined, TX_PLAIN.input)).toEqual(
      NOT_DECODED,
    );
  });
});
