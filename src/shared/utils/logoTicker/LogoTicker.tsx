"use client";

import React from "react";
import { motion, useMotionValue, useReducedMotion } from "motion/react";
import { ImageLazy } from "@/shared/components";
import partners from "@/shared/data/partners.json";
import t from "./logoTicker.module.css";
import { requestHomeScrollMeasureRefresh, subscribeHomeScrollFrame } from "../homeScrollCoordinator";
import { stableViewportHeight } from "../viewport";

type Partner = { id: string; name: string; logo: string | null; url: string | null };

const PARTNERS = partners as Partner[];

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function leftLaneX(width: number) {
  if (width < 768) return -0.1 * width;
  if (width < 1036) return -0.08 * width;
  const inset = width >= 1440 ? 0.07 : 0.085;
  return Math.max(34, inset * width);
}

function TickerBridge() {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const reduce = useReducedMotion();
  const draw = useMotionValue(reduce ? 1 : 0);
  const [size, setSize] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    if (reduce) {
      draw.set(1);
      return;
    }
    const svg = svgRef.current;
    if (!svg) return;

    let active = true;
    let last = -1;
    const update = (vh: number) => {
      const rect = svg.getBoundingClientRect();
      if (rect.bottom < 0) {
        draw.set(1);
        last = 1;
        return;
      }
      if (rect.top > vh) {
        draw.set(0);
        last = 0;
        return;
      }

      const next = clamp01((vh * 0.62 - rect.top) / (rect.height || 1));
      if (Math.abs(next - last) > 0.001) {
        draw.set(next);
        last = next;
      }
    };

    const unsubscribe = subscribeHomeScrollFrame({
      write: (frame) => {
        if (active) update(frame.viewportHeight || stableViewportHeight());
      },
    });
    const observer = new IntersectionObserver(([entry]) => {
      active = entry.isIntersecting;
      if (active) requestHomeScrollMeasureRefresh();
    }, { rootMargin: "80% 0px" });
    observer.observe(svg);
    requestHomeScrollMeasureRefresh();

    return () => {
      observer.disconnect();
      unsubscribe();
    };
  }, [draw, reduce]);

  React.useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const measure = () => {
      const rect = svg.getBoundingClientRect();
      setSize((current) => (
        Math.abs(current.width - rect.width) < 0.5 && Math.abs(current.height - rect.height) < 0.5
          ? current
          : { width: rect.width, height: rect.height }
      ));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);

  const x = leftLaneX(size.width || 0);
  const h = size.height || 0;
  const d = h
    ? `M ${x.toFixed(1)} 0 C ${x.toFixed(1)} ${(h * 0.28).toFixed(1)}, ${(x - 20).toFixed(1)} ${(h * 0.42).toFixed(1)}, ${(x - 7).toFixed(1)} ${(h * 0.52).toFixed(1)} C ${(x + 7).toFixed(1)} ${(h * 0.64).toFixed(1)}, ${x.toFixed(1)} ${(h * 0.76).toFixed(1)}, ${x.toFixed(1)} ${h.toFixed(1)}`
    : "";

  return (
    <svg ref={svgRef} className={t.bridge} viewBox={h ? `0 0 ${size.width} ${h}` : undefined} preserveAspectRatio="none" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="tickerBridgeGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7cc3ee" />
          <stop offset="0.5" stopColor="#3f9bdc" />
          <stop offset="1" stopColor="#5ab0d0" />
        </linearGradient>
      </defs>
      {d && (
        <motion.path
          className={t.bridgePath}
          d={d}
          pathLength={1}
          stroke="url(#tickerBridgeGradient)"
          style={{ pathLength: draw }}
        />
      )}
    </svg>
  );
}

/* Data-driven, seamless logo marquee. The list is rendered twice so a -50%
   translate loops without a gap. Logos that have no asset fall back to a wordmark. */
export function LogoTicker() {
  const row = [...PARTNERS, ...PARTNERS];
  return (
    <div className={t.shell} data-anim-pause>
      {/* The journey passes through the transparent ticker, below the logos. */}
      <div className={t.connectorLayer} aria-hidden="true">
        <TickerBridge />
      </div>
      <div className={t.wrap} role="region" aria-label="Companies we've worked with">
      <div className={t.track}>
        {row.map((p, i) => {
          const dup = i >= PARTNERS.length;
          const inner = p.logo ? (
            <ImageLazy className={t.logo} src={p.logo} alt={p.name} />
          ) : (
            <span className={t.wordmark}>{p.name}</span>
          );
          if (p.url && !dup) {
            return (
              <a key={i} className={t.item} href={p.url} target="_blank" rel="noopener noreferrer">{inner}</a>
            );
          }
          return (
            <span key={i} className={t.item} aria-hidden={dup || undefined}>{inner}</span>
          );
        })}
      </div>
      </div>
    </div>
  );
}
