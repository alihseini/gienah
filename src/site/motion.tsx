"use client";
import * as React from "react";
import { motion, useReducedMotion, type Variants, type Transition } from "motion/react";

/* ----------------------------------------------------------------------------
 * Motion primitives — the *interaction* layer only.
 *
 * Small, isolated client components for viewport-entrance reveals, staggered
 * content, and hover/tap feedback. They deliberately do NOT touch the
 * scroll-coupled systems (parallax / sticky decks / layer choreography), which
 * stay hand-rolled rAF + CSS, nor the CSS-module backgrounds, glows, starfields
 * or Three.js visuals.
 *
 * House rules baked in:
 *  - Animate ONLY opacity + transform (no top/left/width/height).
 *  - prefers-reduced-motion: the animation TARGETS are identical whether or not
 *    reduced motion is on — only the transition changes (snap to duration 0) and
 *    hover/tap are dropped. Keeping targets identical is what keeps SSR and the
 *    client hydration markup byte-identical; branching the target (or letting
 *    MotionConfig strip the transform) produces a hydration mismatch (React #418)
 *    because the server can't read the reduced-motion media query.
 *  - Timing matches styles/tokens/motion.css (ease-out, press-scale .98).
 * -------------------------------------------------------------------------- */

// matches --ease-out: cubic-bezier(0.22, 1, 0.36, 1)
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const HOVER_SPRING: Transition = { type: "spring", stiffness: 340, damping: 26, mass: 0.6 };
const TAP_SPRING: Transition = { type: "spring", stiffness: 520, damping: 32 };
const VIEWPORT_AMOUNT = 0.25;

type Tag = "div" | "span" | "li";
const pick = (as: Tag) => (as === "span" ? motion.span : as === "li" ? motion.li : motion.div);

const enterTransition = (reduce: boolean | null, delay = 0): Transition =>
  reduce ? { duration: 0 } : { duration: 0.55, ease: EASE, delay };

const itemVariants = (y: number, reduce: boolean | null): Variants => ({
  hidden: { opacity: 0, y },
  show: { opacity: 1, y: 0, transition: enterTransition(reduce) },
});

/* Container that reveals its children in a stagger when scrolled into view.
   Children opt in by being <StaggerItem> / <Lift asItem> (anything with the
   hidden/show variants); plain children just render. */
export function Stagger({
  children,
  className,
  style,
  gap = 0.09,
  delayChildren = 0.04,
  once = true,
  amount = VIEWPORT_AMOUNT,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  gap?: number;
  delayChildren?: number;
  once?: boolean;
  amount?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      style={style}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: reduce ? 0 : gap, delayChildren: reduce ? 0 : delayChildren } },
      }}
    >
      {children}
    </motion.div>
  );
}

/* A single staggered child (inherits show/hidden from a parent <Stagger>). */
export function StaggerItem({
  children,
  className,
  style,
  as = "div",
  y = 16,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  as?: Tag;
  y?: number;
}) {
  const reduce = useReducedMotion();
  const M = pick(as);
  return (
    <M className={className} style={style} variants={itemVariants(y, reduce)}>
      {children}
    </M>
  );
}

/* Standalone viewport reveal (opacity + small lift), for content not inside a
   <Stagger>. Safe only on elements that are NOT scroll-parallaxed. */
export function FadeIn({
  children,
  className,
  style,
  as = "div",
  y = 16,
  delay = 0,
  once = true,
  amount = 0.3,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  as?: Tag;
  y?: number;
  delay?: number;
  once?: boolean;
  amount?: number;
}) {
  const reduce = useReducedMotion();
  const M = pick(as);
  return (
    <M
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={enterTransition(reduce, delay)}
    >
      {children}
    </M>
  );
}

/* Card-style wrapper: hover lift + tap press, with an optional entrance.
   - asItem: entrance is driven by a parent <Stagger> (variants).
   - otherwise: entrance plays on its own when scrolled into view.
   Hover/tap animate transform only (and are dropped under reduced motion); any
   glow/border comes from CSS :hover so the shadow follows the child's own
   border-radius. */
export function Lift({
  children,
  className,
  style,
  asItem = false,
  hoverY = -6,
  hoverScale = 1.014,
  tapScale = 0.985,
  y = 18,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  asItem?: boolean;
  hoverY?: number;
  hoverScale?: number;
  tapScale?: number;
  y?: number;
}) {
  const reduce = useReducedMotion();
  // Keep the gesture props PRESENT regardless of reduced motion — only neutralise
  // their values (scale 1 / no lift). Toggling the props on/off changes whether
  // Motion adds tabindex to the element, which the server can't predict → a
  // hydration mismatch (React #418). Identical prop shape, different values, is
  // hydration-safe.
  const interaction = {
    whileHover: { y: reduce ? 0 : hoverY, scale: reduce ? 1 : hoverScale, transition: HOVER_SPRING },
    whileTap: { scale: reduce ? 1 : tapScale, transition: TAP_SPRING },
  };
  if (asItem) {
    return (
      <motion.div className={className} style={style} variants={itemVariants(y, reduce)} {...interaction}>
        {children}
      </motion.div>
    );
  }
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={enterTransition(reduce)}
      {...interaction}
    >
      {children}
    </motion.div>
  );
}

/* Tap/press feedback for buttons & links — an inline wrapper so it never
   disturbs flex/inline layout. Hover lift on buttons stays in CSS (btnGlow);
   this only adds the quick press scale (matches --press-scale), and nothing
   under reduced motion. */
export function Press({
  children,
  className,
  style,
  scale = 0.97,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  scale?: number;
}) {
  const reduce = useReducedMotion();
  // whileTap stays present (consistent tabindex / no hydration mismatch); reduced
  // motion just makes the press a no-op (scale 1).
  return (
    <motion.span
      className={className}
      style={{ display: "inline-flex", ...style }}
      whileTap={{ scale: reduce ? 1 : scale }}
      transition={TAP_SPRING}
    >
      {children}
    </motion.span>
  );
}
