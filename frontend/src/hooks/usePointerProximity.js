import { useState, useEffect, useRef } from "react";

/**
 * Hook to track pointer distance to a DOM element and compute damped proximity.
 * @param {React.RefObject} elementRef - Target element
 * @param {number} threshold - Maximum distance in px for influence (e.g. 240px)
 * @returns {{ distance: number, isNear: boolean, proximityRatio: number }}
 */
export function usePointerProximity(elementRef, threshold = 240) {
  const [state, setState] = useState({
    distance: Infinity,
    isNear: false,
    proximityRatio: 0,
  });

  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    let animationFrameId = null;
    let targetX = -9999;
    let targetY = -9999;

    const update = () => {
      animationFrameId = null;
      if (!elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      const dx = Math.max(rect.left - targetX, 0, targetX - rect.right);
      const dy = Math.max(rect.top - targetY, 0, targetY - rect.bottom);
      const dist = Math.hypot(dx, dy);

      const isNear = dist <= threshold;
      const proximityRatio = isNear ? Math.max(0, 1 - dist / threshold) : 0;

      if (
        Math.abs(dist - stateRef.current.distance) > 1 ||
        isNear !== stateRef.current.isNear ||
        Math.abs(proximityRatio - stateRef.current.proximityRatio) > 0.02
      ) {
        const nextState = {
          distance: dist,
          isNear,
          proximityRatio,
        };
        stateRef.current = nextState;
        setState(nextState);
      }
    };

    const handlePointerMove = (e) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(update);
      }
    };

    const handlePointerLeave = () => {
      targetX = -9999;
      targetY = -9999;
      if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(update);
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("mouseleave", handlePointerLeave);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("mouseleave", handlePointerLeave);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [elementRef, threshold]);

  return state;
}
