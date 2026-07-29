"use client";

import { useEffect } from "react";

/**
 * Smooth scrolling + reduced-motion awareness.
 * CSS scroll-behavior is set globally; this hardens native anchors
 * and marks the document once JS is ready for progressive enhancement.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.dataset.motion = "ready";

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      document.documentElement.dataset.reducedMotion = reduce.matches
        ? "true"
        : "false";
    };
    apply();
    reduce.addEventListener("change", apply);
    return () => reduce.removeEventListener("change", apply);
  }, []);

  return <>{children}</>;
}
