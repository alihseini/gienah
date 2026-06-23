import React from "react";
import a from "./heroAtmosphere.module.css";

/* Subtle brand-colored aurora glow behind the hero star field + constellation.
   Decorative only. Layers are wrapped so the Hero can apply gentle pointer
   parallax via a forwarded ref. */
export const HeroAtmosphere = React.forwardRef<HTMLDivElement>(function HeroAtmosphere(_props, ref) {
  return (
    <div ref={ref} className={a.atmosphere} aria-hidden="true">
      <div className={[a.layer, a.aura].join(" ")} />
      <div className={[a.layer, a.cool].join(" ")} />
      <div className={[a.layer, a.band].join(" ")} />
    </div>
  );
});
