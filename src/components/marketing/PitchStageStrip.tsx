"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Flame,
  Mic2,
  Rocket,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";

import { journeySteps, journeyBar } from "@/content/agenda";
import { pitchStageMeta } from "@/content/copy";
import { duration, easeWater, springSoft } from "@/lib/motion";
import { cn } from "@/lib/utils";

const icons = [Users, Sparkles, Mic2, Trophy, Flame, Rocket] as const;

const stageColors = [
  "from-navy-900 to-navy-800",
  "from-navy-800 to-navy-700",
  "from-[#1a3a6b] to-[#2f6fed]",
  "from-brand-orange to-brand-orange-dark",
  "from-[#c2410c] to-brand-orange",
  "from-brand-orange-light to-brand-orange",
];

/**
 * Visual pitch-stage storyboard:
 * Register → Ideate → Pitch → Grand Pitch → Incubate → Launch
 */
export function PitchStageStrip({
  showMeta = true,
  className,
}: {
  showMeta?: boolean;
  className?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <div className={cn("w-full", className)}>
      {/* Stage board */}
      <div className="relative overflow-hidden rounded-sm border border-navy-900/20 bg-[#fffdf8]">
        {/* Console header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8eef6] bg-linear-to-r from-navy-950 via-navy-900 to-navy-800 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
            </span>
            <p className="text-[11px] font-bold tracking-[0.16em] text-white uppercase">
              Pitch stage · Founder funnel
            </p>
          </div>
          <p className="text-[11px] font-medium text-white/50">
            Same format · Every partner campus
          </p>
        </div>

        <div className="tricolor-bar opacity-70" />

        {/* Horizontal steps — scroll on mobile */}
        <div className="relative p-4 sm:p-6">
          {/* Connector line (desktop) */}
          <div
            className="pointer-events-none absolute top-[4.75rem] right-10 left-10 hidden h-0.5 bg-linear-to-r from-navy-900 via-brand-orange to-brand-orange-light md:block"
            aria-hidden
          />

          <ol className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-6 md:gap-3 md:overflow-visible md:pb-0">
            {journeySteps.map((step, i) => {
              const Icon = icons[i] ?? Rocket;
              const highlight = Boolean(step.highlight);
              return (
                <motion.li
                  key={step.id}
                  initial={reduced ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{
                    duration: duration.medium,
                    delay: i * 0.06,
                    ease: easeWater,
                  }}
                  whileHover={
                    reduced ? undefined : { y: -4, transition: springSoft }
                  }
                  className="relative min-w-[9.5rem] flex-1 snap-center md:min-w-0"
                >
                  <article
                    className={cn(
                      "flex h-full flex-col rounded-sm border p-4 transition-colors",
                      highlight
                        ? "border-brand-orange bg-[#fff0e8]"
                        : "border-navy-900/12 bg-[#f7f4ed] hover:border-navy-900/30 hover:bg-white"
                    )}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span
                        className={cn(
                          "relative z-10 flex size-10 items-center justify-center rounded-sm bg-linear-to-br text-white",
                          stageColors[i]
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <span
                        className={cn(
                          "font-heading text-lg font-extrabold tabular-nums",
                          highlight ? "text-brand-orange" : "text-navy-900/25"
                        )}
                      >
                        {step.id}
                      </span>
                    </div>

                    <h3
                      className={cn(
                        "text-base font-bold",
                        highlight ? "text-brand-orange-dark" : "text-navy-900"
                      )}
                    >
                      {step.title}
                    </h3>
                    <p className="mt-1.5 flex-1 text-xs leading-relaxed text-zinc-500">
                      {step.detail}
                    </p>
                    <p
                      className={cn(
                        "mt-3 inline-flex w-fit rounded-sm px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase",
                        highlight
                          ? "bg-brand-orange text-white"
                          : "bg-navy-900/5 text-navy-900/70"
                      )}
                    >
                      {step.meta}
                    </p>
                  </article>

                  {/* Arrow between cards on desktop */}
                  {i < journeySteps.length - 1 && (
                    <ArrowRight
                      className="pointer-events-none absolute top-1/2 -right-2 z-20 hidden size-4 -translate-y-1/2 text-brand-orange/50 md:block"
                      aria-hidden
                    />
                  )}
                </motion.li>
              );
            })}
          </ol>

          <p className="mt-3 text-center text-[11px] text-zinc-400 md:hidden">
            Swipe to follow the full stage →
          </p>
        </div>

        {/* Meta bar */}
        {showMeta && (
          <div className="grid grid-cols-2 gap-px border-t border-[#e8eef6] bg-[#e8eef6] sm:grid-cols-4">
            {journeyBar.map((item) => (
              <div
                key={item.label}
                className="bg-white px-4 py-3.5 text-center sm:text-left"
              >
                <p className="text-[10px] font-bold tracking-wide text-zinc-400 uppercase">
                  {item.label}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-navy-900 sm:text-sm">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Compact legend chips */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {[
          pitchStageMeta.prize,
          pitchStageMeta.jury,
          pitchStageMeta.media,
          pitchStageMeta.fee,
        ].map((chip) => (
          <span
            key={chip}
            className="rounded-sm border border-navy-900/15 bg-transparent px-3 py-1 text-[10px] font-semibold text-navy-900/65"
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}
