"use client";
import React from "react";
import { Button, Card, Icon } from "@/shared/components";
import { Reveal, siteStyles as s } from "@/shared/utils/helpers";
import { Press } from "@/shared/utils/motion/motion";
import { HeadingReveal } from "@/shared/utils/headingReveal/HeadingReveal";
import { TypingAnimation } from "@/shared/utils/typing/TypingAnimation";
import { TitleNodes } from "@/shared/utils/titleNodes/TitleNodes";
import { SectionConnector } from "@/shared/utils/sectionConnector/SectionConnector";
import { SectionStars } from "@/shared/utils/sectionStars/SectionStars";
import { ParticleField } from "@/shared/utils/particleField/ParticleField";
import site from "@/shared/data/site.json";
import { reduceMotion } from "../sectionUtils";

/* ---------------- contact ---------------- */
export function Contact() {
  const ref = React.useRef<HTMLDivElement>(null);
  const bgRef = React.useRef<HTMLDivElement>(null);
  const progRef = React.useRef(0);
  React.useEffect(() => {
    const el = ref.current; if (!el) return;
    if (reduceMotion()) { progRef.current = 1; return; }
    let raf = 0;
    let lastBgTransform = "";
    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
    const apply = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      if (r.bottom < -vh * 0.2 || r.top > vh * 1.2) return;
      const total = r.height + vh;
      const p = clamp((vh - r.top) / total, 0, 1);
      const e = p * p * (3 - 2 * p);
      progRef.current = e;
      // NOTE: the content used to RISE on scroll (translateY) here, but that shifted
      // the contact title's connector node out from under the (separately measured)
      // journey line. The wrap now stays put — the inner Reveals handle entrance —
      // so the final line lands cleanly on the contact node. Only the decorative
      // background still drifts (it carries no connector anchor).
      const bg = bgRef.current;
      // background lights drift slower than the content + breathe in scale (decorative depth)
      const nextBgTransform = `translate3d(0, ${((0.5 - e) * 46).toFixed(1)}px, 0) scale(${(1 + e * 0.1).toFixed(4)})`;
      if (bg && nextBgTransform !== lastBgTransform) {
        bg.style.transform = nextBgTransform;
        lastBgTransform = nextBgTransform;
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(apply); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    apply();
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);
  const [sent, setSent] = React.useState(false);
  return (
    <section id="contact" className={[s.page, s.panel, s.overlap].join(" ")} data-sx="front" data-anim-pause style={{ background: "var(--page-bg)", overflow: "hidden", padding: "120px 0", zIndex: 7 }}>
      {/* overscan (inset:-90) so the scroll translate/scale can never expose a bare
          strip — the layer always covers the section; the section clips the excess. */}
      <SectionStars />
      {/* AnimatedBG glow wash removed — keep the same clean base + stars; the
          ParticleField is the section's particle signature */}
      <div ref={bgRef} style={{ position: "absolute", inset: -90, willChange: "opacity, filter, transform", transition: "opacity .2s linear" }} />
      <ParticleField progressRef={progRef} />
      {/* final leg: drawn only when it arrives (never pre-drawn) — lands on contact:l */}
      <SectionConnector sectionKey="contact" role="end" enter="l" />
      <div ref={ref} className={s.wrap} style={{ maxWidth: 1000, position: "relative", zIndex: 1, transformOrigin: "center center", willChange: "transform" }}>
        <div className={s.respGrid2} style={{ gap: "clamp(32px,6vw,72px)", alignItems: "start" }}>
          <div>
            <Reveal><div className={s.eyebrow}>#CONTACT_US</div></Reveal>
            <TitleNodes id="contact">
              <HeadingReveal as="h2" style={{ fontSize: "clamp(32px,4.4vw,52px)", fontWeight: 700, letterSpacing: "-0.03em", margin: "14px 0 0", lineHeight: 1.05 }} segments={[{ text: "Hey." }, { br: true }, { text: "Let's talk.", accent: true }]} />
            </TitleNodes>
            <Reveal delay={130}><TypingAnimation as="p" text="Tell us about your idea, your timeline, or just say hi. We reply to every message." style={{ fontSize: 17, lineHeight: 1.65, color: "var(--text-secondary)", marginTop: 18, maxWidth: 380 }} /></Reveal>
            <Reveal delay={190}>
              <Press style={{ marginTop: 24 }}>
                <a href={`mailto:${site.email}`} style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: 18, fontWeight: 600, color: "var(--text-accent)" }}>
                  <Icon name="mail" size={20} /> {site.email}
                </a>
              </Press>
            </Reveal>
          </div>
          <Reveal delay={120}>
            <Card padding={26} className={[s.glassCard, s.cardHoverGlow].join(" ")} style={{ boxShadow: "var(--shadow-lg)" }}>
              {sent ? (
                <div style={{ textAlign: "center", padding: "30px 10px" }}>
                  <span style={{ color: "var(--green-600)" }}><Icon name="circle-check" size={40} /></span>
                  <div style={{ fontSize: 20, fontWeight: 600, marginTop: 14 }}>Message sent</div>
                  <p style={{ fontSize: 14.5, color: "var(--text-secondary)", marginTop: 6 }}>Thanks for reaching out — we&apos;ll be in touch shortly.</p>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <input className={s.field} placeholder="Name" required />
                  <input className={s.field} type="email" placeholder="Email" required />
                  <textarea className={s.field} placeholder="Tell us about your project" rows={4} style={{ resize: "vertical" }} required />
                  <Press style={{ width: "100%" }}><Button variant="primary" className={s.btnGlow} size="lg" block type="submit">Send message</Button></Press>
                </form>
              )}
            </Card>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
