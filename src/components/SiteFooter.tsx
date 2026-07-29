import Link from "next/link";

/**
 * App shell footer (LAUNCH-001 §4) — legal links + support contact. Static,
 * no client state; rendered on every page via the root layout.
 */
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <span className="muted">© {new Date().getFullYear()} Spine</span>
      <nav className="site-footer-links">
        <Link className="navlink" href="/pricing">
          Pricing
        </Link>
        <Link className="navlink" href="/terms">
          Terms
        </Link>
        <Link className="navlink" href="/privacy">
          Privacy
        </Link>
        <a className="navlink" href="mailto:annthuy64@gmail.com">
          Contact
        </a>
      </nav>
    </footer>
  );
}
