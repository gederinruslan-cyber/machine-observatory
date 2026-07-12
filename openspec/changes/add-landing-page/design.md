# Design: landing page

## Context

Audience: crypto/AI twitter, developers, journalists — people deciding in 10 seconds
whether this project is interesting. The brand is "the naturalist's field journal of the
machine economy": narrative authority over raw dashboards.

## Goals / Non-Goals

**Goals:** memorable visual identity; honest live data where we have it; fast (no UI kits,
no client-side data waterfalls); a base layer future pages inherit.

**Non-Goals:** email capture backend (dispatch signup comes with the digest change);
navigation/multi-page IA; light theme.

## Decisions

1. **Aesthetic: night observatory field journal.** Ink sky (#0A0D12), aged paper text
   (#E9E2D0), phosphor green (#8CE99A) for instrument/live data, amber (#E2A65C) for
   editorial emphasis. Fraunces (variable, optical-size serif — editorial voice) via
   next/font; IBM Plex Mono for data/labels (thematically right: machines). No Inter,
   no purple gradients.
2. **Hero = claim + instrument.** Left: oversized serif headline making the thesis
   ("AI agents are paying each other right now… somebody should be watching").
   Right: observation log card — monospace narrated settlement lines cycling in a small
   client component. Entries are REAL observations from our indexed data (micro-USDC
   payments, CDP facilitators), labeled "from the observatory log", not fabricated
   real-time claims.
3. **Live stats strip** reuses the existing server-side /stats fetch + offline
   degradation ("telescope calibrating" state). Numbers render even when API is down —
   copy just switches from live to descriptive.
4. **Motion budget:** one orchestrated load reveal (staggered), slow orbital rotation
   (120s CSS), pulsing agent dots, feed cycling. CSS-only; the sole client component is
   the log cycler. prefers-reduced-motion honored.
5. **Atmosphere:** SVG turbulence grain overlay (~4% opacity), concentric dashed orbit
   rings as the hero backdrop, hairline rules (rgba paper 12%) as the structural motif.

## Risks / Trade-offs

- [Fraunces/Plex Mono via Google Fonts at build] → next/font self-hosts at build time;
  no runtime third-party requests.
- [Sample log entries could read as fake live data] → explicit "from the observatory log"
  caption + timestamps as relative descriptions, not fake clocks.

## Open Questions

- none blocking; dispatch signup deliberately deferred.
