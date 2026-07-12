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
      // A hung API must not hold the whole page hostage.
      signal: AbortSignal.timeout(1_500),
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

// Real, verifiable ecosystem milestones — see docs/research/ for sourcing.
const CHRONICLE = [
  {
    date: "dec 2024",
    title: "First light for machine money",
    body: "The earliest known x402 facilitator begins settling agent payments on Base — months before anyone is watching.",
  },
  {
    date: "may 2025",
    title: "Coinbase turns on the rail",
    body: "x402 launches publicly: HTTP 402 quotes, signed USDC authorizations, fee-free settlement on Base through the CDP facilitator.",
  },
  {
    date: "late 2025",
    title: "The PING frenzy",
    body: "A pay-to-mint token drives 150,000+ settlements in its first month; weekly volume spikes over 10,000% before cooling. The machine economy has its first speculative mania.",
  },
  {
    date: "jan 2026",
    title: "Identity arrives",
    body: "ERC-8004 registries deploy to mainnet — the same address on every chain. x402 crosses 100 million cumulative payments on Base the same quarter.",
  },
  {
    date: "apr 2026",
    title: "The standard grows up",
    body: "Coinbase contributes x402 to the Linux Foundation. AWS, Cloudflare, Anthropic and Circle are among 20+ founding members of the x402 Foundation.",
  },
  {
    date: "jun 2026",
    title: "The edge learns to charge",
    body: "AWS CloudFront and Cloudflare ship per-request agent payments at the edge — any website can now charge a machine in USDC.",
  },
  {
    date: "jul 2026",
    title: "First light at the observatory",
    body: "Our telescope opens on Base: every settlement indexed and classified. Dossiers and the narrated feed are on the bench.",
  },
] as const;

export default async function Home() {
  const stats = await fetchStats();

  return (
    <>
      <div className="grain" aria-hidden />

      <nav className="topnav" aria-label="sections">
        <span className="topnav-brand">M·O</span>
        <div className="topnav-links">
          <a href="#field-guide">field guide</a>
          <a href="#chronicle">chronicle</a>
          <a href="#publications">publications</a>
          <a href="#instrument">the instrument</a>
        </div>
        <a
          className="topnav-cta"
          href="https://github.com/gederinruslan-cyber/machine-observatory"
        >
          github ↗
        </a>
      </nav>

      <main className="site">
        {/* ---------------------------------------------------------- hero */}
        <header className="hero">
          <div className="orbits" aria-hidden>
            <span className="ring r1" />
            <span className="ring r2" />
            <span className="ring r3" />
            <span className="carrier c1">
              <span className="body" />
            </span>
            <span className="carrier c2">
              <span className="body amber-body" />
            </span>
            <span className="carrier c3">
              <span className="body" />
            </span>
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

          <div className="cta-row reveal d5">
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

          <div className="hero-log reveal d6">
            <ObservationLog />
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
                <span className="stat-l">
                  settlements indexed · since jul 2026
                </span>
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

        {/* --------------------------------------------------- field guide */}
        <section className="guide" id="field-guide">
          <h2 className="section-title">
            A field guide to the <em>machine economy</em>
          </h2>
          <p className="section-lede">
            Two young protocols make it possible: one moves the money, one names
            the machines. Watching both at once is the whole idea.
          </p>

          <div className="guide-grid">
            <article className="guide-card">
              <div className="guide-plate">
                <span className="guide-name">x402</span>
                <span className="guide-role">the payment rail</span>
              </div>
              <p>
                HTTP has reserved status code <em>402 Payment Required</em>{" "}
                since the nineties. x402 finally uses it: when an agent requests
                a paid API, the server answers with a price quote; the agent
                signs a USDC authorization and retries; a facilitator settles it
                on Base. Sub-cent amounts, seconds to settle — no accounts, no
                cards, no humans.
              </p>
              <pre className="guide-diagram" aria-label="x402 payment flow">
                {`GET /forecast
  ← 402 Payment Required · quote: $0.004 USDC
  → signed authorization · retry
  ← 200 OK · settled on Base`}
              </pre>
              <p className="guide-foot">
                An open standard under the Linux Foundation since April 2026 —
                AWS, Cloudflare, Anthropic and Circle among its members.
              </p>
            </article>

            <article className="guide-card">
              <div className="guide-plate">
                <span className="guide-name">ERC-8004</span>
                <span className="guide-role">the identity layer</span>
              </div>
              <p>
                Three on-chain registries give an agent a portable self:{" "}
                <em>Identity</em> (who it is, what services it offers),{" "}
                <em>Reputation</em> (feedback from the agents and humans it
                traded with), and <em>Validation</em> (third-party
                attestations). Deployed at the same address on every chain.
              </p>
              <pre
                className="guide-diagram"
                aria-label="identity to payments join"
              >
                {`agent #23175
  → identity registry · agent card
  → agentWallet 0x…
  → its x402 payment history`}
              </pre>
              <p className="guide-foot">
                The reserved <em>agentWallet</em> key links an identity to the
                wallet that gets paid — the join that turns raw payments into
                dossiers. It is the seam this observatory is built on.
              </p>
            </article>
          </div>
        </section>

        {/* ----------------------------------------------------- chronicle */}
        <section className="chronicle" id="chronicle">
          <h2 className="section-title">
            The <em>chronicle</em>
          </h2>
          <p className="section-lede">
            A short history of an economy that is eighteen months old. Every
            entry is a real, checkable event.
          </p>
          <ol className="chron-list">
            {CHRONICLE.map((c) => (
              <li className="chron-entry" key={c.date + c.title}>
                <span className="chron-date">{c.date}</span>
                <div className="chron-body">
                  <h3>{c.title}</h3>
                  <p>{c.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* --------------------------------------------- ecosystem numbers */}
        <section className="eco" aria-label="ecosystem figures">
          <div className="eco-grid">
            <div className="eco-stat">
              <span className="eco-n">169M</span>
              <span className="eco-l">payments in x402&apos;s first year</span>
            </div>
            <div className="eco-stat">
              <span className="eco-n">590k</span>
              <span className="eco-l">buyers · 100k sellers</span>
            </div>
            <div className="eco-stat">
              <span className="eco-n">357k+</span>
              <span className="eco-l">registered agent identities</span>
            </div>
            <div className="eco-stat">
              <span className="eco-n">24+</span>
              <span className="eco-l">chains with ERC-8004 registries</span>
            </div>
          </div>
          <p className="eco-note">
            Ecosystem figures as reported by Coinbase and community trackers,
            2026. Distinct from our own index counts above — we only vouch for
            what we&apos;ve measured ourselves.
          </p>
        </section>

        {/* ------------------------------------------------------- pillars */}
        <section className="pillars" id="publications">
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
        <section className="wire" id="instrument">
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
