import pg from "pg";

// Docker compose default (mirrors repo-root and apps/worker .env.example);
// set DATABASE_URL in the environment everywhere else.
const DEFAULT_DATABASE_URL =
  "postgresql://observatory:observatory@localhost:5439/observatory";

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
});
