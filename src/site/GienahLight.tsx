"use client";
import * as React from "react";
import { useInView } from "motion/react";
import s from "./gienahLight.module.css";

/* Gienah Light Signature.
 * A local, star-identity light source placed behind a section's content. It
 * stays quiet until the section scrolls into view, then activates once: a
 * blue-white star core, a cyan halo wash, a cross lens-flare, and a soft bloom
 * (all in CSS — see gienahLight.module.css). The only JS is Motion's useInView
 * (IntersectionObserver, fires once) to toggle the activation — no scroll
 * listeners, no continuous measurement.
 *
 * Place it as the first child of a position:relative section, before the content
 * layer (which should sit at a higher z-index). */

type Pos = "center" | "top" | "rim" | "left" | "diagonal" | "bottom";
type Tone = "blue" | "gold" | "mixed";
type Size = "sm" | "md" | "lg";

const POS: Record<Pos, string> = {
  center: s.posCenter,
  top: s.posTop,
  rim: s.posRim,
  left: s.posLeft,
  diagonal: s.posDiagonal,
  bottom: s.posBottom,
};
const TONE: Record<Tone, string> = { blue: "", gold: s.toneGold, mixed: s.toneMixed };
const SIZE: Record<Size, string> = { sm: s.sm, md: "", lg: s.lg };

export function GienahLight({
  pos = "center",
  tone = "blue",
  size = "md",
  flare = true,
  twinkle = false,
  strong = false,
  className,
  style,
}: {
  pos?: Pos;
  tone?: Tone;
  size?: Size;
  /** show the cross lens-flare (a focal accent; off for soft wash/rim glows) */
  flare?: boolean;
  /** very subtle settled twinkle (Hero / Contact only) */
  twinkle?: boolean;
  /** brighter quiet floor (final-stage sections) */
  strong?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  // once: true → activates a single time and never darkens again.
  const lit = useInView(ref, { once: true, amount: 0.3, margin: "0px 0px -12% 0px" });
  const cls = [
    s.sig,
    POS[pos],
    TONE[tone],
    SIZE[size],
    strong ? s.strong : "",
    twinkle ? s.twinkleOn : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div ref={ref} aria-hidden="true" className={cls} style={style} {...(lit ? { "data-lit": "" } : {})}>
      <div className={s.halo} />
      <div className={s.star}>
        <div className={s.bloom} />
        {flare ? <div className={s.flare} /> : null}
        <div className={s.core} />
      </div>
    </div>
  );
}
