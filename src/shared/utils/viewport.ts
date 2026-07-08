"use client";

export function stableViewportHeight() {
  if (typeof window === "undefined") return 1;
  return document.documentElement.clientHeight || window.innerHeight || 1;
}

export function isMobileOrPortraitTablet() {
  if (typeof window === "undefined") return false;
  const width = window.innerWidth || document.documentElement.clientWidth || 0;
  const height = window.innerHeight || document.documentElement.clientHeight || 0;

  return width < 768 || (width <= 1024 && height > width);
}

export function safariScrollLayerLock() {
  if (typeof window === "undefined") return false;
  const touchSafari = CSS.supports("-webkit-touch-callout", "none");
  const desktopSafari =
    navigator.vendor === "Apple Computer, Inc." &&
    /Safari/.test(navigator.userAgent) &&
    !/(Chrome|Chromium|CriOS|FxiOS|Edg|OPR)/.test(navigator.userAgent);
  return touchSafari || desktopSafari;
}

export function lowEndMotionDevice() {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const narrow = window.matchMedia?.("(max-width: 760px)").matches ?? false;
  const lowCore = typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 4;
  const lowMemory = typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4;
  return narrow || lowCore || lowMemory;
}
