// Next.js instrumentation hook — registers Sentry for the server/edge
// runtimes (the client is initialized separately via
// instrumentation-client.ts, per the Next.js/Sentry convention).
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
import type { captureRequestError } from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = async (
  ...args: Parameters<typeof captureRequestError>
) => {
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(...args);
};
