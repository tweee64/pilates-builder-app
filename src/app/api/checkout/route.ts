import { NextResponse } from "next/server";

import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { appRouter } from "~/server/api/root";
import { createCallerFactory } from "~/server/api/trpc";

const createCaller = createCallerFactory(appRouter);

/**
 * Plain (non-tRPC) route so `PricingCard` can POST a standard HTML `<form>`
 * (server-renderable, no client JS required) and land on Stripe's hosted
 * Checkout via a redirect. Delegates the actual Stripe/customer logic to the
 * `billing.createCheckoutSession` tRPC procedure so there's one source of
 * truth for that logic (also used by any client-side caller).
 */
export async function POST(req: Request) {
  const origin = new URL(req.url).origin;
  const session = await auth().catch(() => null);

  if (!session?.user) {
    const callbackUrl = encodeURIComponent("/pricing");
    return NextResponse.redirect(
      `${origin}/api/auth/signin?callbackUrl=${callbackUrl}`,
      303,
    );
  }

  const form = await req.formData().catch(() => null);
  const priceId = form?.get("priceId");
  if (typeof priceId !== "string" || !priceId) {
    return NextResponse.redirect(`${origin}/pricing?error=checkout`, 303);
  }

  // Ensure the Stripe redirect origin is reliable regardless of whether the
  // browser sent an `Origin` header on this form POST.
  const headers = new Headers(req.headers);
  headers.set("origin", origin);
  const caller = createCaller({ db, session, headers });

  try {
    const { url } = await caller.billing.createCheckoutSession({ priceId });
    return NextResponse.redirect(url, 303);
  } catch {
    return NextResponse.redirect(`${origin}/pricing?error=checkout`, 303);
  }
}
