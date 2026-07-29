"use client";

import { motion, useScroll, useSpring, useReducedMotion } from "framer-motion";
import { ArrowUp } from "lucide-react";

import { springSoft } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function ScrollToTop() {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    mass: 0.5,
  });

  return (
    <motion.button
      type="button"
      aria-label="Scroll to top"
      onClick={() =>
        window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" })
      }
      className={cn(
        "fixed right-5 bottom-6 z-40 flex size-11 items-center justify-center rounded-2xl border border-white/15 bg-navy-900/80 text-white shadow-2xl backdrop-blur-xl transition-colors hover:bg-navy-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-water-400 sm:right-8 sm:bottom-8",
        "will-change-transform"
      )}
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      style={{
        opacity: smoothProgress,
        scale: smoothProgress,
        pointerEvents: smoothProgress.get() > 0.08 ? "auto" as const : "none" as const,
      }}
      whileHover={reduced ? undefined : { scale: 1.08, transition: springSoft }}
      whileTap={reduced ? undefined : { scale: 0.92 }}
    >
      <ArrowUp className="size-4" />
    </motion.button>
  );
}
