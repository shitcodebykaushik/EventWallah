"use client";

import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

/**
 * Ambient floating water orbs — pure CSS transform animation.
 * Decorative only; no layout impact.
 */
export function WaterBackground({
  className,
  intensity = "medium",
}: {
  className?: string;
  intensity?: "soft" | "medium" | "strong";
}) {
  const reduced = useReducedMotion();
  const opacity =
    intensity === "soft" ? 0.35 : intensity === "strong" ? 0.65 : 0.5;

  if (reduced) {
    return (
      <div
        className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
        aria-hidden
      >
        <div className="absolute top-[-10%] left-[-5%] size-[42%] rounded-full bg-water-400/20 blur-[80px]" />
        <div className="absolute right-[-8%] bottom-[-15%] size-[48%] rounded-full bg-water-500/15 blur-[90px]" />
      </div>
    );
  }

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden
      style={{ opacity }}
    >
      <motion.div
        className="absolute top-[-15%] left-[-10%] size-[50%] rounded-full bg-water-400/30 blur-[90px] will-change-transform"
        animate={{ x: [0, 40, -20, 0], y: [0, 30, 15, 0], scale: [1, 1.08, 0.96, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[20%] right-[-15%] size-[45%] rounded-full bg-water-500/25 blur-[100px] will-change-transform"
        animate={{ x: [0, -35, 25, 0], y: [0, 40, -20, 0], scale: [1, 0.94, 1.06, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-20%] left-[20%] size-[55%] rounded-full bg-brand-blue/15 blur-[110px] will-change-transform"
        animate={{ x: [0, 30, -40, 0], y: [0, -25, 20, 0], scale: [1, 1.05, 0.98, 1] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Soft caustic shimmer band */}
      <motion.div
        className="absolute inset-x-0 top-1/3 h-32 bg-linear-to-r from-transparent via-white/5 to-transparent blur-2xl will-change-transform"
        animate={{ x: ["-20%", "20%", "-20%"], opacity: [0.2, 0.45, 0.2] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
