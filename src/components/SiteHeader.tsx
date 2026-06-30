import Link from "next/link";
import { Suspense } from "react";
import { AccountNav } from "~/components/AccountNav";

/**
 * Base app shell header — Spine wordmark + sage dot + tagline, with the account
 * affordance (sign-in / identity) on the right.
 */
export function SiteHeader() {
  return (
    <header className="top">
      <Link
        href="/builder"
        className="brand"
        style={{ textDecoration: "none" }}
      >
        <h1>Spine</h1>
        <span className="dot" />
        <span className="tag">Build your mat flow, then run it.</span>
      </Link>
      <Suspense
        fallback={<div className="eyebrow">Mat Pilates · class builder</div>}
      >
        <AccountNav />
      </Suspense>
    </header>
  );
}
