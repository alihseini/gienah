"use client";

import React from "react";
import type { VisualBudget } from "./visualBudget";

export const PREWARM_ATTR = "data-home-prewarm";

type SectionKey = "services" | "products" | "studio" | "agile";
type IdleHandle = number;
type IdleCallback = (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void;

type WindowWithIdle = Window & {
  requestIdleCallback?: (callback: IdleCallback, options?: { timeout?: number }) => IdleHandle;
  cancelIdleCallback?: (handle: IdleHandle) => void;
};

const prewarmers = {
  services: () => import("../components/sections/servicesSection/ServicesSection"),
  products: () => import("../components/sections/productSection/FeaturedProductsSection"),
  studio: () => import("../components/sections/studioSection/StudioSection"),
  agile: () => import("../components/sections/agileSection/AgileSection"),
} satisfies Record<SectionKey, () => Promise<unknown>>;

const prewarmState = new Map<SectionKey, Promise<unknown>>();

export function loadServicesSection() {
  return prewarmers.services();
}

export function loadFeaturedProductsSection() {
  return prewarmers.products();
}

export function loadAgileSection() {
  return prewarmers.agile();
}

export function loadMoreProductsSection() {
  return prewarmers.studio();
}

function prewarmSection(key: SectionKey) {
  const existing = prewarmState.get(key);
  if (existing) return existing;

  const started = prewarmers[key]().catch((error) => {
    prewarmState.delete(key);
    throw error;
  });
  prewarmState.set(key, started);
  return started;
}

function scheduleIdle(callback: () => void, timeout: number) {
  const win = window as WindowWithIdle;
  if (win.requestIdleCallback) {
    const handle = win.requestIdleCallback(() => callback(), { timeout });
    return () => win.cancelIdleCallback?.(handle);
  }

  const handle = window.setTimeout(callback, timeout);
  return () => window.clearTimeout(handle);
}

function budgetPlan(budget: VisualBudget) {
  if (budget === "reduced") {
    return {
      startDelay: 5200,
      idleTimeout: 2200,
      spacing: 1400,
      rootMargin: "120% 0px",
      idleQueue: ["services"] as SectionKey[],
    };
  }

  if (budget === "balanced") {
    return {
      startDelay: 3000,
      idleTimeout: 1800,
      spacing: 950,
      rootMargin: "180% 0px",
      idleQueue: ["services", "products", "studio"] as SectionKey[],
    };
  }

  return {
    startDelay: 1800,
    idleTimeout: 1400,
    spacing: 700,
    rootMargin: "240% 0px",
    idleQueue: ["services", "products", "studio", "agile"] as SectionKey[],
  };
}

export function useHomepageSectionPrewarm(budget: VisualBudget) {
  React.useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const plan = budgetPlan(budget);
    const cleanups: Array<() => void> = [];
    const timeoutIds: number[] = [];

    const queueIdlePrewarm = () => {
      plan.idleQueue.forEach((key, index) => {
        const timeoutId = window.setTimeout(() => {
          const cancelIdle = scheduleIdle(() => {
            void prewarmSection(key);
          }, plan.idleTimeout);
          cleanups.push(cancelIdle);
        }, index * plan.spacing);
        timeoutIds.push(timeoutId);
      });
    };

    const startId = window.setTimeout(queueIdlePrewarm, plan.startDelay);
    timeoutIds.push(startId);

    if ("IntersectionObserver" in window) {
      const observed = new Set<Element>();
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const key = (entry.target as HTMLElement).dataset.homePrewarm as SectionKey | undefined;
            if (key === "services" || key === "products" || key === "studio" || key === "agile") {
              void prewarmSection(key);
              observer.unobserve(entry.target);
              observed.delete(entry.target);
              if (observed.size === 0) observer.disconnect();
            }
          });
        },
        { rootMargin: plan.rootMargin, threshold: 0 }
      );

      document.querySelectorAll<HTMLElement>(`[${PREWARM_ATTR}]`).forEach((node) => {
        observed.add(node);
        observer.observe(node);
      });
      cleanups.push(() => observer.disconnect());
    }

    return () => {
      timeoutIds.forEach((id) => window.clearTimeout(id));
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [budget]);
}
