"use client";
import React from "react";
import styles from "./homepageLoader.module.css";

const EXIT_FALLBACK_MS = 430;

type LoaderPhase = "visible" | "exiting" | "hidden";

export function HomepageLoader({ visible }: { visible: boolean }) {
  const [phase, setPhase] = React.useState<LoaderPhase>(visible ? "visible" : "hidden");
  const fallbackTimer = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    window.clearTimeout(fallbackTimer.current);

    if (visible) {
      setPhase("visible");
      return () => window.clearTimeout(fallbackTimer.current);
    }

    setPhase((current) => (current === "hidden" ? "hidden" : "exiting"));
    fallbackTimer.current = window.setTimeout(() => setPhase("hidden"), EXIT_FALLBACK_MS);

    return () => window.clearTimeout(fallbackTimer.current);
  }, [visible]);

  if (phase === "hidden") return null;

  return (
    <div
      className={styles.loader}
      data-state={phase}
      onTransitionEnd={(event) => {
        if (event.target === event.currentTarget && phase === "exiting") {
          window.clearTimeout(fallbackTimer.current);
          setPhase("hidden");
        }
      }}
    >
      <div className={styles.content}>
        <div className={styles.cluster} aria-hidden="true">
          <span className={styles.glow} />
          <span className={[styles.star, styles.starOne].join(" ")} />
          <span className={[styles.star, styles.starTwo].join(" ")} />
          <span className={[styles.star, styles.starThree].join(" ")} />
          <img
            className={styles.logo}
            src="/assets/logo-mark.png"
            alt=""
            draggable={false}
            decoding="sync"
            fetchPriority="high"
          />
          <span className={styles.line}>
            <span />
          </span>
        </div>
        <div className={styles.recovery}>
          <p>Loading is taking longer than expected.</p>
          <p>Check your connection and try again.</p>
          <a href="/">Retry</a>
        </div>
        <noscript>
          <style>{`.${styles.recovery}{display:none}`}</style>
          <div className={styles.noScriptRecovery}>
            <p>JavaScript is required to load this experience.</p>
            <p>Enable JavaScript and retry.</p>
            <a href="/">Retry</a>
          </div>
        </noscript>
      </div>
    </div>
  );
}

export const HOMEPAGE_LOADER_EXIT_MS = 350;
