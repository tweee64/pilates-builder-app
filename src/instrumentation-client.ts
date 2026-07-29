// Client-side Sentry init (Next.js `instrumentation-client.ts` convention —
// required instead of `sentry.client.config.ts` when using Turbopack, which
// this repo's `dev` script does via `next dev --turbo`).
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
//
// LAUNCH-001: no-ops safely when NEXT_PUBLIC_SENTRY_DSN is unset — nothing to
// configure until a Sentry project/DSN is provisioned.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1,
  // Don't spam Sentry with noise while there's no DSN configured.
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});

// Required by the SDK to instrument client-side route transitions.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
