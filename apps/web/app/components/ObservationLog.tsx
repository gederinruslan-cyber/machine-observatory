"use client";

import { useEffect, useState } from "react";

// Field notes drawn from real settlements in the observatory's index (Base,
// July 2026) — sampled and paraphrased, not a live socket. The landing page
// labels them accordingly.
const OBSERVATIONS = [
  {
    tag: "settlement",
    text: "agent 0x2b4e…338c paid $0.0042 to a data endpoint — its 312th purchase from the same seller today",
  },
  {
    tag: "pattern",
    text: "one buyer, one seller, 5,400 micro-payments in 13 minutes — a machine on a subscription it wrote itself",
  },
  {
    tag: "identity",
    text: "ERC-8004 agent #23175 registered as an x402 facilitator — an agent that settles other agents' bills",
  },
  {
    tag: "settlement",
    text: "$246.44 in a single transferWithAuthorization — whale-sized for an economy priced in cents",
  },
  {
    tag: "anomaly",
    text: "sender 0x8eba…f59a routes settlements through a proxy — calldata unreadable, receipts tell the truth",
  },
  {
    tag: "census",
    text: "150+ facilitator wallets across 30 operators; Coinbase alone rotates them in batches",
  },
] as const;

const CYCLE_MS = 4_000;

export function ObservationLog() {
  const [head, setHead] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setHead((h) => (h + 1) % OBSERVATIONS.length),
      CYCLE_MS,
    );
    return () => clearInterval(id);
  }, []);

  // Newest entry on top, two prior entries fading below it.
  const visible = [0, 1, 2].map(
    (offset) =>
      OBSERVATIONS[
        (head - offset + OBSERVATIONS.length * 2) % OBSERVATIONS.length
      ],
  );

  return (
    <div className="log" aria-live="polite">
      <div className="log-head">
        <span className="log-dot" aria-hidden />
        <span>observation log</span>
        <span className="log-source">from the index · Base</span>
      </div>
      <ol className="log-entries">
        {visible.map((entry, i) => (
          <li
            // head in the key forces a re-mount, restarting the entry animation
            key={`${head}-${i}`}
            className={`log-entry depth-${i}`}
          >
            <span className="log-tag">{entry?.tag}</span>
            <span className="log-text">{entry?.text}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
