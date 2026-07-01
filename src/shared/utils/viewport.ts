"use client";

export function stableViewportHeight() {
  if (typeof window === "undefined") return 1;
  return document.documentElement.clientHeight || window.innerHeight || 1;
}
