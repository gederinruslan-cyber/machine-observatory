-- Enrichment schema: owned exclusively by apps/worker (see openspec architecture spec,
-- "Two schema domains"). Chain-fact schemas are created and managed by Ponder.
CREATE SCHEMA IF NOT EXISTS enrichment;
