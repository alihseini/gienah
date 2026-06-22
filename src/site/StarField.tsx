"use client";
import React from "react";

/* Constellation-inspired hero background (canvas). Many twinkling stars with
   layered parallax drift, a few intentional constellation lines, one brighter
   guiding star, and rare shooting stars. Brand colors only. */

const BLUE = "88,171,206"; // #58ABCE
const BLUE2 = "42,146,204"; // #2A92CC
const GOLD = "244,198,95"; // #F4C65F
const GOLD2 = "226,170,59"; // #E2AA3B

type Star = { x: number; y: number; r: number; a: number; sp: number; ph: number; col: string; layer: number };
type Shooter = { x: number; y: number; vx: number; vy: number; life: number; dur: number; rgb: string };

const CONSTELLATIONS: [number, number][][] = [
  [[0.1, 0.2], [0.18, 0.31], [0.14, 0.46], [0.26, 0.52]],
  [[0.72, 0.16], [0.8, 0.27], [0.7, 0.34], [0.8, 0.27], [0.9, 0.33]],
  [[0.58, 0.64], [0.68, 0.74], [0.8, 0.69], [0.9, 0.8]],
];
const GUIDING = { x: 0.82, y: 0.26 };

export function StarField() {
  const ref = React.useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = canvas.getContext("2d")!;
    let w = 0, h = 0, dpr = 1;
    let stars: Star[] = [];
    let shooters: Shooter[] = [];
    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min((w * h) / 9000, reduce ? 70 : 170));
      stars = Array.from({ length: count }, () => {
        const gold = Math.random() < 0.22;
        return {
          x: Math.random(), y: Math.random(),
          r: rand(0.5, 1.7) + (Math.random() < 0.12 ? rand(0.8, 1.6) : 0),
          a: rand(0.25, 0.9), sp: rand(0.3, 1.1), ph: Math.random() * 6.283,
          col: gold ? (Math.random() < 0.5 ? GOLD : GOLD2) : (Math.random() < 0.5 ? BLUE : BLUE2),
          layer: Math.random() < 0.4 ? 0 : Math.random() < 0.5 ? 1 : 2,
        };
      });
    };

    let raf = 0;
    const t0 = performance.now();
    let last = t0;
    let vis = true;
    let nextShoot = t0 + rand(2500, 6000);
    const io = new IntersectionObserver(([e]) => { vis = e.isIntersecting; }, { threshold: 0 });
    io.observe(canvas);

    const render = (now: number) => {
      const t = (now - t0) / 1000;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, w, h);
      const dx = [Math.sin(t * 0.05) * 8, Math.sin(t * 0.04) * 16, Math.sin(t * 0.03) * 26];
      const dy = [Math.cos(t * 0.05) * 5, Math.cos(t * 0.04) * 10, Math.cos(t * 0.03) * 16];

      // constellation lines + nodes (intentional, faint)
      ctx.lineWidth = 1;
      const pulse = reduce ? 0.12 : 0.09 + 0.06 * (0.5 + 0.5 * Math.sin(t * 0.5));
      for (const nodes of CONSTELLATIONS) {
        ctx.beginPath();
        nodes.forEach(([nx, ny], i) => {
          const px = nx * w + dx[1], py = ny * h + dy[1];
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        });
        ctx.strokeStyle = `rgba(${BLUE},${pulse})`;
        ctx.stroke();
        for (const [nx, ny] of nodes) {
          const px = nx * w + dx[1], py = ny * h + dy[1];
          ctx.beginPath(); ctx.arc(px, py, 1.5, 0, 6.283);
          ctx.fillStyle = "rgba(170,210,240,0.55)"; ctx.fill();
        }
      }

      // stars
      for (const st of stars) {
        const px = st.x * w + dx[st.layer], py = st.y * h + dy[st.layer];
        const tw = reduce ? 0.85 : 0.45 + 0.55 * Math.sin(t * st.sp + st.ph);
        ctx.globalAlpha = Math.max(0, st.a * tw);
        ctx.fillStyle = `rgb(${st.col})`;
        ctx.shadowColor = `rgb(${st.col})`; ctx.shadowBlur = st.r * 3;
        ctx.beginPath(); ctx.arc(px, py, st.r, 0, 6.283); ctx.fill();
      }
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;

      // guiding star
      const gx = GUIDING.x * w + dx[2], gy = GUIDING.y * h + dy[2];
      const gp = reduce ? 1 : 0.7 + 0.3 * Math.sin(t * 0.8);
      const grd = ctx.createRadialGradient(gx, gy, 0, gx, gy, 36);
      grd.addColorStop(0, `rgba(${GOLD},${0.5 * gp})`);
      grd.addColorStop(0.5, `rgba(${GOLD},${0.12 * gp})`);
      grd.addColorStop(1, `rgba(${GOLD},0)`);
      ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(gx, gy, 36, 0, 6.283); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.shadowColor = `rgb(${GOLD})`; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.arc(gx, gy, 2.6, 0, 6.283); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = `rgba(255,236,190,${0.7 * gp})`; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(gx - 9, gy); ctx.lineTo(gx + 9, gy); ctx.moveTo(gx, gy - 9); ctx.lineTo(gx, gy + 9);
      ctx.stroke();

      // shooting stars
      if (!reduce) {
        if (now > nextShoot && shooters.length < 2) {
          const ang = rand(Math.PI * 0.12, Math.PI * 0.28);
          const sp = rand(0.45, 0.8);
          shooters.push({ x: rand(0.05, 0.7), y: rand(0.02, 0.32), vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 0, dur: rand(0.9, 1.4), rgb: Math.random() < 0.5 ? BLUE : GOLD });
          nextShoot = now + rand(5000, 11000);
        }
        shooters = shooters.filter((sh) => sh.life < sh.dur);
        for (const sh of shooters) {
          sh.life += dt; sh.x += sh.vx * dt; sh.y += sh.vy * dt;
          const px = sh.x * w, py = sh.y * h;
          const fade = Math.sin(Math.min(1, sh.life / sh.dur) * Math.PI);
          const tlx = px - sh.vx * w * 0.12, tly = py - sh.vy * h * 0.12;
          const g = ctx.createLinearGradient(tlx, tly, px, py);
          g.addColorStop(0, `rgba(${sh.rgb},0)`);
          g.addColorStop(1, `rgba(${sh.rgb},${0.85 * fade})`);
          ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(tlx, tly); ctx.lineTo(px, py); ctx.stroke();
          ctx.globalAlpha = fade; ctx.fillStyle = "#fff"; ctx.shadowColor = `rgb(${sh.rgb})`; ctx.shadowBlur = 8;
          ctx.beginPath(); ctx.arc(px, py, 1.6, 0, 6.283); ctx.fill();
          ctx.globalAlpha = 1; ctx.shadowBlur = 0;
        }
      }
    };

    const loop = (now: number) => {
      if (vis) render(now); else last = now;
      raf = requestAnimationFrame(loop);
    };

    build();
    if (reduce) render(t0);
    else raf = requestAnimationFrame(loop);
    const onResize = () => build();
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); io.disconnect(); window.removeEventListener("resize", onResize); };
  }, []);

  return <canvas ref={ref} aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }} />;
}
