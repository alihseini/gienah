"use client";
import * as React from "react";
import { useInView } from "motion/react";
import { StarField } from "./StarField";
import s from "./productsBackdrop.module.css";

/* Products — Cosmic Glass / Aurora backdrop (Step 1).
 * A restrained, product-focused cosmic background for the Products section.
 * Layers are pure CSS (productsBackdrop.module.css); the only JS is Motion's
 * useInView (IntersectionObserver, once) which softly intensifies the aurora /
 * glass / rim on viewport-enter via the data-lit attribute — no scroll
 * listeners, no continuous measurement. Sits behind the product content. */
export function ProductsBackdrop() {
  const ref = React.useRef<HTMLDivElement>(null);
  const lit = useInView(ref, { once: true, amount: 0.25, margin: "0px 0px -10% 0px" });
  return (
    <div ref={ref} aria-hidden="true" className={s.backdrop} {...(lit ? { "data-lit": "" } : {})}>
      <div className={s.aurora} />
      <div className={s.glass} />
      <StarField className={s.prodStars} density={5200} maxCount={340} shadow={false} constellations={false} shooting={false} />
      <div className={s.rim} />
    </div>
  );
}
