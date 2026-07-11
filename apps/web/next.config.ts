import path from "node:path";
import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // Monorepo: pin the workspace root so turbopack doesn't infer it from lockfiles.
  turbopack: { root: path.join(import.meta.dirname, "../..") },
};

export default nextConfig;

// Makes Cloudflare bindings available during `next dev` (per @opennextjs/cloudflare docs).
initOpenNextCloudflareForDev();
