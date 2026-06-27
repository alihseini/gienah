"use client";
import * as React from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import s from "./sectionConnector.module.css";

/* SectionConnector — the section-to-section "constellation" link.
 *
 * A single, identical transition zone dropped between two sections. It owns ONLY
 * the line + the two nodes (the surrounding sections are never touched). Reuses
 * the Agile connector's exact visual language: a faint dotted base track, a
 * glowing brand-gradient path that DRAWS with scroll, glowing circle nodes with a
 * gentle pulse, and a flowing light that travels the line as it draws. When the
 * line reaches the incoming (bottom) node it brightens.
 *
 * Performance: the scroll → draw mapping is pure Framer-Motion (useScroll +
 * useTransform → MotionValues). Nothing here calls setState on scroll, so there
 * are no React re-renders while scrolling; only compositor-friendly attributes
 * (pathLength, a translated light dot, opacity) update. Reduced motion → the line
 * is shown fully drawn and static. */

const H = 200;            // connector gap height — identical for every connector
const W = 132;            // svg width (room for the curve + node glow)
const CX = W / 2;
const PAD = 46;           // equal node padding from each gap edge
const TOP_Y = PAD;        // outgoing node (top of the gap)
const BOT_Y = H - PAD;    // incoming node (bottom of the gap)
// subtle Bézier S-curve (never a straight line)
const PATH = `M ${CX} ${TOP_Y} C ${CX - 15} ${TOP_Y + 54}, ${CX + 15} ${BOT_Y - 54}, ${CX} ${BOT_Y}`;

export const SectionConnector = React.memo(function SectionConnector() {
  const ref = React.useRef<HTMLDivElement>(null);
  const pathRef = React.useRef<SVGPathElement>(null);
  const reduce = useReducedMotion();
  const gid = React.useId().replace(/:/g, "");

  // 0 when the gap's top enters the viewport bottom → 1 when its bottom leaves the
  // top. The draw completes a little early so the incoming node lights up just as
  // the next section arrives.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const draw = useTransform(scrollYProgress, [0.12, 0.78], [0, 1]);

  // flowing light: position sampled along the path from the draw progress
  const lenRef = React.useRef(1);
  React.useEffect(() => { if (pathRef.current) lenRef.current = pathRef.current.getTotalLength(); }, []);
  const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const lx = useTransform(draw, (v) => (pathRef.current ? pathRef.current.getPointAtLength(clamp(v) * lenRef.current).x : CX));
  const ly = useTransform(draw, (v) => (pathRef.current ? pathRef.current.getPointAtLength(clamp(v) * lenRef.current).y : TOP_Y));
  const lightOpacity = useTransform(draw, [0, 0.05, 0.9, 1], [0, 1, 1, 0]);
  // incoming node brightens as the drawn line reaches it
  const tipGlow = useTransform(draw, [0.78, 1], [0, 1]);

  const Defs = (
    <defs>
      <linearGradient id={`scg-${gid}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#58ABCE" />
        <stop offset="0.4" stopColor="#2A92CC" />
        <stop offset="0.72" stopColor="#F4C65F" />
        <stop offset="1" stopColor="#E2AA3B" />
      </linearGradient>
    </defs>
  );

  if (reduce) {
    return (
      <div ref={ref} className={s.gap} aria-hidden="true">
        <svg className={s.svg} width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
          {Defs}
          <path className={s.base} d={PATH} />
          <path className={s.draw} d={PATH} stroke={`url(#scg-${gid})`} pathLength={1} />
          <circle className={s.nodeOut} cx={CX} cy={TOP_Y} r={6} />
          <circle className={s.nodeIn} cx={CX} cy={BOT_Y} r={6} />
        </svg>
      </div>
    );
  }

  return (
    <div ref={ref} className={s.gap} aria-hidden="true">
      <svg className={s.svg} width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
        {Defs}
        <path className={s.base} d={PATH} />
        <motion.path ref={pathRef} className={s.draw} d={PATH} stroke={`url(#scg-${gid})`} style={{ pathLength: draw }} />
        {/* flowing light travelling along the line as it draws */}
        <motion.g style={{ x: lx, y: ly, opacity: lightOpacity }}>
          <circle className={s.light} r={3.4} cx={0} cy={0} />
        </motion.g>
        {/* outgoing node (top) — gentle CSS pulse */}
        <circle className={s.nodeOut} cx={CX} cy={TOP_Y} r={6} />
        {/* incoming node (bottom) + a halo that brightens as the line arrives */}
        <circle className={s.nodeIn} cx={CX} cy={BOT_Y} r={6} />
        <motion.circle className={s.tipHalo} cx={CX} cy={BOT_Y} r={10} style={{ opacity: tipGlow }} />
      </svg>
    </div>
  );
});
