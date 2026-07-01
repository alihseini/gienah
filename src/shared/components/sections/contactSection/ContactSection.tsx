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
import site from "@/shared/data/site.json";

/* ---------------- contact ---------------- */
export function Contact() {
  const [sent, setSent] = React.useState(false);
  return (
    <section id="contact" className={[s.page, s.panel, s.overlap].join(" ")} data-sx="front" data-anim-pause style={{ background: "var(--page-bg)", overflow: "hidden", padding: "120px 0", zIndex: 7 }}>
      <SectionStars />
      {/* final leg: drawn only when it arrives (never pre-drawn) - lands on contact:l */}
      <SectionConnector sectionKey="contact" role="end" enter="l" />
      <div className={s.wrap} style={{ maxWidth: 1000, position: "relative", zIndex: 1, transformOrigin: "center center" }}>
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
                  <p style={{ fontSize: 14.5, color: "var(--text-secondary)", marginTop: 6 }}>Thanks for reaching out - we&apos;ll be in touch shortly.</p>
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
