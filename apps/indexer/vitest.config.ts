import { defineConfig } from "vitest/config";

// Only the pure decode module is unit-tested; handler wiring (ponder:* virtual
// modules) is exercised by live runs, not unit tests.
export default defineConfig({
  test: {
    name: "indexer",
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
