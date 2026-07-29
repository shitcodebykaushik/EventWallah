"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Mic2,
  Presentation,
  Trophy,
  Users,
} from "lucide-react";

import {
  AmbientOrbs,
  DotField,
  FloatingBadges,
  Spotlight,
} from "@/components/marketing/AestheticExtras";
import { OrbitRings, StageFrame } from "@/components/marketing/DomainDecor";
import { duration, easeWater, springSoft } from "@/lib/motion";
import { site } from "@/content/site";
import { yearOneImpact } from "@/content/stats";
import { cn } from "@/lib/utils";

export function HomeHero() {
  const reduced = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-mesh-water pb-16 pt-10 sm:pb-20 sm:pt-12 lg:pb-24 lg:pt-14">
      <OrbitRings className="pointer-events-none absolute inset-0 opacity-70" />
      <AmbientOrbs />
      <DotField className="opacity-30" />
      <Spotlight className="top-8 opacity-80" />
      <div
        className="pointer-events-none absolute inset-0 bg-grid-light opacity-30"
        aria-hidden
      />

      <div className="container-page relative z-[1]">
        <div className="mx-auto max-w-4xl text-center">
          <motion.h1
            initial={reduced ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: duration.long,
              delay: 0.08,
              ease: easeWater,
            }}
            className="display-hero text-navy-900"
          >
            Every campus can be
            <br />
            <span className="text-gradient-orange">an innovation hub.</span>
          </motion.h1>

          <motion.p
            initial={reduced ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: duration.medium,
              delay: 0.16,
              ease: easeWater,
            }}
            className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#5b6b82] sm:mt-6 sm:text-lg"
          >
            Launch Bharat is India&apos;s student startup movement — a turnkey
            campus program that gives founders mentors, capital pathways, and a
            real investor stage. Colleges host. We produce. Students launch.
          </motion.p>

          <motion.div
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: duration.medium,
              delay: 0.22,
              ease: easeWater,
            }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-9 sm:flex-row"
          >
            <Link
              href="/partner"
              className="btn-primary h-12 w-full bg-navy-900 px-7 sm:w-auto"
            >
              Partner your campus
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/program"
              className="btn-secondary-light h-12 w-full px-7 sm:w-auto"
            >
              <Mic2 className="size-4 text-brand-orange" />
              See the pitch stage
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: duration.long,
            delay: 0.28,
            ease: easeWater,
          }}
          className="relative mx-auto mt-12 max-w-5xl sm:mt-16"
        >
          <FloatingBadges />
          <StageFrame>
            <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="border-b border-[#e8eef6] p-5 sm:p-6 lg:border-r lg:border-b-0">
                <div className="flex items-center gap-2">
                  <Presentation className="size-4 text-brand-orange" />
                  <p className="text-[11px] font-bold tracking-[0.14em] text-zinc-400 uppercase">
                    48-hour campus flagship
                  </p>
                </div>
                <h2 className="mt-2 font-heading text-xl font-bold tracking-tight text-navy-900 sm:text-2xl">
                  Build on Day 1. Pitch investors on Day 2.
                </h2>

                <div className="mt-5 space-y-3">
                  {[
                    {
                      icon: Users,
                      t: "Day 1 · Innovation Challenge",
                      d: "Sealed industry problems, four-hour sprint, jury demos — Top 15 locked.",
                    },
                    {
                      icon: Mic2,
                      t: "Day 2 · Grand Pitch",
                      d: "Keynotes, VC panel, 5+3 pitches live to investors, 50+ expo booths.",
                    },
                    {
                      icon: Trophy,
                      t: "After · Capital pathway",
                      d: "Incubators, angel intros, grants, and a rankings-ready impact pack.",
                    },
                  ].map((row) => (
                    <div
                      key={row.t}
                      className="flex gap-3 rounded-2xl border border-[#e8eef6] bg-[#f7f9fc] p-3.5"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-white">
                        <row.icon className="size-4" />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-navy-900">{row.t}</p>
                        <p className="mt-0.5 text-sm leading-snug text-zinc-500">
                          {row.d}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-linear-to-b from-[#f7f9fc] to-white p-5 sm:p-6">
                <p className="text-[11px] font-bold tracking-[0.14em] text-zinc-400 uppercase">
                  Year-1 targets (national)
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {yearOneImpact.map((stat) => (
                    <motion.div
                      key={stat.label}
                      whileHover={
                        reduced ? undefined : { y: -2, transition: springSoft }
                      }
                      className={cn(
                        "rounded-2xl border p-3.5 sm:p-4",
                        stat.highlight
                          ? "border-orange-200 bg-linear-to-br from-orange-50 to-white"
                          : "border-[#e8eef6] bg-white"
                      )}
                    >
                      <p
                        className={cn(
                          "font-heading text-2xl font-extrabold tracking-tight sm:text-[1.75rem]",
                          stat.highlight ? "text-brand-orange" : "text-navy-900"
                        )}
                      >
                        {stat.value}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-navy-900">
                        {stat.label}
                      </p>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-4 rounded-2xl border border-navy-900/10 bg-navy-950 px-4 py-3 text-center">
                  <p className="text-[11px] font-medium text-white/60">
                    Produced by{" "}
                    <span className="font-semibold text-white">
                      {site.poweredBy.name}
                    </span>{" "}
                    · {site.scarcity.slots} anchor slots · {site.scarcity.season}
                  </p>
                </div>
              </div>
            </div>
          </StageFrame>
        </motion.div>
      </div>
    </section>
  );
}
