// The `facilitators` npm package has not been published since 2025-11 (78
// wallets) while the x402scan repo's wallet data kept growing (~150). Until
// releases resume we supplement the package import with the canonical
// per-facilitator source files on GitHub main (MIT; design risk note:
// "package is MIT, we can fork"). Parsing relies on the repo's very regular
// literal shape: flat `{ address: '…', tokens: [CONST], dateOfFirstTransaction:
// new Date('…') }` entries under per-network keys.

const SOURCE_DIR_API =
  "https://api.github.com/repos/Merit-Systems/x402scan/contents/packages/external/facilitators/src/facilitators";

// `[Network.BASE]: [` on main; plain `base: [` in older (npm-era) sources.
const NETWORK_KEY =
  /(?:\[Network\.(BASE|POLYGON|SOLANA)\]|\b(base|polygon|solana))\s*:\s*\[/g;

export interface UpstreamWallet {
  facilitatorId: string;
  facilitatorName: string;
  network: "base" | "polygon" | "solana";
  address: string;
  firstTxDate: Date | null;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "user-agent": "machine-observatory-worker" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.text();
}

/** Body of the `[` at `openBracket`, respecting nested `tokens: […]` arrays. */
function arrayBody(source: string, openBracket: number): string {
  let depth = 0;
  for (let i = openBracket; i < source.length; i++) {
    if (source[i] === "[") depth += 1;
    else if (source[i] === "]" && --depth === 0)
      return source.slice(openBracket + 1, i);
  }
  return "";
}

export async function fetchUpstreamFacilitatorWallets(): Promise<
  UpstreamWallet[]
> {
  const listing = JSON.parse(await fetchText(SOURCE_DIR_API)) as {
    name: string;
    download_url: string;
  }[];

  const wallets: UpstreamWallet[] = [];
  for (const file of listing) {
    if (!file.name.endsWith(".ts") || file.name === "index.ts") continue;
    const source = await fetchText(file.download_url);

    const id = source.match(/\bid:\s*['"]([^'"]+)['"]/)?.[1];
    const name = source.match(/\bname:\s*['"]([^'"]+)['"]/)?.[1];
    const addressesAt = source.indexOf("addresses:");
    if (!id || !name || addressesAt < 0) continue;

    const section = source.slice(addressesAt);
    for (const match of section.matchAll(NETWORK_KEY)) {
      const network = (match[1]?.toLowerCase() ??
        match[2]) as UpstreamWallet["network"];
      const body = arrayBody(section, match.index + match[0].length - 1);
      for (const [entry] of body.matchAll(/\{[^{}]*\}/g)) {
        const address = entry.match(/\baddress:\s*['"]([^'"]+)['"]/)?.[1];
        if (!address) continue;
        const date = entry.match(/new Date\(['"]([^'"]+)['"]\)/)?.[1];
        wallets.push({
          facilitatorId: id,
          facilitatorName: name,
          network,
          address,
          firstTxDate: date ? new Date(date) : null,
        });
      }
    }
  }
  return wallets;
}
