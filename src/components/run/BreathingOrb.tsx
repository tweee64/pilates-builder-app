/**
 * The breathing orb — pure CSS animation (ported keyframes in globals.css).
 * The inhale/exhale labels cross-fade on the 9s cycle; `prefers-reduced-motion`
 * pins it static via the stylesheet, so this component stays presentational.
 */
export function BreathingOrb() {
  return (
    <div className="orb-wrap" aria-hidden="true">
      <div className="orb-ring" />
      <div className="orb" />
      <div className="breath-label">
        <span className="inh">Inhale</span>
        <span className="exh">Exhale</span>
      </div>
    </div>
  );
}
