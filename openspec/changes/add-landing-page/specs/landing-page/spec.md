# Spec delta: landing-page (add-landing-page)

## ADDED Requirements

### Requirement: Landing page narrative structure
The home page SHALL present, in order: a hero stating the product thesis with an
observation-log visual, a stats strip, three product pillars (profiles, narrated feed,
weekly dispatch), a how-it-works strip, and a call-to-action with footer.

#### Scenario: First visit
- **WHEN** a visitor loads /
- **THEN** the thesis, live stats strip, and observation log are visible without scrolling
  on a desktop viewport

### Requirement: Honest live data with graceful degradation
The stats strip SHALL render server-side from the API /stats endpoint. When the API is
unreachable the page SHALL still render fully, replacing live numbers with a calibrating
state. Observation-log entries SHALL be labeled as observatory-log samples, not presented
as a live websocket feed.

#### Scenario: API offline
- **WHEN** /stats is unreachable at render time
- **THEN** the page renders completely with a "calibrating" stats state and no error

### Requirement: Visual identity tokens
The visual identity (ink/paper/phosphor/amber palette, Fraunces + IBM Plex Mono via
next/font, grain and hairline motifs) SHALL be defined as CSS variables in globals.css
for reuse by future pages. Motion SHALL respect prefers-reduced-motion.

#### Scenario: Reduced motion
- **WHEN** the visitor has prefers-reduced-motion set
- **THEN** orbital rotation, pulsing, and reveal animations are disabled

### Requirement: Dependency discipline
The landing page SHALL add no UI-kit or animation-library dependencies; fonts load via
next/font (build-time, self-hosted) and interactivity is limited to one small client
component.

#### Scenario: Bundle review
- **WHEN** the change is reviewed
- **THEN** package.json gains no new runtime dependencies
