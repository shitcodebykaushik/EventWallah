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
    "group relative flex h-full flex-col overflow-hidden rounded-sm border-t-2 p-6 sm:p-7",
    highlight
      ? "border-x border-b border-brand-orange bg-[#fff0e8]"
      : dark
        ? "border-x border-b border-white/15 bg-transparent text-white"
        : "border-x border-b border-navy-900/12 bg-[#fffdf8]",
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
