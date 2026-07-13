"use client";
import React from "react";
import { Button, Card, Icon } from "@/shared/components";
import { Reveal, siteStyles as s } from "@/shared/utils/helpers";
import { Press } from "@/shared/utils/motion/motion";
import { HeadingReveal } from "@/shared/utils/headingReveal/HeadingReveal";
import { TypingAnimation } from "@/shared/utils/typing/TypingAnimation";
import { TitleNodes } from "@/shared/utils/titleNodes/TitleNodes";
import { SectionConnector } from "@/shared/utils/sectionConnector/SectionConnector";
import site from "@/shared/data/site.json";

type SubmissionStatus = "idle" | "loading" | "success" | "error";

const visuallyHiddenStyle: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
};

/* ---------------- contact ---------------- */
export function Contact() {
  const [submissionStatus, setSubmissionStatus] = React.useState<SubmissionStatus>("idle");
  const [errorMessage, setErrorMessage] = React.useState("");
  const submittingRef = React.useRef(false);
  const isLoading = submissionStatus === "loading";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    submittingRef.current = true;
    setSubmissionStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(formData.get("name") ?? ""),
          email: String(formData.get("email") ?? ""),
          message: String(formData.get("message") ?? ""),
          website: String(formData.get("website") ?? ""),
        }),
      });

      const responseBody: unknown = await response.json().catch(() => null);
      const responseData =
        typeof responseBody === "object" && responseBody !== null
          ? responseBody as { success?: unknown; message?: unknown }
          : null;

      if (!response.ok || responseData?.success !== true) {
        setErrorMessage(
          typeof responseData?.message === "string"
            ? responseData.message
            : "Unable to send your message. Please try again.",
        );
        setSubmissionStatus("error");
        return;
      }

      form.reset();
      setSubmissionStatus("success");
    } catch {
      setErrorMessage("Unable to send your message. Please try again.");
      setSubmissionStatus("error");
    } finally {
      submittingRef.current = false;
    }
  };

  return (
    <section id="contact" className={[s.page, s.panel, s.overlap].join(" ")} data-sx="front" data-anim-pause style={{ background: "transparent", overflow: "hidden", minHeight: "auto", padding: "clamp(3rem, 5vw, 4rem) 0", zIndex: 7 }}>
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
              {submissionStatus === "success" ? (
                <div role="status" aria-live="polite" style={{ textAlign: "center", padding: "30px 10px" }}>
                  <span style={{ color: "var(--green-600)" }}><Icon name="circle-check" size={40} /></span>
                  <div style={{ fontSize: 20, fontWeight: 600, marginTop: 14 }}>Message sent</div>
                  <p style={{ fontSize: 14.5, color: "var(--text-secondary)", marginTop: 6 }}>Thanks for reaching out - we&apos;ll be in touch shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <input className={s.field} name="name" placeholder="Name" maxLength={100} required />
                  <input className={s.field} name="email" type="email" placeholder="Email" maxLength={254} required />
                  <textarea className={s.field} name="message" placeholder="Tell us about your project" rows={4} minLength={10} maxLength={5000} style={{ resize: "vertical" }} required />
                  <input name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" style={visuallyHiddenStyle} />
                  <span role="status" aria-live="polite" style={visuallyHiddenStyle}>{isLoading ? "Sending message." : ""}</span>
                  {submissionStatus === "error" ? (
                    <p role="alert" style={{ margin: 0, color: "var(--text-danger)", fontSize: 14 }}>{errorMessage}</p>
                  ) : null}
                  <Press style={{ width: "100%" }}><Button variant="primary" className={s.btnGlow} size="lg" block type="submit" disabled={isLoading}>{isLoading ? "Sending..." : "Send message"}</Button></Press>
                </form>
              )}
            </Card>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
