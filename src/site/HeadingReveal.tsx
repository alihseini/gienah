"use client";
import React from "react";
import s from "./headingReveal.module.css";

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
}: {
  segments: HeadingSeg[];
  as?: React.ElementType;
  className?: string;
  style?: React.CSSProperties;
  stagger?: number;
}) {
  const ref = React.useRef<HTMLElement>(null);
  const [shown, setShown] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
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
  }, []);

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
    <Tag ref={ref} className={[shown ? s.revealed : "", className].filter(Boolean).join(" ")} style={style}>
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
