import Link from "next/link";

export const metadata = { title: "Terms of Service — Spine" };

const heading: React.CSSProperties = {
  fontFamily: "var(--font-fraunces), serif",
  fontWeight: 500,
  fontSize: 18,
  marginTop: 28,
  marginBottom: 8,
};

/** Public, unauthenticated static page (LAUNCH-001 §4). */
export default function TermsPage() {
  return (
    <main style={{ paddingBottom: 60 }}>
      <div className="panel-h">
        <h2>Terms of Service</h2>
      </div>
      <div style={{ maxWidth: 640 }}>
        <p className="muted" style={{ marginBottom: 20 }}>
          Last updated: July 29, 2026
        </p>

        <p>
          These Terms govern your use of Spine (&ldquo;the Service&rdquo;), a
          web app for building, saving, and running Pilates classes, operated by
          Spine (&ldquo;we&rdquo;, &ldquo;us&rdquo;). By creating an account or
          otherwise using the Service, you agree to these Terms.
        </p>

        <h3 style={heading}>The Service</h3>
        <p>
          Spine lets you assemble a Mat or Reformer Pilates class from a curated
          exercise library, save it to your account, and run it with a guided
          on-screen timer. A Free plan is available with a limited number of
          saved classes; a paid Pro plan (billed via Stripe) removes that limit
          and unlocks PDF export and share-by-link.
        </p>

        <h3 style={heading}>Accounts</h3>
        <p>
          You sign in with a GitHub or Google account. You&apos;re responsible
          for keeping that account secure and for all activity under your Spine
          account. You must be at least 16 years old to use the Service.
        </p>

        <h3 style={heading}>Subscriptions and billing</h3>
        <p>
          Pro plan subscriptions are billed on a recurring (monthly or annual)
          basis through Stripe, our payment processor. You can cancel any time
          from the Billing page — cancellation takes effect at the end of the
          current billing period, and access reverts to the Free plan afterward.
          Fees are non-refundable except where required by law.
        </p>

        <h3 style={heading}>Your content</h3>
        <p>
          The exercise library is provided by Spine. Class names and the
          sequences you build from that library (&ldquo;your classes&rdquo;) are
          yours — you can export, share, or delete them at any time, subject to
          your plan&apos;s features. We don&apos;t claim ownership over your
          classes and only access them to operate and support the Service.
        </p>

        <h3 style={heading}>Acceptable use</h3>
        <p>
          Don&apos;t use the Service to violate the law, infringe others&apos;
          rights, attempt to disrupt or gain unauthorized access to the Service,
          or scrape/reproduce the exercise library for a competing product.
        </p>

        <h3 style={heading}>Instructional content disclaimer</h3>
        <p>
          Spine provides exercise descriptions and class-planning tools for
          instructors; it is not a substitute for qualified Pilates teacher
          training or medical advice. You&apos;re responsible for teaching
          safely and adapting classes to your students&apos; needs.
        </p>

        <h3 style={heading}>Termination</h3>
        <p>
          You may stop using the Service and request deletion of your account at
          any time (see{" "}
          <Link className="navlink" href="/privacy">
            Privacy Policy
          </Link>
          ). We may suspend or terminate accounts that violate these Terms.
        </p>

        <h3 style={heading}>Disclaimers and liability</h3>
        <p>
          The Service is provided &ldquo;as is&rdquo; without warranties of any
          kind. To the extent permitted by law, Spine is not liable for
          indirect, incidental, or consequential damages arising from your use
          of the Service.
        </p>

        <h3 style={heading}>Changes to these Terms</h3>
        <p>
          We may update these Terms occasionally. Continued use of the Service
          after an update constitutes acceptance of the revised Terms.
        </p>

        <h3 style={heading}>Contact</h3>
        <p>
          Questions about these Terms:{" "}
          <a className="navlink" href="mailto:annthuy64@gmail.com">
            annthuy64@gmail.com
          </a>
          .
        </p>
      </div>
    </main>
  );
}
