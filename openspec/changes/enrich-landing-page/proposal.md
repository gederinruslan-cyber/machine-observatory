# Proposal: enrich-landing-page

## Why

The landing states the thesis but doesn't teach or prove anything: a visitor who doesn't
already know x402/ERC-8004 gets no explanation, and there's no sense that this ecosystem
has history and momentum. Richer content = longer dwell time, more shares, more credibility.

## What Changes

- Add a **field guide** section: what x402 and ERC-8004 are, explained in the journal
  voice with mono mini-diagrams (402 payment flow; identity/reputation/validation
  registries). Facts sourced from docs/research/.
- Add a **chronicle** section: dated, real ecosystem milestones (first settlements
  Dec 2024 → Coinbase launch May 2025 → PING frenzy late 2025 → 100M payments &
  ERC-8004 mainnet Jan 2026 → Linux Foundation Apr 2026 → AWS/Cloudflare edge GA
  Jun 2026 → observatory first light Jul 2026).
- Add an **ecosystem numbers band** (169M payments yr-1, 590k buyers, 100k sellers,
  357k identities) explicitly labeled as ecosystem-reported figures — visually and
  verbally distinct from our own index stats (credibility rule).
- Add a slim sticky anchor nav (field guide / chronicle / pillars) in the masthead style.
- Keep: existing hero, observation log, live stats strip, pillars, wire, footer.

## Capabilities

### Modified Capabilities
- `landing-page`: adds content-section requirements (field guide accuracy, chronicle
  sourcing, ecosystem-vs-index separation, anchor navigation).

## Impact

- apps/web only (page.tsx, globals.css; possibly small components). No new runtime deps.
- Chain facts in copy must trace to docs/research/ (chain-reviewer applies to prose too).
