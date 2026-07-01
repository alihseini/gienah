"use client";
import React from "react";
import s from "./headingReveal.module.css";
import { useJourneyReady } from "../journeyGate/JourneyGate";

/* Word-by-word heading reveal: each word fades up sequentially when the heading
   enters the viewport (IntersectionObserver, runs once). Words flagged `accent`
   keep the brand gold→azure gradient with a slow flowing shimmer. */

export type HeadingSeg = { text?: string; accent?: boolean; br?: boolean };

export function HeadingReveal({
  segments,
  as: Tag = "h2",
  className = "",
  style,
  stagger = 75,
  lcpSafe = false,
}: {
  segments: HeadingSeg[];
  as?: React.ElementType;
  className?: string;
  style?: React.CSSProperties;
  stagger?: number;
  lcpSafe?: boolean;
}) {
  const ref = React.useRef<HTMLElement>(null);
  const [shown, setShown] = React.useState(lcpSafe);
  const [accentReady, setAccentReady] = React.useState(false);
  const ready = useJourneyReady();

  React.useEffect(() => {
    if (lcpSafe) {
      const t = window.setTimeout(() => setAccentReady(true), 1200);
      return () => window.clearTimeout(t);
    }
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    // gated sections wait for the connector to arrive (ready) before revealing
    if (!ready) return;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.92 && r.bottom > 0) {
      setShown(true);
      return;
    }
    let io: IntersectionObserver | undefined;
    try {
      io = new IntersectionObserver(
        ([e]) => { if (e.isIntersecting) { setShown(true); io && io.disconnect(); } },
        { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
      );
      io.observe(el);
    } catch {
      setShown(true);
    }
    return () => { if (io) io.disconnect(); };
  }, [ready, lcpSafe]);

  const tokens = React.useMemo(() => {
    const out: ({ type: "word"; w: string; accent: boolean } | { type: "br" })[] = [];
    segments.forEach((seg) => {
      if (seg.br) { out.push({ type: "br" }); return; }
      (seg.text || "").trim().split(/\s+/).forEach((w) => { if (w) out.push({ type: "word", w, accent: !!seg.accent }); });
    });
    return out;
  }, [segments]);

  let wi = 0;
  return (
    <Tag ref={ref} className={[lcpSafe ? s.lcpSafe : "", shown ? s.revealed : "", accentReady ? s.accentReady : "", className].filter(Boolean).join(" ")} style={style}>
      {tokens.map((t, i) => {
        if (t.type === "br") return <br key={i} />;
        const delay = wi * stagger;
        wi++;
        return (
          <React.Fragment key={i}>
            <span className={s.word} style={{ ["--d" as string]: `${delay}ms` } as React.CSSProperties}>
              {t.accent ? <span className={s.accent}>{t.w}</span> : t.w}
            </span>{" "}
          </React.Fragment>
        );
      })}
    </Tag>
  );
}
