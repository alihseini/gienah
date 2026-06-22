"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components";
import { go, siteStyles as s } from "./helpers";
import site from "@/data/site.json";

const NAV = site.nav as [string, string][];

export function Nav() {
  const router = useRouter();
  const [phase, setPhase] = React.useState<"closed" | "seed" | "open">("closed");
  const innerRef = React.useRef<HTMLDivElement>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [w, setW] = React.useState(0);
  const seedTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  const measure = () => { if (innerRef.current) setW(innerRef.current.scrollWidth + 2); };
  React.useEffect(() => { measure(); window.addEventListener("resize", measure); return () => window.removeEventListener("resize", measure); }, []);

  const open = () => {
    clearTimeout(seedTimer.current);
    measure();
    setPhase("seed");
    seedTimer.current = setTimeout(() => { measure(); setPhase("open"); }, 260);
  };
  const close = () => {
    clearTimeout(seedTimer.current);
    setPhase((p) => (p === "closed" ? "closed" : "seed"));
    seedTimer.current = setTimeout(() => setPhase("closed"), 240);
  };
  const toggle = () => (phase === "closed" ? open() : close());
  const pick = (id: string) => {
    close();
    if (id.startsWith("/")) { router.push(id); return; }
    setTimeout(() => go(id), 130);
  };

  React.useEffect(() => () => clearTimeout(seedTimer.current), []);

  React.useEffect(() => {
    if (phase === "closed") return;
    const onDoc = (e: MouseEvent) => { if (rootRef.current && !rootRef.current.contains(e.target as Node)) close(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const isOpen = phase === "open";
  const panelStyle: React.CSSProperties =
    phase === "open"
      ? { width: w || "auto", maxWidth: "calc(100vw - 24px)", height: 56, borderRadius: 999, opacity: 1, transform: "translateY(0) scaleY(1)", transition: "width .55s var(--ease-out), height .5s var(--ease-out), border-radius .5s var(--ease-out), opacity .3s, transform .5s var(--ease-out)" }
      : phase === "seed"
      ? { width: 46, height: 46, borderRadius: 999, opacity: 1, transform: "translateY(0) scaleY(1)", transition: "width .42s var(--ease-out), height .42s var(--ease-out), border-radius .42s, opacity .22s, transform .42s var(--ease-out)" }
      : { width: 16, height: 0, borderRadius: 999, opacity: 0, transform: "translateY(-10px) scaleY(.3)", transition: "width .35s var(--ease-out), height .4s var(--ease-out), opacity .3s, transform .4s var(--ease-out)" };

  const rootCls = [s.fab, phase === "open" ? s.fabOpen : "", phase === "seed" ? s.fabSeedOn : ""].filter(Boolean).join(" ");

  return (
    <div ref={rootRef} className={rootCls}>
      <span className={s.fabSeed} aria-hidden="true" />
      <button className={s.fabBtn} onClick={toggle} aria-expanded={isOpen} aria-label="Menu">
        <img src="/assets/logo-mark.png" alt="" style={{ height: 26, width: "auto" }} />
        <span>Gienah</span>
        <span className={s.fabGlyph} aria-hidden="true">
          <span className={[s.fabBar, s.fabBarT].join(" ")} />
          <span className={[s.fabBar, s.fabBarB].join(" ")} />
        </span>
      </button>

      <div className={s.fabPanel} style={panelStyle}>
        <div className={s.fabPanelInner} ref={innerRef}>
          {NAV.map(([label, id], i) => (
            <div
              key={id}
              className={s.fabItem}
              onClick={() => pick(id)}
              style={{
                opacity: isOpen ? 1 : 0,
                transform: isOpen ? "translateY(0)" : "translateY(9px)",
                transitionDelay: isOpen ? `${180 + i * 55}ms` : "0ms",
              }}
            >
              {label}
            </div>
          ))}
          <div
            style={{
              display: "inline-flex",
              paddingLeft: 6,
              opacity: isOpen ? 1 : 0,
              transform: isOpen ? "translateY(0)" : "translateY(9px)",
              transition: "opacity .5s var(--ease-out), transform .5s var(--ease-out)",
              transitionDelay: isOpen ? `${180 + NAV.length * 55}ms` : "0ms",
            }}
          >
            <Button size="sm" variant="primary" onClick={() => pick("contact")}>Start a project</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
