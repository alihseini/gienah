"use client";
import * as React from "react";
import { motion, useScroll, useTransform, useReducedMotion, useMotionValueEvent } from "motion/react";
import s from "./sectionConnector.module.css";

/* SectionConnector — the section-to-section "constellation" link.
 *
 * One reusable, identical transition zone dropped between two sections. It owns
 * ONLY the line + two nodes; the surrounding sections are never touched. Reuses
 * the Agile connector's visual language (faint dotted base track, glowing
 * brand-gradient drawn path, glowing pulsing circle nodes) plus a flowing light
 * that travels the line as it draws, and an incoming-node brighten on arrival.
 *
 * Geometry: the gap height + node padding come from ONE global variable each
 * (--section-connector-gap / --connector-node-padding). The whole connector is
 * shifted horizontally (dir=left|right) so alternating connectors trace a natural
 * constellation zig-zag. Offset / node size / curve scale per breakpoint.
 *
 * Performance: the gap is measured ONLY on mount + resize (ResizeObserver, rAF
 * coalesced) — never per scroll frame. The scroll → draw mapping is pure Framer
 * Motion (useScroll + useTransform → MotionValues for pathLength, the translated
 * light, opacity), so scrolling triggers NO React re-renders. Offscreen connectors
 * sit idle (their progress is pinned at 0/1, so the transforms never fire).
 * Reduced motion → the line is shown fully drawn and static. */

type Dir = "left" | "right";

// offset as a fraction of the gap width (mobile → almost centred to avoid awkward
// diagonals); node radius (px); bezier control reach as a fraction of the line
// length (curve scales with the now-much-longer path), capped for sanity.
function metricsFor(w: number) {
  if (w >= 1440) return { offset: 0.09, r: 8, curveFrac: 0.2, curveMax: 120 };
  if (w >= 1024) return { offset: 0.07, r: 7, curveFrac: 0.18, curveMax: 100 };
  if (w >= 768) return { offset: 0.05, r: 6, curveFrac: 0.15, curveMax: 78 };
  return { offset: 0.015, r: 5, curveFrac: 0.09, curveMax: 40 };
}

export const SectionConnector = React.memo(function SectionConnector({ dir = "right", onArrive }: { dir?: Dir; onArrive?: () => void }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const pathRef = React.useRef<SVGPathElement>(null);
  const reduce = useReducedMotion();
  const gid = React.useId().replace(/:/g, "");
  const [dim, setDim] = React.useState({ w: 0, h: 0, pad: 40 });

  // measure size + resolved node padding only on mount / resize (ResizeObserver),
  // coalesced into a single rAF — no per-frame DOM reads
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const pad = parseFloat(getComputedStyle(el).paddingTop) || 40; // resolves the clamp() to px
      setDim((d) =>
        d.w === Math.round(r.width) && d.h === Math.round(r.height) && d.pad === Math.round(pad)
          ? d
          : { w: Math.round(r.width), h: Math.round(r.height), pad: Math.round(pad) }
      );
    };
    const ro = new ResizeObserver(() => { if (!raf) raf = requestAnimationFrame(measure); });
    ro.observe(el);
    measure();
    return () => { ro.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, []);

  const { w, h, pad } = dim;
  const m = metricsFor(w);
  const sign = dir === "right" ? 1 : -1;
  const cx = w / 2 + sign * w * m.offset;
  const topY = pad;
  const botY = h - pad;
  const span = Math.max(0, botY - topY);
  // organic S-curve (never straight) — the control reach scales with the line so
  // the longer path keeps an elegant, readable bow
  const curve = Math.min(span * m.curveFrac, m.curveMax);
  const path = w && h ? `M ${cx} ${topY} C ${cx - curve} ${topY + span * 0.34}, ${cx + curve} ${botY - span * 0.34}, ${cx} ${botY}` : "";
  const ready = w > 0 && h > 0;

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const draw = useTransform(scrollYProgress, [0.12, 0.78], [0, 1]);

  // fire onArrive ONCE when the line reaches the destination node (no re-render:
  // listens to the draw MotionValue, guarded by a ref). Also covers a deep-link /
  // refresh that lands already past the connector (initial value check).
  const arrivedRef = React.useRef(false);
  const fire = React.useCallback(() => {
    if (arrivedRef.current) return;
    arrivedRef.current = true;
    onArrive?.();
  }, [onArrive]);
  useMotionValueEvent(draw, "change", (v) => { if (v >= 0.9) fire(); });
  React.useEffect(() => { if (draw.get() >= 0.9) fire(); }, [draw, fire]);

  // flowing light: position sampled along the path from the draw progress
  const lenRef = React.useRef(1);
  React.useLayoutEffect(() => { if (pathRef.current) lenRef.current = pathRef.current.getTotalLength() || 1; }, [path]);
  const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const lx = useTransform(draw, (v) => (pathRef.current ? pathRef.current.getPointAtLength(clamp(v) * lenRef.current).x : cx));
  const ly = useTransform(draw, (v) => (pathRef.current ? pathRef.current.getPointAtLength(clamp(v) * lenRef.current).y : topY));
  const lightOpacity = useTransform(draw, [0, 0.05, 0.9, 1], [0, 1, 1, 0]);
  const tipGlow = useTransform(draw, [0.78, 1], [0, 1]); // incoming node brighten

  return (
    <div ref={ref} className={s.gap} aria-hidden="true">
      {ready && (
        <svg className={s.svg} width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
          <defs>
            <linearGradient id={`scg-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#58ABCE" />
              <stop offset="0.4" stopColor="#2A92CC" />
              <stop offset="0.72" stopColor="#F4C65F" />
              <stop offset="1" stopColor="#E2AA3B" />
            </linearGradient>
          </defs>
          <path className={s.base} d={path} />
          {reduce ? (
            <path className={s.draw} d={path} stroke={`url(#scg-${gid})`} pathLength={1} />
          ) : (
            <>
              <motion.path ref={pathRef} className={s.draw} d={path} stroke={`url(#scg-${gid})`} style={{ pathLength: draw }} />
              <motion.g style={{ x: lx, y: ly, opacity: lightOpacity }}>
                <circle className={s.light} r={3.2} cx={0} cy={0} />
              </motion.g>
            </>
          )}
          <circle className={s.nodeOut} cx={cx} cy={topY} r={m.r} />
          <circle className={s.nodeIn} cx={cx} cy={botY} r={m.r} />
          {!reduce && <motion.circle className={s.tipHalo} cx={cx} cy={botY} r={m.r + 4} style={{ opacity: tipGlow }} />}
        </svg>
      )}
    </div>
  );
});
