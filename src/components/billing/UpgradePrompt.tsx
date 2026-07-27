import Link from "next/link";

type UpgradePromptProps = {
  message: string;
};

/**
 * Inline, always-visible advisory (not dismissible — it reflects a real
 * blocking constraint) pointing at `/pricing`. Reuses the existing
 * `.tip.show` inline-banner pattern (SavePanel's migration prompt) rather
 * than introducing a new visual language.
 */
export function UpgradePrompt({ message }: UpgradePromptProps) {
  return (
    <div className="tip show" role="status">
      <span className="ic">◆</span>
      <span>
        {message}{" "}
        <Link
          href="/pricing"
          style={{
            color: "var(--sage-deep)",
            fontWeight: 600,
            textDecoration: "underline",
          }}
        >
          Upgrade to Pro
        </Link>
      </span>
    </div>
  );
}
