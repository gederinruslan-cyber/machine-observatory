import { defineConfig } from "vitest/config";

// Unit tests only: pg is stubbed at the module boundary — no live database
// (quality spec: "Worker and shared-constants unit tests").
export default defineConfig({
  test: {
    name: "worker",
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
