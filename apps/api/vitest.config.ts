import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

// SWC transform (reads tsconfig.json) so NestJS decorator metadata survives —
// esbuild, vitest's default, cannot emit design:paramtypes for DI.
export default defineConfig({
  test: {
    name: "api",
    environment: "node",
    include: ["test/**/*.e2e-spec.ts"],
  },
  plugins: [swc.vite({ module: { type: "es6" } })],
});
