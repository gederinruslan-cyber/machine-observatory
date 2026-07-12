# Spec delta: landing-page (enrich-landing-page)

## ADDED Requirements

### Requirement: Protocol field guide
The landing page SHALL include a field-guide section explaining x402 and ERC-8004 in
plain language with visual flow aids. Every protocol claim SHALL be consistent with
docs/research/ ground truth.

#### Scenario: Newcomer comprehension
- **WHEN** a visitor with no x402/ERC-8004 knowledge reads the field guide
- **THEN** they can state what each protocol does and how the two connect (identity ↔
  payments)

### Requirement: Chronicle of real events
The landing page SHALL include a dated timeline of ecosystem milestones. Every entry
SHALL be a real, verifiable event; no invented news. The observatory's own launch MAY
appear as the latest entry.

#### Scenario: Fact check
- **WHEN** any chronicle entry is checked against public sources or docs/research/
- **THEN** the date and claim hold

### Requirement: Ecosystem figures separated from index figures
Ecosystem-level numbers (reported by third parties) SHALL be visually and verbally
distinguished from the observatory's own index stats, with an attribution note.

#### Scenario: No number collisions
- **WHEN** ecosystem figures and index figures appear on the same page
- **THEN** each is labeled with its source scope and no two figures appear to contradict

### Requirement: Anchor navigation
A slim navigation SHALL provide anchor links to the major sections and remain usable
at mobile widths.

#### Scenario: Jump to section
- **WHEN** a visitor clicks a nav anchor
- **THEN** the page scrolls to that section
