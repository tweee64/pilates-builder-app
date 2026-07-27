import type { ReactNode } from "react";

type PricingCardProps = {
  planName: string;
  price: string;
  billingPeriod?: string;
  features: readonly string[];
  /** Marks this as the "recommended" plan — `--honey` accent border, per
   * design (reserved for the one primary upgrade action on this screen). */
  recommended?: boolean;
  cta: ReactNode;
};

/** One plan's card on `/pricing` (Free or Pro). Presentational only — the
 * caller composes the CTA (a `Link` or a Stripe Checkout `<form>`). */
export function PricingCard({
  planName,
  price,
  billingPeriod,
  features,
  recommended = false,
  cta,
}: PricingCardProps) {
  return (
    <div className={`pricing-card${recommended ? "recommended" : ""}`}>
      {recommended && <span className="pricing-badge">Recommended</span>}
      <h3 className="pricing-plan-name">{planName}</h3>
      <p className="pricing-price">
        <span className="mono">{price}</span>
        {billingPeriod && (
          <span className="pricing-period">{billingPeriod}</span>
        )}
      </p>
      <ul className="pricing-features">
        {features.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      <div className="pricing-cta">{cta}</div>
    </div>
  );
}
