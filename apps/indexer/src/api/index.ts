import { Hono } from "hono";

// Internal use only — Ponder serves /health, /ready, /metrics natively.
// Product endpoints live in apps/api (architecture spec: "API decoupled from indexer").
const app = new Hono();

app.get("/", (c) => c.text("machine-observatory indexer"));

export default app;
