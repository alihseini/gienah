"use client";
import React from "react";

type Node = { x: number; y: number; vx: number; vy: number; r: number; gold: boolean; glow: boolean; ph: number };

/* Scoped network/topology field — slow-drifting nodes joined by thin lines when
   close. Brand blues for the mesh, a few gold accent nodes. Lives behind the
   "More from the studio" content only. Pauses off-screen, freezes a single
   static frame under prefers-reduced-motion, and cleans up its rAF on unmount. */
export function TopologyField() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const BLUE = "#2A92CC", BLUE2 = "#58ABCE", GOLD = ["#F4C65F", "#E2AA3B"];
    let w = 0, h = 0, dpr = 1;
    let nodes: Node[] = [];
    let dist = 150;
    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      if (w === 0 || h === 0) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const mobile = w < 760;
      dist = mobile ? 130 : 165;
      // density scaled to area, clamped to the requested node ranges
      const target = Math.round((w * h) / (mobile ? 26000 : 22000));
      const count = Math.max(mobile ? 18 : 35, Math.min(mobile ? 30 : 58, target));
      nodes = new Array(count).fill(0).map(() => {
        const gold = Math.random() < 0.12;
        return {
          x: rand(0, w), y: rand(0, h),
          vx: rand(-1, 1) * 0.14, vy: rand(-1, 1) * 0.14,
          r: gold ? rand(1.6, 2.8) : rand(1, 2.4),
          gold,
          glow: Math.random() < 0.35,
          ph: Math.random() * Math.PI * 2,
        };
      });
    };

    let raf = 0;
    let vis = true;
    const t0 = performance.now();
    const io = new IntersectionObserver(([e]) => { vis = e.isIntersecting; }, { threshold: 0 });
    io.observe(canvas);

    const draw = (now: number) => {
      if (w === 0 || h === 0) return;
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, w, h);

      // thin connecting lines — opacity falls off with distance
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > dist * dist) continue;
          const d = Math.sqrt(d2);
          const k = 1 - d / dist;
          ctx.strokeStyle = (a.gold || b.gold) ? "rgba(226,170,59," + (k * 0.16).toFixed(3) + ")"
            : "rgba(88,171,206," + (k * 0.2).toFixed(3) + ")";
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // nodes — soft breathing glow, gold accents brighter
      for (const n of nodes) {
        const breathe = n.glow ? 0.6 + 0.4 * Math.sin(t * 0.7 + n.ph) : 0.55;
        const a = (n.gold ? 0.6 : 0.42) * breathe + 0.12;
        if (n.glow) {
          const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 5);
          g.addColorStop(0, n.gold ? "rgba(244,198,95," + (a * 0.5).toFixed(3) + ")" : "rgba(42,146,204," + (a * 0.5).toFixed(3) + ")");
          g.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r * 5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = n.gold ? GOLD[0] : (Math.random() < 0.5 ? BLUE : BLUE2);
        ctx.globalAlpha = Math.max(0, Math.min(1, a));
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    };

    const step = () => {
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < -20) n.x = w + 20; else if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20; else if (n.y > h + 20) n.y = -20;
      }
    };

    const frame = (now: number) => {
      if (vis) { step(); draw(now); }
      raf = requestAnimationFrame(frame);
    };

    build();
    if (reduce) {
      draw(t0); // single static frame
    } else {
      raf = requestAnimationFrame(frame);
    }

    let resizeRaf = 0;
    const onResize = () => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => { build(); if (reduce) draw(performance.now()); });
    };
    window.addEventListener("resize", onResize);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      io.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", pointerEvents: "none" }}
    />
  );
}
