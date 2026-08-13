import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

import { env } from "~/env";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { subscriptions } from "~/server/db/schema";
import { FREE_CLASS_LIMIT, getPlan } from "~/server/billing/entitlements";
import { getStripe } from "~/server/billing/stripe";

/** Only allow checkout against prices we actually configured — never trust
 * an arbitrary client-supplied Stripe price id. */
function allowedPriceIds(): string[] {
  return [env.STRIPE_PRICE_ID_PRO_MONTHLY, env.STRIPE_PRICE_ID_PRO_ANNUAL].filter(
    (id): id is string => !!id,
  );
}

/** Best-effort origin for Stripe redirect URLs — the `origin` header (sent by
 * both `fetch` mutations and standard `<form>` POSTs), falling back to the
 * configured site URL. */
function originFrom(headers: Headers): string {
  return headers.get("origin") ?? env.AUTH_URL ?? "http://localhost:3000";
}

export const billingRouter = createTRPCRouter({
  /** The signed-in caller's current plan/status/renewal date. */
  getPlan: protectedProcedure.query(async ({ ctx }) => {
    const plan = await getPlan(ctx.session.user.id);
    return { ...plan, freeClassLimit: FREE_CLASS_LIMIT };
  }),

  /** Creates a Stripe Checkout Session for the signed-in user, returns its URL. */
  createCheckoutSession: protectedProcedure
    .input(z.object({ priceId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      if (!allowedPriceIds().includes(input.priceId)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown plan." });
      }

      const userId = ctx.session.user.id;
      const origin = originFrom(ctx.headers);

      try {
        const stripe = getStripe();
        const existing = await ctx.db.query.subscriptions.findFirst({
          where: eq(subscriptions.userId, userId),
        });
        const customerId =
          existing?.stripeCustomerId ??
          (
            await stripe.customers.create({
              email: ctx.session.user.email ?? undefined,
              metadata: { userId },
            })
          ).id;

        const checkoutSession = await stripe.checkout.sessions.create({
          mode: "subscription",
          customer: customerId,
          client_reference_id: userId,
          line_items: [{ price: input.priceId, quantity: 1 }],
          subscription_data: { metadata: { userId } },
          success_url: `${origin}/account/billing?checkout=success`,
          cancel_url: `${origin}/pricing?checkout=canceled`,
        });

        if (!checkoutSession.url) {
          throw new Error("Stripe did not return a Checkout URL");
        }
        return { url: checkoutSession.url };
      } catch (err) {
        console.error("[billing] createCheckoutSession failed", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Couldn't start checkout — try again.",
        });
      }
    }),

  /** Opens the Stripe Customer Portal for the signed-in user, returns its URL. */
  createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    const existing = await ctx.db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, ctx.session.user.id),
    });
    if (!existing?.stripeCustomerId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No billing account found yet — upgrade to Pro first.",
      });
    }

    try {
      const stripe = getStripe();
      const origin = originFrom(ctx.headers);
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: existing.stripeCustomerId,
        return_url: `${origin}/account/billing`,
      });
      return { url: portalSession.url };
    } catch (err) {
      console.error("[billing] createPortalSession failed", err);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Couldn't open the billing portal — try again.",
      });
    }
  }),
});
