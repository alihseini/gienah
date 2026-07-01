export const reduceMotion = () =>
  typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const _clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const _lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const smoothstep = (t: number) => t * t * (3 - 2 * t);
