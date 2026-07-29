"use client";

import {
  motion,
  useReducedMotion,
  type HTMLMotionProps,
} from "framer-motion";

import { duration, easeWater, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";

type FadeInProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
  /** water | fade | scale */
  variant?: "water" | "fade" | "scale";
} & Omit<HTMLMotionProps<"div">, "children">;

/**
 * Premium scroll reveal — slow, fluid, GPU-friendly.
 */
export function FadeIn({
  children,
  className,
  delay = 0,
  y = 20,
  once = true,
  variant = "water",
  ...props
}: FadeInProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  const initial =
    variant === "fade"
      ? { opacity: 0 }
      : variant === "scale"
        ? { opacity: 0, scale: 0.97 }
        : { opacity: 0, y };

  const animate =
    variant === "fade"
      ? { opacity: 1 }
      : variant === "scale"
        ? { opacity: 1, scale: 1 }
        : { opacity: 1, y: 0 };

  return (
    <motion.div
      className={cn("will-change-[opacity,transform]", className)}
      initial={initial}
      whileInView={animate}
      viewport={{ once, margin: "-8% 0px -8% 0px", amount: 0.15 }}
      transition={{
        duration: duration.medium,
        delay,
        ease: easeWater,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-6% 0px", amount: 0.12 }}
      variants={{
        ...staggerContainer,
        show: {
          transition: {
            staggerChildren: 0.1,
            delayChildren: delay + 0.05,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn("will-change-[opacity,transform]", className)}
      variants={{
        hidden: { opacity: 0, y: 22 },
        show: {
          opacity: 1,
          y: 0,
          transition: {
            duration: duration.medium,
            ease: easeWater,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/** Continuous gentle float — for decorative badges */
export function Float({
  children,
  className,
  amplitude = 8,
  durationSec = 5,
}: {
  children: React.ReactNode;
  className?: string;
  amplitude?: number;
  durationSec?: number;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn("will-change-transform", className)}
      animate={{ y: [0, -amplitude, 0] }}
      transition={{
        duration: durationSec,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
}
