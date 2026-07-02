"use client";

export function stableViewportHeight() {
  if (typeof window === "undefined") return 1;
  return document.documentElement.clientHeight || window.innerHeight || 1;
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
