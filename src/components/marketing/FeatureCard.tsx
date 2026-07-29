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
      {/* corner accent */}
      <span
        className={cn(
          "pointer-events-none absolute top-0 right-0 size-20 rounded-bl-[2.5rem] opacity-60",
          highlight
            ? "bg-linear-to-bl from-white/10 to-transparent"
            : dark
              ? "bg-linear-to-bl from-white/5 to-transparent"
              : "bg-linear-to-bl from-brand-orange/5 to-transparent"
        )}
        aria-hidden
      />

      {(id || icon) && (
        <div className="relative mb-4 flex items-center gap-3">
          {icon && (
            <span
              className={cn(
                "flex size-11 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105 group-hover:rotate-[-2deg]",
                highlight
                  ? "bg-white/15 text-white ring-1 ring-white/10"
                  : dark
                    ? "bg-white/10 text-white ring-1 ring-white/10"
                    : "bg-linear-to-br from-orange-50 to-white text-brand-orange ring-1 ring-orange-100 shadow-sm"
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
          "pointer-events-none absolute inset-x-5 bottom-0 h-px scale-x-0 bg-linear-to-r from-transparent via-brand-orange/50 to-transparent transition-transform duration-500 group-hover:scale-x-100",
          (highlight || dark) && "via-white/30"
        )}
        aria-hidden
      />
    </>
  );

  const classes = cn(
    "group relative flex h-full flex-col overflow-hidden rounded-3xl p-5 sm:p-6 card-shine",
    highlight
      ? "border border-transparent bg-linear-to-br from-navy-900 to-navy-950 text-white shadow-[var(--shadow-soft)]"
      : dark
        ? "border border-white/10 bg-navy-900/80 text-white"
        : "border border-[#dde5f0] bg-white shadow-[var(--shadow-soft)]",
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
