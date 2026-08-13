import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    AUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    // OAuth providers — optional so the app builds/runs with whichever
    // credentials are available; each provider is only wired up when its
    // pair of vars is present (see src/server/auth/config.ts).
    AUTH_GITHUB_ID: z.string().optional(),
    AUTH_GITHUB_SECRET: z.string().optional(),
    AUTH_GOOGLE_ID: z.string().optional(),
    AUTH_GOOGLE_SECRET: z.string().optional(),
    // Canonical site URL for Auth.js callbacks (set to the live HTTPS URL in prod).
    AUTH_URL: z.string().url().optional(),
    DATABASE_URL: z.string().url(),
    // Stripe (MONETIZATION-001) — optional so the app builds/runs without a
    // Stripe account configured; billing routes/procedures fail closed
    // (report a clear error) rather than crash at import time when unset.
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    STRIPE_PRICE_ID_PRO_MONTHLY: z.string().optional(),
    STRIPE_PRICE_ID_PRO_ANNUAL: z.string().optional(),
    // Low-cost test-mode price for exercising the checkout flow end-to-end.
    STRIPE_PRICE_ID_TEST: z.string().optional(),
    // Upstash Redis (LAUNCH-001) — optional; rate limiting fails open
    // (allows the request) when unset, see src/lib/rate-limit.ts.
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
    // Sentry (LAUNCH-001) — optional; error monitoring is disabled (SDK
    // init is skipped) when unset, see sentry.*.config.ts.
    SENTRY_DSN: z.string().optional(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // Sentry (LAUNCH-001) — optional; the browser SDK no-ops when unset.
    NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID,
    AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    AUTH_URL: process.env.AUTH_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_ID_PRO_MONTHLY: process.env.STRIPE_PRICE_ID_PRO_MONTHLY,
    STRIPE_PRICE_ID_PRO_ANNUAL: process.env.STRIPE_PRICE_ID_PRO_ANNUAL,
    STRIPE_PRICE_ID_TEST: process.env.STRIPE_PRICE_ID_TEST,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    SENTRY_DSN: process.env.SENTRY_DSN,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NODE_ENV: process.env.NODE_ENV,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
