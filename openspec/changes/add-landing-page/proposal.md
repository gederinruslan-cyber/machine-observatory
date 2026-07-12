# Proposal: add-landing-page

## Why

The web app is a bare status card. Before the product pillars land we need a landing page
that tells the story — what the observatory is, why it matters — and starts collecting an
audience (GitHub, future dispatch). It is also the visual foundation the profile/feed pages
will inherit.

## What Changes

- Replace the status-card home page with a rich landing page: editorial hero with live
  orbital visual, live stats strip (from apps/api /stats), narrated observation log,
  three product pillars, how-it-works strip, CTA + footer.
- Establish the visual identity ("night observatory field journal"): Fraunces serif +
  IBM Plex Mono, ink/paper/phosphor/amber palette, grain + orbital motion, CSS variables.
- Keep the existing contract: server-side fetch of /stats with graceful offline state;
  dependency-light (fonts via next/font, plain CSS, one small client component).

## Capabilities

### New Capabilities
- `landing-page`: public landing page content, live-data behavior, degradation rules,
  and visual-identity tokens.

### Modified Capabilities
<!-- none -->

## Impact

- apps/web only: layout.tsx (fonts/metadata), page.tsx (landing), globals.css (identity),
  one client component (observation log). No API or schema changes.
- Quality gates unchanged and must stay green (lint, format, typecheck, build).
