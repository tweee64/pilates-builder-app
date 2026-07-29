"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Root error boundary (Next.js `global-error.tsx` convention) — catches
 * errors thrown while rendering the root layout itself, which
 * `app/error.tsx` boundaries can't reach. Reports to Sentry when configured
 * (LAUNCH-001 §3) and otherwise degrades to a plain fallback screen.
 * Must render its own <html>/<body> since it replaces the root layout.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 40 }}>
        <h1>Something went wrong</h1>
        <p>Please refresh the page. If this keeps happening, contact us.</p>
      </body>
    </html>
  );
}
