// Always render fresh from the API — no static caching for live indexer stats.
export const dynamic = "force-dynamic";

interface Stats {
  settlements: number;
  decodedPct: number;
  uniqueSenders: number;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.API_URL ??
  "http://localhost:3001";

async function fetchStats(): Promise<Stats | null> {
  try {
    const res = await fetch(`${API_URL}/stats`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return null;
    const body: unknown = await res.json();
    if (typeof body !== "object" || body === null) return null;
    const { settlements, decodedPct, uniqueSenders } = body as Partial<Stats>;
    if (
      typeof settlements !== "number" ||
      typeof decodedPct !== "number" ||
      typeof uniqueSenders !== "number"
    ) {
      return null;
    }
    return { settlements, decodedPct, uniqueSenders };
  } catch {
    // API unreachable (indexer/api not running) — render the offline state.
    return null;
  }
}

const integer = new Intl.NumberFormat("en-US");

export default async function Home() {
  const stats = await fetchStats();

  return (
    <main>
      <div className="card">
        <h1>Machine Observatory</h1>
        <p className="subtitle">on-chain AI agent economy — Base / x402</p>

        {stats ? (
          <>
            <div className="status online">
              <span className="dot" />
              indexer online
            </div>
            <dl>
              <dt>settlements indexed</dt>
              <dd>{integer.format(stats.settlements)}</dd>
              <dt>decoded</dt>
              <dd>{stats.decodedPct.toFixed(1)}%</dd>
              <dt>unique senders</dt>
              <dd>{integer.format(stats.uniqueSenders)}</dd>
            </dl>
          </>
        ) : (
          <>
            <div className="status offline">
              <span className="dot" />
              indexer offline
            </div>
            <p className="offline-note">
              Could not reach the observatory API. Stats will appear once the
              indexer is back online.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
