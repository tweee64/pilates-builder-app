import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { env } from "~/env";

/**
 * Managed rate limiting (LAUNCH-001 §3) — backed by Upstash Redis so the
 * limit is shared across serverless invocations (a hand-rolled in-memory
 * limiter would not work correctly across Vercel function instances).
 *
 * Fails OPEN (allows the request) when Upstash isn't configured, so the app
 * keeps working in local/dev/preview environments without an Upstash
 * account — configure `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`
 * in production to actually enforce limits.
 */

const ratelimit =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: new Redis({
          url: env.UPSTASH_REDIS_REST_URL,
          token: env.UPSTASH_REDIS_REST_TOKEN,
        }),
        limiter: Ratelimit.slidingWindow(10, "60 s"),
        analytics: false,
        prefix: "spine-ratelimit",
      })
    : null;

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  limit: number;
};

/**
 * Check (and consume) one unit of rate-limit budget for `key`. `key` should
 * identify the caller — e.g. `user:{id}` for an authenticated mutation, or
 * `ip:{address}` for an unauthenticated route.
 */
export async function checkRateLimit(key: string): Promise<RateLimitResult> {
  if (!ratelimit) {
    // Not configured — fail open, matches the repo's existing pattern of
    // failing closed only for actual security boundaries (see Stripe billing
    // in server/billing/entitlements.ts), not for defense-in-depth extras.
    return { success: true, remaining: Infinity, limit: Infinity };
  }

  const { success, remaining, limit } = await ratelimit.limit(key);
  return { success, remaining, limit };
}
