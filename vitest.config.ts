import { defineConfig } from "vitest/config";

// Projects mode: `pnpm test` at the root runs every package's suite with one
// reporter; each package keeps its own vitest.config.ts so `pnpm --filter`
// runs stay possible (quality spec: unit tests).
export default defineConfig({
  test: {
    projects: ["apps/indexer", "apps/worker", "apps/api", "packages/shared"],
  },
});
