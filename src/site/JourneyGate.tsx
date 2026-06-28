"use client";
import * as React from "react";

/* Journey reveal gate.
 *
 * A tiny context that says "is this section allowed to reveal yet?". The default
 * is TRUE everywhere, so anything NOT wrapped in a <JourneyGate> (e.g. the Hero,
 * the nav, the ticker) reveals exactly as before — its existing viewport-driven
 * animations are untouched.
 *
 * Each section below the Hero is wrapped in <JourneyGate ready={…}> whose `ready`
 * flips to true only when the connector above it finishes drawing into its node.
 * The reveal primitives (Reveal / HeadingReveal / TypingAnimation / FadeIn /
 * Stagger / Lift) AND this gate together mean: a gated section stays in its
 * pre-reveal state while the line is still drawing, then plays its normal reveal
 * (in its normal order) the moment the line arrives. Once ready it stays ready. */
const JourneyReadyContext = React.createContext<boolean>(true);

export const useJourneyReady = () => React.useContext(JourneyReadyContext);

export function JourneyGate({ ready, children }: { ready: boolean; children: React.ReactNode }) {
  return <JourneyReadyContext.Provider value={ready}>{children}</JourneyReadyContext.Provider>;
}

/* Activation channel: each section's SectionConnector calls activate(key) once the
   line reaches that section's entry node, which flips the section's gate to ready.
   Provided once at the top of SiteApp; default is a no-op so connectors render
   harmlessly outside a provider. */
const JourneyActivateContext = React.createContext<(key: string) => void>(() => {});

export const useJourneyActivate = () => React.useContext(JourneyActivateContext);

export function JourneyActivateProvider({ activate, children }: { activate: (key: string) => void; children: React.ReactNode }) {
  return <JourneyActivateContext.Provider value={activate}>{children}</JourneyActivateContext.Provider>;
}
