"use client";
import React from "react";

const MIN_VISIBLE_MS = 450;
const SAFETY_TIMEOUT_MS = 8000;
const FONT_WAIT_TIMEOUT_MS = 1200;
const PAINT_OPPORTUNITIES = 2;

function waitForPaints(count: number) {
  return new Promise<void>((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    let remaining = count;
    const step = () => {
      remaining -= 1;
      if (remaining <= 0) {
        resolve();
        return;
      }
      window.requestAnimationFrame(step);
    };

    window.requestAnimationFrame(step);
  });
}

export function useHomepageInitialReady() {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const startedAt = performance.now();
    const timers = new Set<number>();

    const delay = (ms: number) =>
      new Promise<void>((resolve) => {
        const timer = window.setTimeout(() => {
          timers.delete(timer);
          resolve();
        }, ms);
        timers.add(timer);
      });

    const waitForFonts = (maxWaitMs: number) => {
      if (!("fonts" in document) || !document.fonts?.ready) {
        return Promise.resolve();
      }

      let timeout: number | undefined;
      const timeoutPromise = new Promise<void>((resolve) => {
        timeout = window.setTimeout(() => {
          if (timeout !== undefined) timers.delete(timeout);
          resolve();
        }, maxWaitMs);
        timers.add(timeout);
      });

      return Promise.race([
        document.fonts.ready.then(() => undefined).catch(() => undefined),
        timeoutPromise,
      ]).finally(() => {
        if (timeout !== undefined) {
          window.clearTimeout(timeout);
          timers.delete(timeout);
        }
      });
    };

    const settle = async () => {
      const criticalReady = Promise.allSettled([
        waitForFonts(FONT_WAIT_TIMEOUT_MS),
        waitForPaints(PAINT_OPPORTUNITIES),
      ]);
      const minimumVisible = delay(MIN_VISIBLE_MS);
      const safety = delay(SAFETY_TIMEOUT_MS).then(() => {
        if (process.env.NODE_ENV !== "production") {
          console.warn("Homepage loader safety timeout reached.");
        }
      });

      await Promise.race([
        Promise.allSettled([criticalReady, minimumVisible]),
        safety,
      ]);

      const elapsed = performance.now() - startedAt;
      if (elapsed < MIN_VISIBLE_MS) {
        await delay(MIN_VISIBLE_MS - elapsed);
      }

      if (!cancelled) setReady(true);
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };

    void settle();

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  return ready;
}

export const HOMEPAGE_LOADER_TIMING = {
  minVisibleMs: MIN_VISIBLE_MS,
  safetyTimeoutMs: SAFETY_TIMEOUT_MS,
  fontWaitTimeoutMs: FONT_WAIT_TIMEOUT_MS,
};
