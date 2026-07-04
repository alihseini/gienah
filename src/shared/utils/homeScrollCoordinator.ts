"use client";

export type HomeScrollDirection = "up" | "down" | "none";

export type HomeScrollFrame = {
  scrollY: number;
  previousScrollY: number;
  deltaY: number;
  direction: HomeScrollDirection;
  viewportWidth: number;
  viewportHeight: number;
  timestamp: number;
  measureVersion: number;
};

export type HomeScrollSubscriber =
  | ((frame: HomeScrollFrame) => void)
  | {
      read?: (frame: HomeScrollFrame) => void;
      write?: (frame: HomeScrollFrame) => void;
    };

const subscribers = new Set<HomeScrollSubscriber>();

let listening = false;
let raf = 0;
let scrollY = 0;
let previousScrollY = 0;
let viewportWidth = 0;
let viewportHeight = 0;
let measureVersion = 0;

const readScrollY = () => window.scrollY || window.pageYOffset || 0;

const refreshViewport = () => {
  viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
  viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
};

const ensureSnapshot = () => {
  scrollY = readScrollY();
  previousScrollY = scrollY;
  refreshViewport();
};

const schedule = () => {
  if (!raf) raf = window.requestAnimationFrame(flush);
};

const onScroll = () => {
  schedule();
};

const onResize = () => {
  measureVersion += 1;
  refreshViewport();
  schedule();
};

const flush = (timestamp: number) => {
  raf = 0;
  const nextScrollY = readScrollY();
  const deltaY = nextScrollY - scrollY;
  previousScrollY = scrollY;
  scrollY = nextScrollY;
  const frame: HomeScrollFrame = {
    scrollY,
    previousScrollY,
    deltaY,
    direction: deltaY > 0 ? "down" : deltaY < 0 ? "up" : "none",
    viewportWidth,
    viewportHeight,
    timestamp,
    measureVersion,
  };

  subscribers.forEach((subscriber) => {
    if (typeof subscriber === "function") subscriber(frame);
    else subscriber.read?.(frame);
  });
  subscribers.forEach((subscriber) => {
    if (typeof subscriber !== "function") subscriber.write?.(frame);
  });
};

const start = () => {
  if (listening || typeof window === "undefined") return;
  listening = true;
  ensureSnapshot();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);
  window.addEventListener("orientationchange", onResize);
  window.addEventListener("load", onResize);
};

const stop = () => {
  if (!listening || typeof window === "undefined") return;
  listening = false;
  window.removeEventListener("scroll", onScroll);
  window.removeEventListener("resize", onResize);
  window.removeEventListener("orientationchange", onResize);
  window.removeEventListener("load", onResize);
  if (raf) {
    window.cancelAnimationFrame(raf);
    raf = 0;
  }
};

export function subscribeHomeScrollFrame(subscriber: HomeScrollSubscriber) {
  if (typeof window === "undefined") return () => {};
  subscribers.add(subscriber);
  start();
  schedule();
  return () => {
    subscribers.delete(subscriber);
    if (!subscribers.size) stop();
  };
}

export function requestHomeScrollMeasureRefresh() {
  if (typeof window === "undefined") return;
  measureVersion += 1;
  refreshViewport();
  if (subscribers.size) schedule();
}
