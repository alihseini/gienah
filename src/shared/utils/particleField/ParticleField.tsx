"use client";
import React from "react";

type Particle = {
  x0: number; y0: number; ox: number; oy: number;
  size: number; baseA: number; col: string;
  ph: number; sp: number; dx: number; dy: number; da: number; spk: number;
};

/* Full-section brand particle field — center-weighted density, soft edges, cursor proximity + sparkle */
export function ParticleField({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = canvas.getContext("2d")!;
    const BLUE = ["#58ABCE", "#2A92CC"], GOLD = ["#F4C65F", "#E2AA3B"];
    let w = 0, h = 0, cx = 0, cy = 0, diag = 1, dpr = 1;
    let parts: Particle[] = [];
    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const mouse = { x: -9999, y: -9999, on: false };

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = w / 2; cy = h / 2;
      diag = Math.hypot(w, h) / 2;
      const count = Math.round(Math.min((w * h) / 5200, reduce ? 90 : 300));
      parts = new Array(count).fill(0).map(() => {
        let x: number, y: number;
        if (Math.random() < 0.55) {
          const rr = Math.pow(Math.random() * Math.random(), 0.5);
          const ang = Math.random() * Math.PI * 2;
          x = cx + Math.cos(ang) * rr * w * 0.42;
          y = cy + Math.sin(ang) * rr * h * 0.46;
        } else {
          x = rand(0, w); y = rand(0, h);
        }
        const dist = Math.hypot(x - cx, y - cy) / diag;
        const cw = Math.max(0, 1 - dist * 0.85);
        const gold = Math.random() < 0.32;
        const col = gold ? GOLD[(Math.random() < 0.5 ? 1 : 0)] : BLUE[(Math.random() < 0.5 ? 1 : 0)];
        return {
          x0: x, y0: y, ox: 0, oy: 0,
          size: rand(0.5, 1.9) + cw * 1.0,
          baseA: (0.34 + cw * 0.66) * rand(0.5, 1),
          col,
          ph: Math.random() * Math.PI * 2,
          sp: rand(0.15, 0.5),
          dx: rand(-1, 1), dy: rand(-1, 1),
          da: rand(0.05, 0.2),
          spk: 0,
        };
      });
    };

    const RAD = 120, RAD2 = RAD * RAD;
    let raf = 0;
    const t0 = performance.now();
    let vis = true;
    const io = new IntersectionObserver(([e]) => { vis = e.isIntersecting; }, { threshold: 0 });
    io.observe(canvas);
    const frame = (now: number) => {
      if (!vis) { raf = requestAnimationFrame(frame); return; }
      const t = (now - t0) / 1000;
      const prog = progressRef && progressRef.current != null ? progressRef.current : 1;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (const p of parts) {
        const breathe = 0.6 + 0.4 * Math.sin(t * p.sp + p.ph);
        const driftX = Math.sin(t * 0.18 * p.sp + p.ph) * w * 0.04 * p.da * p.dx;
        const driftY = Math.cos(t * 0.15 * p.sp + p.ph) * h * 0.04 * p.da * p.dy;
        let x = p.x0 + driftX, y = p.y0 + driftY;

        let prox = 0;
        if (mouse.on) {
          const ddx = x - mouse.x, ddy = y - mouse.y;
          const d2 = ddx * ddx + ddy * ddy;
          if (d2 < RAD2) {
            const d = Math.sqrt(d2) || 1;
            prox = 1 - d / RAD;
            const pushf = (prox * prox * 10) / d;
            p.ox += (ddx * pushf - p.ox) * 0.12;
            p.oy += (ddy * pushf - p.oy) * 0.12;
            p.spk = Math.max(p.spk, prox);
          }
        }
        p.ox *= 0.9; p.oy *= 0.9;
        p.spk *= 0.92;
        x += p.ox; y += p.oy;

        const twinkle = p.spk > 0.02 ? (0.5 + 0.5 * Math.sin(t * 18 + p.ph)) * p.spk : 0;
        const a = (p.baseA * breathe * (0.3 + 0.7 * prog)) * (1 + prox * 1.1) + twinkle * 0.6;
        const sz = p.size * (0.85 + 0.3 * breathe) * (1 + prox * 0.8 + twinkle * 0.6);
        ctx.globalAlpha = Math.max(0, Math.min(1, a));
        ctx.fillStyle = p.col;
        ctx.beginPath();
        ctx.arc(x, y, sz, 0, Math.PI * 2);
        ctx.fill();
        if (twinkle > 0.12) {
          ctx.globalAlpha = Math.min(1, twinkle);
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(x, y, sz * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(frame);
    };

    const toLocal = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
      mouse.on = mouse.x >= -RAD && mouse.x <= w + RAD && mouse.y >= -RAD && mouse.y <= h + RAD;
    };
    const onLeave = () => { mouse.on = false; mouse.x = mouse.y = -9999; };

    build();
    raf = requestAnimationFrame(frame);
    const onResize = () => build();
    window.addEventListener("resize", onResize);
    if (!reduce) {
      window.addEventListener("pointermove", toLocal, { passive: true });
      window.addEventListener("pointerleave", onLeave);
    }
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", toLocal);
      window.removeEventListener("pointerleave", onLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0, maskImage: "radial-gradient(125% 115% at 50% 48%, #000 58%, transparent 94%)", WebkitMaskImage: "radial-gradient(125% 115% at 50% 48%, #000 58%, transparent 94%)" }}
    />
  );
}
