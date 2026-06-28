"use client";
import React from "react";
import s from "./site.module.css";
import { HeadingReveal } from "./HeadingReveal";
import { TypingAnimation } from "./TypingAnimation";
import { useJourneyReady } from "./JourneyGate";
import { TitleNodes } from "./TitleNodes";

/* ---------------- brand colors + helpers ---------------- */
export const C = { blue1: "#58ABCE", blue2: "#2A92CC", gold1: "#F4C65F", gold2: "#E2AA3B" };

export function rgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

export function go(id: string) {
  const el = document.getElementById(id);
  if (el) window.scrollTo({ top: el.offsetTop - 64, behavior: "smooth" });
}

const reduceMotion = () =>
  typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------- Reveal ---------------- */
const VARIANT_CLASS: Record<string, string> = {
  up: "",
  left: s.vLeft,
  right: s.vRight,
  scale: s.vScale,
  blur: s.vBlur,
  fade: s.vFade,
};

export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  variant = "up",
  className = "",
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  as?: React.ElementType;
  variant?: "up" | "left" | "right" | "scale" | "blur" | "fade";
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = React.useRef<HTMLElement>(null);
  const [vis, setVis] = React.useState(false);
  const [settled, setSettled] = React.useState(false);
  const ready = useJourneyReady();
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // gated sections wait for the connector to arrive before revealing
    if (!ready) return;
    let done = false;
    let t: ReturnType<typeof setTimeout>;
    const show = () => {
      if (done) return;
      done = true;
      setVis(true);
    };
    const inView = () => {
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    };
    let io: IntersectionObserver | undefined;
    if (inView()) {
      requestAnimationFrame(() => requestAnimationFrame(show));
      t = setTimeout(show, 90);
    } else {
      try {
        io = new IntersectionObserver(([e]) => { if (e.isIntersecting) show(); }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
        io.observe(el);
      } catch { show(); }
      t = setTimeout(show, 1500);
    }
    return () => { if (io) io.disconnect(); clearTimeout(t); };
  }, [ready]);
  React.useEffect(() => {
    if (!vis) return;
    const id = setTimeout(() => setSettled(true), 1150 + delay);
    return () => clearTimeout(id);
  }, [vis, delay]);
  const cls = [s.reveal, VARIANT_CLASS[variant], vis ? s.in : "", settled ? s.settled : "", className].filter(Boolean).join(" ");
  return (
    <Tag ref={ref} className={cls} style={{ transitionDelay: `${delay}ms`, ...style }}>
      {children}
    </Tag>
  );
}

/* ---------------- Parallax ---------------- */
export function Parallax({
  factor = 0.12,
  children,
  style,
  className = "",
}: {
  factor?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const apply = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const center = r.top + r.height / 2 - window.innerHeight / 2;
      el.style.transform = `translate3d(0, ${(-center * factor).toFixed(1)}px, 0)`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(apply); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    apply();
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [factor]);
  return (
    <div ref={ref} className={[s.parallax, className].filter(Boolean).join(" ")} style={style}>
      {children}
    </div>
  );
}

/* ---------------- scroll-linked parallax layers ----------------
   One shared rAF loop drives every [data-parallax] element so the page feels
   alive while scrolling without N competing loops. Each element declares how far
   it should drift; the loop maps the element's position in the viewport
   (-1 entering → 0 centered → 1 leaving) to a bounded translateY (+ optional
   scale). Movement NEVER touches the outer section wrappers, stays in-flow, and
   is halved on mobile / disabled under prefers-reduced-motion.

   Declare motion with attributes:
     data-parallax="slow|medium|fast|text"  → named depth layer, OR
     data-parallax="40"                      → custom ± y amplitude in px
     data-parallax-scale="0.05"              → optional scale amplitude (peaks centered)
   Layers (different speeds = depth). Presets are translateY ONLY — a scroll-linked
   scale is never applied implicitly, because content elements also run a reveal
   (which has its own scale) and two scales compounding causes a size "pop". Scale
   is opt-in via data-parallax-scale and should be used only on decorative visuals
   that have no reveal of their own.
     slow   — background glows / decoration: largest drift
     medium — main visuals / images: medium drift
     fast   — cards / icons: visible drift, snappier
     text   — text blocks: minimal drift, readability first */
const PARALLAX_PRESETS: Record<string, { y: number; scale: number }> = {
  slow: { y: 60, scale: 0 },
  medium: { y: 34, scale: 0 },
  fast: { y: 44, scale: 0 },
  text: { y: 12, scale: 0 },
};

export function useParallax() {
  React.useEffect(() => {
    if (reduceMotion()) return;
    const mobile = window.matchMedia && window.matchMedia("(max-width: 760px)").matches;
    const factor = mobile ? 0.5 : 1; // mobile: ~half the movement
    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
    type Item = { el: HTMLElement; y: number; scale: number; top: number; h: number };
    let items: Item[] = [];
    // layout position (document-space), measured WITHOUT transforms via the
    // offsetTop chain — so the element's own transform and any ancestor reveal /
    // entrance transform never feed back into the parallax (that feedback was what
    // made content jump/grow for a moment while a section was revealing).
    const docTop = (node: HTMLElement) => {
      let t = 0;
      let n: HTMLElement | null = node;
      while (n) { t += n.offsetTop; n = n.offsetParent as HTMLElement | null; }
      return t;
    };
    const collect = () => {
      items = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]")).map((el) => {
        const raw = el.dataset.parallax || "medium";
        const preset = PARALLAX_PRESETS[raw];
        const y = (preset ? preset.y : parseFloat(raw) || 0) * factor;
        const scaleAttr = el.dataset.parallaxScale ? parseFloat(el.dataset.parallaxScale) : preset ? preset.scale : 0;
        el.style.willChange = "transform";
        return { el, y, scale: (scaleAttr || 0) * factor, top: docTop(el), h: el.offsetHeight };
      });
    };
    collect();
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight || 1;
      const sy = window.scrollY || window.pageYOffset || 0;
      for (const { el, y, scale, top, h } of items) {
        if (h === 0) continue; // hidden (e.g. responsive display:none) — skip
        // viewport-centred progress from LAYOUT position only: -1 below → 0 centred → 1 above
        const p = clamp((top + h / 2 - sy - vh / 2) / vh, -1, 1);
        const ty = (-p * y).toFixed(1);
        // scale peaks when centred and never drops below 1 (so content can't shrink into a collision)
        const sc = scale ? (1 + (1 - Math.abs(p)) * scale).toFixed(4) : null;
        el.style.transform = sc ? `translate3d(0, ${ty}px, 0) scale(${sc})` : `translate3d(0, ${ty}px, 0)`;
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    const onResize = () => { collect(); onScroll(); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("load", onResize);
    // re-measure after first layout settles (fonts/images can shift offsets)
    const settle = setTimeout(() => { collect(); update(); }, 300);
    update();
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onResize); window.removeEventListener("load", onResize); clearTimeout(settle); if (raf) cancelAnimationFrame(raf); };
  }, []);
}

/* Background/decoration wrapper: absolutely positioned with a slight overscan
   (inset: -max) so the parallax translate can never expose an empty edge of the
   parent. Driven by useParallax() via the data-parallax attribute. */
export function ScrollParallax({
  max = 16,
  scale,
  children,
  style,
  className = "",
}: {
  max?: number;
  scale?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      data-parallax={String(max)}
      {...(scale ? { "data-parallax-scale": String(scale) } : {})}
      className={[s.parallax, className].filter(Boolean).join(" ")}
      style={{ position: "absolute", inset: -Math.abs(max), zIndex: 0, pointerEvents: "none", ...style }}
    >
      {children}
    </div>
  );
}

/* ---------------- CountUp ---------------- */
export function CountUp({ value }: { value: string }) {
  const m = String(value).match(/^(\D*)(\d+)(.*)$/);
  const pre = m ? m[1] : "";
  const target = m ? parseInt(m[2], 10) : 0;
  const suf = m ? m[3] : String(value);
  const ref = React.useRef<HTMLSpanElement>(null);
  const [n, setN] = React.useState(0);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let started = false;
    let t: ReturnType<typeof setTimeout>;
    const run = () => {
      if (started) return;
      started = true;
      const dur = 1300, t0 = performance.now();
      const tick = (ti: number) => {
        const p = Math.min(1, (ti - t0) / dur);
        setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const inView = () => { const r = el.getBoundingClientRect(); return r.top < window.innerHeight && r.bottom > 0; };
    if (inView()) { run(); return; }
    let io: IntersectionObserver | undefined;
    try { io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { run(); io && io.disconnect(); } }, { threshold: 0.6 }); io.observe(el); }
    catch { run(); }
    t = setTimeout(run, 1600);
    return () => { if (io) io.disconnect(); clearTimeout(t); };
  }, [target]);
  return <span ref={ref}>{pre}{n}{suf}</span>;
}

/* ---------------- ScrollProgress ---------------- */
export function ScrollProgress() {
  const [p, setP] = React.useState(0);
  React.useEffect(() => {
    const onS = () => { const h = document.documentElement.scrollHeight - window.innerHeight; setP(h > 0 ? Math.min(1, window.scrollY / h) : 0); };
    window.addEventListener("scroll", onS, { passive: true });
    onS();
    return () => window.removeEventListener("scroll", onS);
  }, []);
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 3, zIndex: 60, background: "rgba(42,146,204,0.10)" }}>
      <div style={{ height: "100%", width: `${p * 100}%`, background: "var(--brand-gradient)", transition: "width .08s linear" }} />
    </div>
  );
}

/* ---------------- scroll choreography hooks ---------------- */
export function useOffscreenPause() {
  React.useEffect(() => {
    if (reduceMotion()) return;
    const els = document.querySelectorAll<HTMLElement>("[data-abg], [data-marquee]");
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const el = e.target as HTMLElement;
        if (e.isIntersecting) delete el.dataset.paused;
        else el.dataset.paused = "";
      });
    }, { rootMargin: "120px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

export function useLayerChoreography() {
  React.useEffect(() => {
    if (reduceMotion()) return;
    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
    // layout position, transform-independent (see useParallax) — so this hook is not
    // disturbed by its own transform or by the section's data-sx entrance transform.
    const docTop = (node: HTMLElement) => {
      let t = 0; let n: HTMLElement | null = node;
      while (n) { t += n.offsetTop; n = n.offsetParent as HTMLElement | null; }
      return t;
    };
    type L = { el: HTMLElement; depth: string | null; top: number; h: number };
    let els: L[] = [];
    const collect = () => {
      els = Array.from(document.querySelectorAll<HTMLElement>("[data-layer]")).map((el) => ({
        el, depth: el.getAttribute("data-layer"), top: docTop(el), h: el.offsetHeight,
      }));
    };
    collect();
    let raf = 0;
    const update = () => {
      raf = 0;
      const H = window.innerHeight || 1;
      const sy = window.scrollY || window.pageYOffset || 0;
      for (const { el, depth, top, h } of els) {
        if (h === 0) continue;
        const rTop = top - sy;
        const rBottom = top + h - sy;
        const enter = clamp((H - rTop) / (0.62 * H), 0, 1);
        const leave = clamp((0.58 * H - rBottom) / (0.58 * H), 0, 1);
        const emerge = depth === "back" ? 40 : 16;
        const push = depth === "back" ? 20 : 32;
        const y = emerge * (1 - enter) + push * leave;
        el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
        el.style.opacity = (1 - 0.08 * leave).toFixed(3);
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    const onResize = () => { collect(); onScroll(); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("load", onResize);
    // re-measure after first layout settles (fonts/images can shift offsets)
    const settle = setTimeout(() => { collect(); update(); }, 300);
    update();
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onResize); window.removeEventListener("load", onResize); clearTimeout(settle); if (raf) cancelAnimationFrame(raf); };
  }, []);
}

export function useSectionEntrance() {
  React.useEffect(() => {
    if (reduceMotion()) {
      document.querySelectorAll<HTMLElement>("[data-sx]").forEach((el) => (el.dataset.shown = ""));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { (e.target as HTMLElement).dataset.shown = ""; io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll<HTMLElement>("[data-sx]").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.86 && r.bottom > 0) el.dataset.shown = "";
      else io.observe(el);
    });
    return () => io.disconnect();
  }, []);
}

/* ---------------- decorative pieces ---------------- */
export function Blob({ color, size = 420, style = {}, factor = 0.12 }: { color: string; size?: number; style?: React.CSSProperties; factor?: number }) {
  return (
    <Parallax factor={factor} style={{ position: "absolute", zIndex: 0, ...style }}>
      <div className={s.blob} style={{ width: size, height: size, background: color }} />
    </Parallax>
  );
}

export function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <div data-marquee="" style={{ overflow: "hidden", padding: "22px 0", borderTop: "1px solid rgba(255,255,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "#0b1422", position: "relative", zIndex: 1 }}>
      <div className={s.marquee}>
        {row.map((t, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 16, padding: "0 22px", fontSize: 19, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--text-tertiary)" }}>
            {t}
            <span style={{ width: 6, height: 6, borderRadius: 9, background: i % 2 ? "var(--gold-400)" : "var(--accent-400)" }} />
          </span>
        ))}
      </div>
    </div>
  );
}

function Sparks({ count, colors, dark }: { count: number; colors: string[]; dark?: boolean }) {
  // render only after mount — random positions would otherwise mismatch SSR/client hydration
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);
  const dots = React.useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 2 + Math.random() * (dark ? 3.5 : 4),
        dur: 6 + Math.random() * 8,
        delay: -Math.random() * 10,
        color: colors[i % colors.length],
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  if (!mounted) return null;
  return (
    <>
      {dots.map((d, i) => (
        <span
          key={i}
          className={s.abgSpark}
          style={{
            position: "absolute",
            left: d.left + "%",
            top: d.top + "%",
            width: d.size,
            height: d.size,
            background: d.color,
            boxShadow: `0 0 ${d.size * 2}px ${d.color}`,
            ["--d" as string]: d.dur + "s",
            animationDelay: d.delay + "s",
          } as React.CSSProperties}
        />
      ))}
    </>
  );
}

function WaveLines({ stroke, count = 4, opacity = 0.55 }: { stroke: string; count?: number; opacity?: number }) {
  const uid = React.useId().replace(/:/g, "");
  return (
    <div className={[s.abgL, s.abgWave].join(" ")} style={{ inset: "-10% -6%", width: "112%", height: "120%", opacity }}>
      <svg width="100%" height="100%" viewBox="0 0 1440 600" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
        <defs>
          <linearGradient id={"wg" + uid} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={stroke} stopOpacity="0" />
            <stop offset="0.5" stopColor={stroke} stopOpacity="1" />
            <stop offset="1" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        {Array.from({ length: count }, (_, i) => {
          const y = 120 + i * 110;
          return (
            <path
              key={i}
              d={`M -40,${y} C 300,${y - 70} 560,${y + 80} 860,${y} S 1380,${y - 70} 1480,${y}`}
              fill="none"
              stroke={`url(#wg${uid})`}
              strokeWidth={1.5}
            />
          );
        })}
      </svg>
    </div>
  );
}

export function AnimatedBG({ variant = "mesh", dark = false }: { variant?: "mesh" | "blobs" | "glow" | "lines" | "darkparticles"; dark?: boolean }) {
  if (variant === "mesh") {
    return (
      <div className={[s.abg, s.abgMesh].join(" ")} data-abg="">
        <div className={[s.abgL, s.m1].join(" ")} style={{ top: "-25%", left: "-15%", width: "72%", height: "95%", background: `radial-gradient(circle, ${rgba(C.blue1, 0.5)}, transparent 64%)`, filter: "blur(50px)" }} />
        <div className={[s.abgL, s.m2].join(" ")} style={{ top: "-12%", right: "-18%", width: "68%", height: "96%", background: `radial-gradient(circle, ${rgba(C.gold1, 0.42)}, transparent 64%)`, filter: "blur(54px)" }} />
        <div className={[s.abgL, s.m3].join(" ")} style={{ bottom: "-30%", left: "20%", width: "64%", height: "85%", background: `radial-gradient(circle, ${rgba(C.blue2, 0.4)}, transparent 66%)`, filter: "blur(58px)" }} />
        <WaveLines stroke={rgba(C.blue1, 0.6)} count={3} opacity={0.7} />
        <Sparks count={20} colors={[C.blue1, C.gold1, C.blue2]} />
      </div>
    );
  }
  if (variant === "blobs") {
    return (
      <div className={s.abg} data-abg="">
        <div className={[s.abgL, s.abgFloat].join(" ")} style={{ top: "-12%", left: "-8%", width: 440, height: 440, borderRadius: "50%", background: `radial-gradient(circle, ${rgba(C.blue1, 0.42)}, transparent 70%)`, filter: "blur(44px)", ["--d" as string]: "17s" } as React.CSSProperties} />
        <div className={[s.abgL, s.abgFloat].join(" ")} style={{ bottom: "-18%", right: "-6%", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${rgba(C.gold1, 0.34)}, transparent 70%)`, filter: "blur(48px)", ["--d" as string]: "21s", animationDelay: "-6s" } as React.CSSProperties} />
        <div className={[s.abgL, s.abgFloat].join(" ")} style={{ top: "28%", right: "24%", width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${rgba(C.blue2, 0.3)}, transparent 70%)`, filter: "blur(44px)", ["--d" as string]: "25s", animationDelay: "-12s" } as React.CSSProperties} />
        <Sparks count={12} colors={[C.blue1, C.gold1]} />
      </div>
    );
  }
  if (variant === "glow") {
    return (
      <div className={s.abg} data-abg="">
        <div className={[s.abgL, s.abgGlow].join(" ")} style={{ top: "50%", left: "50%", width: "75%", height: "125%", transform: "translate(-50%,-50%)", background: `radial-gradient(circle, ${rgba(C.blue1, 0.42)}, ${rgba(C.gold1, 0.18)} 42%, transparent 70%)`, filter: "blur(54px)" }} />
        <div className={[s.abgL, s.m2].join(" ")} style={{ top: "-15%", right: "-12%", width: "54%", height: "82%", background: `radial-gradient(circle, ${rgba(C.gold1, 0.32)}, transparent 66%)`, filter: "blur(50px)", animation: "meshB 24s var(--ease-in-out) infinite" }} />
        <Sparks count={16} colors={[C.blue1, C.gold1]} />
      </div>
    );
  }
  if (variant === "lines") {
    return (
      <div className={s.abg} data-abg="">
        <div className={[s.abgL, s.m1].join(" ")} style={{ top: "-20%", left: "-10%", width: "58%", height: "92%", background: `radial-gradient(circle, ${rgba(C.blue2, 0.34)}, transparent 66%)`, filter: "blur(54px)", animation: "meshA 26s var(--ease-in-out) infinite" }} />
        <WaveLines stroke={rgba(C.gold1, 0.6)} count={5} opacity={0.65} />
        <WaveLines stroke={rgba(C.blue1, 0.5)} count={4} opacity={0.55} />
      </div>
    );
  }
  if (variant === "darkparticles") {
    return (
      <div className={s.abg} data-abg="">
        <div className={[s.abgL, s.abgGlow].join(" ")} style={{ top: "-10%", left: "6%", width: "58%", height: "92%", background: `radial-gradient(circle, ${rgba(C.gold2, 0.34)}, transparent 62%)`, filter: "blur(54px)" }} />
        <div className={[s.abgL, s.m2].join(" ")} style={{ bottom: "-25%", right: "-8%", width: "64%", height: "98%", background: `radial-gradient(circle, ${rgba(C.blue2, 0.46)}, transparent 64%)`, filter: "blur(58px)", animation: "meshB 28s var(--ease-in-out) infinite" }} />
        <Sparks count={30} colors={[C.blue1, C.gold1, "#ffffff"]} dark />
      </div>
    );
  }
  return null;
}

export function SectionHead({ tag, title, sub, light, nodeId, nodeSides = true }: { tag: string; title: string; sub?: string; light?: boolean; nodeId?: string; nodeSides?: boolean }) {
  const heading = (
    <HeadingReveal as="h2" segments={[{ text: title }]} style={{ fontSize: "clamp(30px, 4.4vw, 46px)", fontWeight: 700, letterSpacing: "-0.03em", margin: "14px 0 0", lineHeight: 1.08, color: light ? "#fff" : "var(--text-primary)" }} />
  );
  return (
    <div style={{ maxWidth: 680, margin: "0 auto 56px", textAlign: "center" }}>
      <Reveal>
        <div className={s.eyebrow} style={light ? { color: "var(--accent-300)" } : undefined}>{tag}</div>
      </Reveal>
      {nodeId ? <TitleNodes id={nodeId} sideNodes={nodeSides}>{heading}</TitleNodes> : heading}
      {sub && (
        <Reveal delay={140}>
          <TypingAnimation as="p" text={sub} style={{ fontSize: 18, lineHeight: 1.6, color: light ? "var(--ink-text-dim)" : "var(--text-secondary)", margin: "16px auto 0", maxWidth: 560 }} />
        </Reveal>
      )}
    </div>
  );
}

export { s as siteStyles };
