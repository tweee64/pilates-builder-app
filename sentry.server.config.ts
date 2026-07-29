// This file configures the initialization of Sentry on the server.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
//
// LAUNCH-001: no-ops safely when SENTRY_DSN is unset — nothing to configure
// until a Sentry project/DSN is provisioned.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1,
  enabled: !!process.env.SENTRY_DSN,
});
