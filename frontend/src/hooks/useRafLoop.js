import { useEffect, useRef } from "react";

// Global singleton state for rAF loop
const subscribers = new Set();
let rafId = null;
let lastTime = 0;
let isTabVisible = typeof document !== "undefined" ? document.visibilityState !== "hidden" : true;
let prefersReducedMotion =
  typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
let isTypingGlobal = false;
let typingTimeout = null;

export function notifyUserTyping(durationMs = 1200) {
  isTypingGlobal = true;
  if (typingTimeout) clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    isTypingGlobal = false;
  }, durationMs);
}

export function setTypingState(typing) {
  if (typingTimeout) clearTimeout(typingTimeout);
  isTypingGlobal = typing;
}

function handleVisibilityChange() {
  isTabVisible = document.visibilityState !== "hidden";
  if (isTabVisible) {
    lastTime = performance.now();
    startLoopIfNeeded();
  } else {
    stopLoopIfRunning();
  }
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", handleVisibilityChange);
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener?.("change", (e) => {
    prefersReducedMotion = e.matches;
  });
}

function loop(currentTime) {
  if (!isTabVisible || prefersReducedMotion || subscribers.size === 0) {
    rafId = null;
    return;
  }

  const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
  lastTime = currentTime;

  if (!isTypingGlobal) {
    subscribers.forEach((sub) => {
      try {
        if (sub.isVisible) {
          sub.callback(currentTime, dt);
        }
      } catch (err) {
        console.error("Error in rAF subscriber:", err);
      }
    });
  }

  rafId = requestAnimationFrame(loop);
}

function startLoopIfNeeded() {
  if (rafId === null && isTabVisible && !prefersReducedMotion && subscribers.size > 0) {
    lastTime = performance.now();
    rafId = requestAnimationFrame(loop);
  }
}

function stopLoopIfRunning() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

/**
 * Hook to register a callback into the single shared rAF loop.
 * @param {Function} callback - (time, dt) => void
 * @param {boolean} enabled - whether the callback should run
 * @param {React.RefObject} elementRef - optional ref to observe with IntersectionObserver
 */
export function useRafLoop(callback, enabled = true, elementRef = null) {
  const cbRef = useRef(callback);
  useEffect(() => {
    cbRef.current = callback;
  });

  useEffect(() => {
    if (!enabled || prefersReducedMotion) return;

    const sub = {
      callback: (t, dt) => cbRef.current(t, dt),
      isVisible: true,
    };

    let observer = null;
    if (elementRef && elementRef.current && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          sub.isVisible = entry ? entry.isIntersecting : true;
        },
        { threshold: 0 }
      );
      observer.observe(elementRef.current);
    }

    subscribers.add(sub);
    startLoopIfNeeded();

    return () => {
      subscribers.delete(sub);
      if (observer) {
        observer.disconnect();
      }
      if (subscribers.size === 0) {
        stopLoopIfRunning();
      }
    };
  }, [enabled, elementRef]);
}
