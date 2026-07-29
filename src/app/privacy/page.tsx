export const metadata = { title: "Privacy Policy — Spine" };

const heading: React.CSSProperties = {
  fontFamily: "var(--font-fraunces), serif",
  fontWeight: 500,
  fontSize: 18,
  marginTop: 28,
  marginBottom: 8,
};

/** Public, unauthenticated static page (LAUNCH-001 §4). */
export default function PrivacyPage() {
  return (
    <main style={{ paddingBottom: 60 }}>
      <div className="panel-h">
        <h2>Privacy Policy</h2>
      </div>
      <div style={{ maxWidth: 640 }}>
        <p className="muted" style={{ marginBottom: 20 }}>
          Last updated: July 29, 2026
        </p>

        <p>
          This page describes what data Spine collects when you use the app,
          why, and how you can have it deleted.
        </p>

        <h3 style={heading}>What we collect</h3>
        <ul style={{ paddingLeft: 20, lineHeight: 1.7 }}>
          <li>
            <strong>Identity</strong> — your name, email address, and provider
            account ID, from whichever OAuth provider you sign in with (GitHub
            or Google). We never see or store your GitHub/Google password.
          </li>
          <li>
            <strong>Your classes</strong> — the class names, exercise
            selections, order, and durations you save, tied to your account.
          </li>
          <li>
            <strong>Billing identifiers</strong> — if you upgrade to Pro, your
            Stripe customer ID, subscription ID, and subscription status
            (active/past due/canceled). We do not receive or store your card
            number — Stripe&apos;s hosted Checkout and Customer Portal handle
            payment details directly.
          </li>
          <li>
            <strong>Session data</strong> — a sign-in session cookie used only
            to keep you authenticated; no advertising or cross-site tracking
            cookies are set.
          </li>
        </ul>

        <h3 style={heading}>How we use it</h3>
        <p>
          To operate the Service: authenticate you, save/load your classes,
          enforce your plan&apos;s limits, process Pro subscription billing, and
          — if you contact us — respond to support requests. We do not sell your
          data or use it for advertising.
        </p>

        <h3 style={heading}>Who we share it with</h3>
        <p>
          We use a small number of service providers to run Spine, each of whom
          only receives the data needed to perform their function:
        </p>
        <ul style={{ paddingLeft: 20, lineHeight: 1.7 }}>
          <li>
            <strong>GitHub / Google</strong> — for OAuth sign-in.
          </li>
          <li>
            <strong>Stripe</strong> — for processing Pro subscription payments.
          </li>
          <li>
            <strong>Neon</strong> — our Postgres database host, where account
            and class data is stored.
          </li>
          <li>
            <strong>Vercel</strong> — our application hosting provider.
          </li>
          <li>
            <strong>Upstash</strong> — rate-limiting infrastructure that sees a
            hashed request identifier, not class content.
          </li>
          <li>
            <strong>Sentry</strong> — error monitoring, used to diagnose
            crashes/bugs; error reports may include technical request details
            but are not used for tracking.
          </li>
        </ul>

        <h3 style={heading}>Data retention and deletion</h3>
        <p>
          We keep your account and class data for as long as your account is
          active. To request deletion of your account and associated data
          (including cancellation of any active subscription), email{" "}
          <a className="navlink" href="mailto:annthuy64@gmail.com">
            annthuy64@gmail.com
          </a>{" "}
          from the email address on your account. We&apos;ll confirm once
          deletion is complete.
        </p>

        <h3 style={heading}>Your rights</h3>
        <p>
          You can ask us at any time to access, correct, or delete the personal
          data we hold about you, using the contact below.
        </p>

        <h3 style={heading}>Changes to this policy</h3>
        <p>
          We may update this policy occasionally; the &ldquo;Last updated&rdquo;
          date above reflects the most recent revision.
        </p>

        <h3 style={heading}>Contact</h3>
        <p>
          Privacy questions or requests:{" "}
          <a className="navlink" href="mailto:annthuy64@gmail.com">
            annthuy64@gmail.com
          </a>
          .
        </p>
      </div>
    </main>
  );
}
