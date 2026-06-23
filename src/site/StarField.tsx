"use client";
import React from "react";

/* Dense premium hero star field (canvas): many twinkling stars across three
   depth layers (far→near) with parallax drift, soft glow halos on a few brighter
   stars, two faint secondary constellation accents tucked to the edges, and a
   single very-rare shooting star. The whole field fades in softly on load.
   The "guiding star" lives in the SVG logo constellation, not here.
   Brand colors only: #2A92CC #58ABCE #F4C65F #E2AA3B */

const BLUE = "88,171,206"; // #58ABCE
const BLUE2 = "42,146,204"; // #2A92CC
const GOLD = "244,198,95"; // #F4C65F
const GOLD2 = "226,170,59"; // #E2AA3B

type Star = { x: number; y: number; r: number; a: number; sp: number; ph: number; col: string; layer: number; glow: boolean };
type Shooter = { x: number; y: number; vx: number; vy: number; life: number; dur: number; rgb: string };

// two subtle secondary constellation accents, kept to the lower-left / lower edge
// so they never compete with the main logo constellation (upper-right).
const CONSTELLATIONS: [number, number][][] = [
  [[0.08, 0.58], [0.16, 0.68], [0.12, 0.82], [0.23, 0.86]],
  [[0.4, 0.9], [0.5, 0.84], [0.6, 0.9]],
];

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
      // noticeably denser than before — clearly "star-driven", still controlled
      const count = Math.round(Math.min((w * h) / 4200, reduce ? 150 : 460));
      stars = Array.from({ length: count }, () => {
        const layer = Math.random() < 0.5 ? 0 : Math.random() < 0.55 ? 1 : 2; // 0 far … 2 near
        const gold = Math.random() < 0.24;
        const big = Math.random() < 0.09;
        return {
          x: Math.random(), y: Math.random(),
          r: (layer === 2 ? rand(1.1, 2.1) : layer === 1 ? rand(0.8, 1.6) : rand(0.5, 1.1)) + (big ? rand(0.9, 1.8) : 0),
          a: (layer === 0 ? rand(0.4, 0.7) : layer === 1 ? rand(0.55, 0.9) : rand(0.7, 1)),
          sp: rand(0.3, 1.1), ph: Math.random() * 6.283,
          col: gold ? (Math.random() < 0.5 ? GOLD : GOLD2) : (Math.random() < 0.5 ? BLUE : BLUE2),
          layer,
          glow: layer === 2 && (big || Math.random() < 0.18),
        };
      });
    };

    let raf = 0;
    const t0 = performance.now();
    let last = t0;
    let vis = true;
    let nextShoot = t0 + rand(14000, 22000);
    const io = new IntersectionObserver(([e]) => { vis = e.isIntersecting; }, { threshold: 0 });
    io.observe(canvas);

    const smooth = (p: number) => p * p * (3 - 2 * p);

    const render = (now: number) => {
      const t = (now - t0) / 1000;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // soft fade-in of the whole field on load
      const intro = reduce ? 1 : smooth(Math.min(1, t / 1.4));
      ctx.clearRect(0, 0, w, h);
      const dx = [Math.sin(t * 0.04) * 6, Math.sin(t * 0.035) * 13, Math.sin(t * 0.028) * 22];
      const dy = [Math.cos(t * 0.04) * 4, Math.cos(t * 0.035) * 8, Math.cos(t * 0.028) * 14];

      // secondary constellation accents (very faint, edge-tucked)
      ctx.lineWidth = 1;
      const pulse = (reduce ? 0.1 : 0.06 + 0.04 * (0.5 + 0.5 * Math.sin(t * 0.5))) * intro;
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
          ctx.beginPath(); ctx.arc(px, py, 1.4, 0, 6.283);
          ctx.fillStyle = `rgba(170,210,240,${0.5 * intro})`; ctx.fill();
        }
      }

      // stars
      for (const st of stars) {
        const px = st.x * w + dx[st.layer], py = st.y * h + dy[st.layer];
        const tw = reduce ? 0.92 : 0.45 + 0.55 * Math.sin(t * st.sp + st.ph);
        const alpha = Math.max(0, st.a * tw) * intro;
        // soft glow halo on the brighter near stars
        if (st.glow && alpha > 0.04) {
          const hr = st.r * 6;
          const g = ctx.createRadialGradient(px, py, 0, px, py, hr);
          g.addColorStop(0, `rgba(${st.col},${0.18 * alpha})`);
          g.addColorStop(1, `rgba(${st.col},0)`);
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(px, py, hr, 0, 6.283); ctx.fill();
        }
        ctx.globalAlpha = alpha;
        ctx.fillStyle = `rgb(${st.col})`;
        ctx.shadowColor = `rgb(${st.col})`; ctx.shadowBlur = st.r * 4;
        ctx.beginPath(); ctx.arc(px, py, st.r, 0, 6.283); ctx.fill();
      }
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;

      // a single, very rare and subtle shooting star
      if (!reduce && intro > 0.99) {
        if (now > nextShoot && shooters.length < 1) {
          const ang = rand(Math.PI * 0.12, Math.PI * 0.26);
          const sp = rand(0.36, 0.55);
          shooters.push({ x: rand(0.1, 0.6), y: rand(0.04, 0.26), vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 0, dur: rand(1, 1.5), rgb: Math.random() < 0.5 ? BLUE : GOLD });
          nextShoot = now + rand(22000, 34000);
        }
        shooters = shooters.filter((sh) => sh.life < sh.dur);
        for (const sh of shooters) {
          sh.life += dt; sh.x += sh.vx * dt; sh.y += sh.vy * dt;
          const px = sh.x * w, py = sh.y * h;
          const fade = Math.sin(Math.min(1, sh.life / sh.dur) * Math.PI);
          const tlx = px - sh.vx * w * 0.1, tly = py - sh.vy * h * 0.1;
          const g = ctx.createLinearGradient(tlx, tly, px, py);
          g.addColorStop(0, `rgba(${sh.rgb},0)`);
          g.addColorStop(1, `rgba(${sh.rgb},${0.6 * fade})`);
          ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(tlx, tly); ctx.lineTo(px, py); ctx.stroke();
          ctx.globalAlpha = fade; ctx.fillStyle = "#fff"; ctx.shadowColor = `rgb(${sh.rgb})`; ctx.shadowBlur = 7;
          ctx.beginPath(); ctx.arc(px, py, 1.3, 0, 6.283); ctx.fill();
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
