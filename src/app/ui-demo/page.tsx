"use client";

import { useState } from "react";
import { Chip } from "~/components/ui/Chip";
import { Button } from "~/components/ui/Button";
import { IconButton } from "~/components/ui/IconButton";

/**
 * Storybook-less demo of the design-system primitives (plan task 2.4) plus the
 * breathing orb (task 2.3). Not part of the product surface — used to eyeball
 * token fidelity and reduced-motion behavior.
 */
export default function UiDemoPage() {
  const [phase, setPhase] = useState("All");
  const [level, setLevel] = useState("All");

  return (
    <main style={{ paddingBottom: 80 }}>
      <h2 style={{ fontFamily: "var(--font-fraunces)", fontWeight: 500 }}>
        Design system
      </h2>

      <section style={{ marginTop: 20 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          Chips
        </div>
        <div className="chips">
          {["All", "Warm-Up", "Core", "Spine"].map((p) => (
            <Chip
              key={p}
              label={p}
              active={p === phase}
              onClick={() => setPhase(p)}
            />
          ))}
        </div>
        <div className="chips" style={{ marginTop: 8 }}>
          {["All", "Beginner", "Intermediate", "Advanced"].map((l) => (
            <Chip
              key={l}
              label={l}
              variant="level"
              active={l === level}
              onClick={() => setLevel(l)}
            />
          ))}
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          Buttons
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Button variant="run">▶ Run class</Button>
          <Button variant="ghost">Clear</Button>
          <Button variant="ink">Save</Button>
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          Icon buttons
        </div>
        <div className="dur-ctrl">
          <IconButton label="Decrease duration">−</IconButton>
          <span className="v mono">2:00</span>
          <IconButton label="Increase duration">+</IconButton>
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          Tailwind utilities from @theme tokens
        </div>
        {/* These use Tailwind utilities (not the ported .classes) to prove the
            bespoke palette is wired through theme.extend equivalent (@theme). */}
        <div className="flex gap-2">
          <div className="rounded-lg bg-paper-2 px-3 py-2 text-sm text-eucalyptus">
            bg-paper-2 · text-eucalyptus
          </div>
          <div className="rounded-lg bg-pine px-3 py-2 text-sm text-paper">
            bg-pine · text-paper
          </div>
          <div className="rounded-lg bg-honey px-3 py-2 text-sm text-ink">
            bg-honey · text-ink
          </div>
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          Breathing orb (on pine)
        </div>
        <div
          style={{
            background: "var(--pine-deep)",
            borderRadius: 18,
            padding: 20,
            display: "grid",
            placeItems: "center",
          }}
        >
          <div className="orb-wrap">
            <div className="orb-ring" />
            <div className="orb" />
            <div className="breath-label">
              <span className="inh">Inhale</span>
              <span className="exh">Exhale</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
