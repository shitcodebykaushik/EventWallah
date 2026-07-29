"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

import { buttonMotion, springSoft } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Gentle scale on hover/tap — water-soft micro interaction */
export function MotionPressable({
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
      className={cn("will-change-transform", className)}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={springSoft}
    >
      {children}
    </motion.div>
  );
}

export function MotionLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <motion.div
      className="inline-flex will-change-transform"
      whileHover={buttonMotion.whileHover}
      whileTap={buttonMotion.whileTap}
      transition={buttonMotion.transition}
    >
      <Link href={href} className={className}>
        {children}
      </Link>
    </motion.div>
  );
}

export function MotionButton({
  children,
  className,
  type = "button",
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <button
        type={type}
        className={className}
        disabled={disabled}
        onClick={onClick}
      >
        {children}
      </button>
    );
  }

  return (
    <motion.button
      type={type}
      className={cn("will-change-transform", className)}
      disabled={disabled}
      onClick={onClick}
      whileHover={buttonMotion.whileHover}
      whileTap={buttonMotion.whileTap}
      transition={buttonMotion.transition}
    >
      {children}
    </motion.button>
  );
}
