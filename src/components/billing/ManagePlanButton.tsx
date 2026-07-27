"use client";

import { useState } from "react";

import { api } from "~/trpc/react";

/** Opens the Stripe Customer Portal (cancel/upgrade/invoices are all
 * Stripe-hosted — no custom billing UI is built in-app). */
export function ManagePlanButton() {
  const [error, setError] = useState<string | null>(null);
  const portal = api.billing.createPortalSession.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: () => setError("Couldn't open the billing portal — try again."),
  });

  return (
    <div>
      <button
        className="signin"
        aria-busy={portal.isPending}
        disabled={portal.isPending}
        onClick={() => {
          setError(null);
          portal.mutate();
        }}
      >
        {portal.isPending ? "Opening…" : "Manage plan"}
      </button>
      {error && (
        <p className="muted" role="alert" style={{ marginTop: 8 }}>
          {error}
        </p>
      )}
    </div>
  );
}
