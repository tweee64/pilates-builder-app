import Stripe from "stripe";

import { env } from "~/env";

const globalForStripe = globalThis as unknown as { stripe: Stripe | undefined };

/**
 * Lazily constructs the Stripe client so importing this module (transitively,
 * via the `billing` tRPC router which is always registered in `root.ts`)
 * doesn't crash the whole app when `STRIPE_SECRET_KEY` isn't configured
 * (e.g. local/dev without a Stripe account set up yet).
 */
export function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured — Stripe billing features are unavailable.",
    );
  }
  globalForStripe.stripe ??= new Stripe(env.STRIPE_SECRET_KEY);
  return globalForStripe.stripe;
}
