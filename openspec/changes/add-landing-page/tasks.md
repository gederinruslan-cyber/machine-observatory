# Tasks: add-landing-page

## 1. Identity foundation
- [x] 1.1 layout.tsx: Fraunces + IBM Plex Mono via next/font, metadata (title, description,
      OpenGraph), fonts exposed as CSS variables
- [x] 1.2 globals.css: identity tokens (ink/paper/phosphor/amber, hairlines, grain),
      motion keyframes, prefers-reduced-motion guards

## 2. Page
- [x] 2.1 Hero: thesis headline, orbital backdrop, observation log card (client cycler,
      real-sample entries), CTA links
- [x] 2.2 Stats strip: server-side /stats with calibrating fallback
- [x] 2.3 Pillars, how-it-works strip, CTA + footer

## 3. Verification
- [x] 3.1 pnpm lint, format:check, typecheck, build all green
- [x] 3.2 Rendered page verified: live-stats state (API up) and calibrating state (API
      down) both render; reduced-motion honored in CSS
- [x] 3.3 openspec validate add-landing-page
