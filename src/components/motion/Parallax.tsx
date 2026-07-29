"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useRef } from "react";

import { cn } from "@/lib/utils";

type ParallaxProps = {
  children: React.ReactNode;
  className?: string;
  /** Positive = moves slower (recedes); negative = advances */
  offset?: number;
  speed?: number;
};

/**
 * Subtle scroll parallax using transform only.
 * Respects prefers-reduced-motion.
 */
export function Parallax({
  children,
  className,
  offset = 40,
  speed = 1,
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const rawY = useTransform(
    scrollYProgress,
    [0, 1],
    [offset * speed, -offset * speed]
  );
  const y = useSpring(rawY, { stiffness: 80, damping: 28, mass: 0.6 });

  if (reduced) {
    return (
      <div ref={ref} className={cn(className)}>
        {children}
      </div>
    );
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <motion.div style={{ y, willChange: "transform" }} className="h-full w-full">
        {children}
      </motion.div>
    </div>
  );
}

/** Parallax layer driven by external scroll progress (for nested heroes) */
export function ParallaxLayer({
  y,
  children,
  className,
}: {
  y: MotionValue<number>;
  children: React.ReactNode;
  className?: string;
}) {
  const springY = useSpring(y, { stiffness: 90, damping: 30, mass: 0.55 });
  return (
    <motion.div
      style={{ y: springY, willChange: "transform" }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
