"use client";

import { motion, useReducedMotion } from "framer-motion";

import { springSoft } from "@/lib/motion";
import { cn } from "@/lib/utils";

type FeatureCardProps = {
  id?: string;
  title: string;
  description: string;
  meta?: string;
  highlight?: boolean;
  dark?: boolean;
  className?: string;
  icon?: React.ReactNode;
};

export function FeatureCard({
  id,
  title,
  description,
  meta,
  highlight,
  dark,
  className,
  icon,
}: FeatureCardProps) {
  const reduced = useReducedMotion();

  const content = (
    <>
      {(id || icon) && (
        <div className="relative mb-4 flex items-center gap-3">
          {icon && (
            <span
              className={cn(
                "flex size-10 items-center justify-center rounded-sm transition-colors duration-300",
                highlight
                  ? "bg-white text-navy-950"
                  : dark
                    ? "border border-white/20 text-white"
                    : "bg-navy-950 text-white"
              )}
            >
              {icon}
            </span>
          )}
          {id && (
            <p
              className={cn(
                "text-[11px] font-bold tracking-wide uppercase",
                highlight || dark ? "text-white/70" : "text-zinc-400"
              )}
            >
              {id}
            </p>
          )}
        </div>
      )}
      <h3
        className={cn(
          "relative text-base font-bold leading-snug sm:text-lg",
          highlight || dark ? "text-white" : "text-navy-900"
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          "relative mt-2 flex-1 text-sm leading-relaxed",
          highlight
            ? "text-white/90"
            : dark
              ? "text-zinc-400"
              : "text-zinc-500"
        )}
      >
        {description}
      </p>
      {meta && (
        <p
          className={cn(
            "relative mt-5 text-[11px] font-semibold tracking-wide uppercase",
            highlight || dark ? "text-white/60" : "text-zinc-400"
          )}
        >
          {meta}
        </p>
      )}
      {/* bottom accent line */}
      <span
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-0.5 scale-x-0 origin-left bg-brand-orange transition-transform duration-500 group-hover:scale-x-100",
          (highlight || dark) && "via-white/30"
        )}
        aria-hidden
      />
    </>
  );

  const classes = cn(
    "group relative flex h-full min-h-[220px] flex-col overflow-hidden rounded-sm border-t-2 p-6 sm:p-7",
    highlight
      ? "border-x border-b border-brand-orange bg-brand-orange text-white"
      : dark
        ? "border-x border-b border-white/15 bg-transparent text-white"
        : "border-x border-b border-navy-900/12 bg-[#fffdf8]",
    className
  );

  if (reduced) {
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
