"use client";

import { motion, useReducedMotion } from "framer-motion";

import { springSoft } from "@/lib/motion";
import { cn } from "@/lib/utils";

type StatCardProps = {
  value: string;
  label: string;
  detail?: string;
  caption?: string;
  highlight?: boolean;
  dark?: boolean;
  className?: string;
  interactive?: boolean;
};

export function StatCard({
  value,
  label,
  detail,
  caption,
  highlight,
  dark,
  className,
  interactive = true,
}: StatCardProps) {
  const reduced = useReducedMotion();

  const content = (
    <>
      <span
        className={cn(
          "pointer-events-none absolute -top-8 -right-8 size-28 rounded-full blur-2xl",
          highlight
            ? "bg-brand-orange/20"
            : dark
              ? "bg-white/5"
              : "bg-brand-blue/10"
        )}
        aria-hidden
      />
      {caption && (
        <p
          className={cn(
            "relative mb-2 text-[11px] font-semibold tracking-wide uppercase",
            dark ? "text-zinc-400" : "text-zinc-400"
          )}
        >
          {caption}
        </p>
      )}
      <p
        className={cn(
          "stat-value relative",
          highlight
            ? "text-gradient-orange"
            : dark
              ? "text-white"
              : "text-navy-900"
        )}
      >
        {value}
      </p>
      <p
        className={cn(
          "relative mt-2 text-sm font-semibold leading-snug sm:text-[0.95rem]",
          dark ? "text-white" : "text-navy-900"
        )}
      >
        {label}
      </p>
      {detail && (
        <p
          className={cn(
            "relative mt-2 text-sm leading-relaxed",
            dark ? "text-zinc-400" : "text-zinc-500"
          )}
        >
          {detail}
        </p>
      )}
    </>
  );

  const classes = cn(
    "group relative flex h-full flex-col overflow-hidden rounded-3xl p-5 sm:p-6 card-shine",
    highlight
      ? "border border-orange-200/90 bg-linear-to-br from-orange-50 via-white to-white shadow-[var(--shadow-soft)] glow-orange"
      : dark
        ? "border border-white/10 bg-navy-900 text-white"
        : "border border-[#dde5f0] bg-white shadow-[var(--shadow-soft)]",
    className
  );

  if (!interactive || reduced) {
    return <article className={classes}>{content}</article>;
  }

  return (
    <motion.article
      className={cn(classes, "will-change-transform")}
      whileHover={{ y: -4, transition: springSoft }}
      whileTap={{ scale: 0.99 }}
    >
      {content}
    </motion.article>
  );
}
