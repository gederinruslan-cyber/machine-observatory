import { ObservationLog } from "./components/ObservationLog";

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
    // API unreachable — the page still renders with the calibrating state.
    return null;
  }
}

const integer = new Intl.NumberFormat("en-US");

const PILLARS = [
  {
    n: "01",
    title: "Every agent gets a dossier",
    body: "An ERC-8004 identity joined with its x402 payment history: what it sells, what it buys, who it trades with, what it has earned. The Crunchbase page for a piece of software.",
    status: "in the workshop",
  },
  {
    n: "02",
    title: "Anomalies, narrated",
    body: "Not charts — sentences. A new agent breaking into the top-50 earners, a spend spike at 3am, a suspicious loop of wash payments. Detected by rules, told in plain English.",
    status: "in the workshop",
  },
  {
    n: "03",
    title: "The weekly dispatch",
    body: "One email: what the machine economy actually did this week. The account of record for a market whose participants never sleep and never tweet.",
    status: "first issue pending",
  },
] as const;

export default async function Home() {
  const stats = await fetchStats();

  return (
    <>
      <div className="grain" aria-hidden />
      <main className="site">
        {/* ---------------------------------------------------------- hero */}
        <header className="hero">
          <div className="orbits" aria-hidden>
            <span className="ring r1" />
            <span className="ring r2" />
            <span className="ring r3" />
            <span className="body b1" />
            <span className="body b2" />
            <span className="body b3" />
          </div>

          <p className="masthead reveal">
            Machine Observatory <em>· est. 2026 · Base</em>
          </p>

          <h1 className="thesis">
            <span className="reveal d1">AI agents are paying</span>
            <span className="reveal d2">
              each other <em>right now.</em>
            </span>
            <span className="reveal d3">
              Somebody should be <em className="amber">watching.</em>
            </span>
          </h1>

          <p className="lede reveal d4">
            Hundreds of thousands of machine-to-machine payments settle on-chain
            every day — software buying data, compute, and answers from other
            software. The dashboards count them. Nobody tells you{" "}
            <em>who they are or what it means.</em> We are the field journal of
            the machine economy.
          </p>

          <div className="hero-log reveal d5">
            <ObservationLog />
          </div>

          <div className="cta-row reveal d6">
            <a
              className="cta primary"
              href="https://github.com/gederinruslan-cyber/machine-observatory"
            >
              Follow the build →
            </a>
            <span className="cta-note">
              dossiers &amp; dispatch launching soon
            </span>
          </div>
        </header>

        {/* --------------------------------------------------- stats strip */}
        <section className="strip" aria-label="observatory instruments">
          {stats ? (
            <>
              <div className="stat">
                <span className="stat-n">
                  {integer.format(stats.settlements)}
                </span>
                <span className="stat-l">settlements in the index</span>
              </div>
              <div className="stat">
                <span className="stat-n">{stats.decodedPct.toFixed(1)}%</span>
                <span className="stat-l">decoded from calldata</span>
              </div>
              <div className="stat">
                <span className="stat-n">
                  {integer.format(stats.uniqueSenders)}
                </span>
                <span className="stat-l">facilitator wallets observed</span>
              </div>
              <div className="stat live">
                <span className="stat-n">
                  <span className="pulse" aria-hidden /> live
                </span>
                <span className="stat-l">telescope on Base mainnet</span>
              </div>
            </>
          ) : (
            <>
              <div className="stat">
                <span className="stat-n">~600k</span>
                <span className="stat-l">agent payments per day on Base</span>
              </div>
              <div className="stat">
                <span className="stat-n">357k+</span>
                <span className="stat-l">registered agent identities</span>
              </div>
              <div className="stat">
                <span className="stat-n">30+</span>
                <span className="stat-l">facilitator operators</span>
              </div>
              <div className="stat calibrating">
                <span className="stat-n">
                  <span className="pulse" aria-hidden /> calibrating
                </span>
                <span className="stat-l">telescope warming up</span>
              </div>
            </>
          )}
        </section>

        {/* ------------------------------------------------------- pillars */}
        <section className="pillars">
          <h2 className="section-title">
            What the observatory <em>publishes</em>
          </h2>
          <div className="pillar-grid">
            {PILLARS.map((p) => (
              <article className="pillar" key={p.n}>
                <div className="pillar-head">
                  <span className="pillar-n">{p.n}</span>
                  <span className="pillar-status">{p.status}</span>
                </div>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* -------------------------------------------------- how it works */}
        <section className="wire">
          <h2 className="section-title">
            The <em>instrument</em>
          </h2>
          <div className="wire-row">
            <div className="wire-node">
              <span className="wire-k">Base mainnet</span>
              <span className="wire-v">
                x402 settlements · ERC-8004 registries
              </span>
            </div>
            <span className="wire-arrow" aria-hidden>
              ───▸
            </span>
            <div className="wire-node">
              <span className="wire-k">the index</span>
              <span className="wire-v">
                every payment recorded, classified by join — never filtered at
                the source
              </span>
            </div>
            <span className="wire-arrow" aria-hidden>
              ───▸
            </span>
            <div className="wire-node">
              <span className="wire-k">the journal</span>
              <span className="wire-v">
                dossiers · narrated feed · weekly dispatch
              </span>
            </div>
          </div>
          <p className="wire-note">
            Counts reconciled daily against independent public sources. When our
            numbers and the chain disagree, the chain wins and we say so.
          </p>
        </section>

        {/* -------------------------------------------------------- footer */}
        <footer className="footer">
          <p className="footer-thesis">
            The machine economy will not introduce itself.
          </p>
          <div className="footer-row">
            <a href="https://github.com/gederinruslan-cyber/machine-observatory">
              github
            </a>
            <span className="footer-sep">·</span>
            <span>x402 · ERC-8004 · Base</span>
            <span className="footer-sep">·</span>
            <span>© 2026 Machine Observatory</span>
          </div>
        </footer>
      </main>
    </>
  );
}
