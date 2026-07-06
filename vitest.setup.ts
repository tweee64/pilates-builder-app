import process from "node:process";

// Load .env into process.env for standalone `vitest` runs (Next.js's own
// dev/build pipeline loads it automatically, but a bare vitest process
// doesn't). Safe no-op if .env doesn't exist (e.g. CI without a local DB) —
// DB-backed integration tests self-skip via `describe.skipIf`.
try {
  process.loadEnvFile(".env");
} catch {
  // no .env present — fine, non-DB tests don't need it
}
