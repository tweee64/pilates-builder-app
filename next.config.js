/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";
import { withSentryConfig } from "@sentry/nextjs";

// LAUNCH-001: baseline security headers, applied to every route.
// - `script-src`/`style-src` need 'unsafe-inline' because Next's App Router
//   streams RSC payloads via inline `<script>` tags and Tailwind/next/font
//   inject inline styles — there's no external script/style source to lock
//   out here.
// - No external image/font/API origins are loaded client-side today
//   (avatars are rendered as text initials, fonts are self-hosted via
//   next/font, Stripe Checkout is a full-page link redirect, not fetch/XHR)
//   so `connect-src` can stay 'self'. Widen this if a future change adds a
//   client-side fetch to a new origin.
// - `img-src` allows `authjs.dev`: Auth.js's built-in default sign-in page
//   loads its GitHub/Google button icons from that CDN, not same-origin.
// - `form-action` allows the OAuth provider origins and Stripe: both the
//   sign-in page's form and the pricing page's checkout form POST
//   same-origin (to `/api/auth/signin/[provider]` and `/api/checkout`
//   respectively), but each then redirects the browser to a third-party URL
//   (the provider's authorize URL, or Stripe's hosted Checkout) — browsers
//   enforce `form-action` against the WHOLE redirect chain of a form
//   submission, not just the initial same-origin target, so all of these
//   third-party origins must be explicitly allowlisted here.
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://authjs.dev",
      "font-src 'self' data:",
      "connect-src 'self'",
      "form-action 'self' https://github.com https://accounts.google.com https://checkout.stripe.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
    ].join("; "),
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

/** @type {import("next").NextConfig} */
const config = {
  // Dev-only overlay defaults to bottom-left, which collides with the
  // `.mobile-classbar` sticky bar (also bottom, near-full-width) on phone
  // viewports - move it out of that corner.
  devIndicators: {
    position: "top-right",
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

// Wrapping is safe with no Sentry env configured — the SDK/plugin no-op
// (no source-map upload, no init) when SENTRY_DSN/SENTRY_AUTH_TOKEN are unset.
export default withSentryConfig(config, {
  silent: true,
  // Source-map upload to Sentry only runs in CI/Vercel when SENTRY_AUTH_TOKEN
  // is set; local/dev builds are unaffected.
  widenClientFileUpload: false,
  telemetry: false,
});
