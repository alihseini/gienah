"use client";

import React from "react";

export type VisualBudget = "full" | "balanced" | "reduced";

type NavigatorWithHints = Navigator & {
  deviceMemory?: number;
  connection?: {
    saveData?: boolean;
  };
};

export function detectVisualBudget(): VisualBudget {
  if (typeof window === "undefined") return "full";

  const nav = navigator as NavigatorWithHints;
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  if (reduceMotion || nav.connection?.saveData) return "reduced";

  const memory = nav.deviceMemory;
  const cores = nav.hardwareConcurrency;
  const width = window.innerWidth || document.documentElement.clientWidth || 0;
  const dpr = window.devicePixelRatio || 1;
  const mobile = width > 0 && width < 768;
  const tablet = width >= 768 && width < 1024;

  if (mobile && ((memory != null && memory <= 4) || (cores != null && cores <= 4) || dpr >= 2.5)) {
    return "reduced";
  }
  if (memory != null && memory <= 2) return "reduced";

  if (mobile || tablet) return "balanced";
  if ((memory != null && memory <= 4) || (cores != null && cores <= 4) || dpr >= 2.25) {
    return "balanced";
  }

  return "full";
}

export function useVisualBudget() {
  const [budget, setBudget] = React.useState<VisualBudget>("full");

  React.useEffect(() => {
    const update = () => setBudget(detectVisualBudget());
    update();

    const motion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    motion?.addEventListener?.("change", update);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      motion?.removeEventListener?.("change", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return budget;
}

export function visualBudgetFactor(budget: VisualBudget) {
  if (budget === "reduced") return 0.45;
  if (budget === "balanced") return 0.72;
  return 1;
}

export function readVisualBudgetFromDom(): VisualBudget {
  if (typeof document === "undefined") return "full";
  const value = document.querySelector<HTMLElement>("[data-visual-budget]")?.dataset.visualBudget;
  return value === "balanced" || value === "reduced" ? value : "full";
}
