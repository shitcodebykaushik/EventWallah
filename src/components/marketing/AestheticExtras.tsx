"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Building2,
  GraduationCap,
  Mic2,
  Rocket,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

/** Soft floating orbs for ambient depth */
export function AmbientOrbs({ className }: { className?: string }) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden
    >
      <div className="animate-pulse-soft absolute -top-24 -left-16 size-72 rounded-full bg-brand-orange/10 blur-3xl" />
      <div className="animate-float-slow absolute top-1/3 -right-20 size-80 rounded-full bg-brand-blue/10 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 size-64 rounded-full bg-navy-900/5 blur-3xl" />
    </div>
  );
}

/** Dot texture overlay */
export function DotField({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 dot-grid opacity-40",
        className
      )}
      aria-hidden
    />
  );
}

const marqueeItems = [
  { icon: Rocket, label: "Student startups" },
  { icon: GraduationCap, label: "100+ campuses" },
  { icon: Mic2, label: "Investor Grand Pitch" },
  { icon: Users, label: "Mentors & operators" },
  { icon: Trophy, label: "₹10L+ prize pathways" },
  { icon: Building2, label: "NAAC · NIRF · IIC" },
  { icon: Sparkles, label: "Startup India aligned" },
];

/** Infinite aesthetic ticker — Launch Bharat language */
export function BrandMarquee({ className }: { className?: string }) {
  const row = [...marqueeItems, ...marqueeItems];

  return (
    <div
      className={cn(
        "relative overflow-hidden border-b border-navy-900/15 bg-navy-950 py-4 text-white",
        className
      )}
    >
      <div className="marquee-track gap-8 px-4">
        {row.map((item, i) => (
          <span
            key={`${item.label}-${i}`}
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/65"
          >
            <item.icon className="size-3.5 text-brand-orange" />
            {item.label}
            <span className="ml-6 size-1 rounded-full bg-brand-orange/40" />
          </span>
        ))}
      </div>
    </div>
  );
}

/** Floating glass badges around hero / stage */
export function FloatingBadges() {
  const reduced = useReducedMotion();
  const badges = [
    { label: "Day 1 · Sprint", x: "left-[4%] top-[22%]", delay: 0 },
    { label: "Day 2 · Pitch", x: "right-[6%] top-[28%]", delay: 0.15 },
    { label: "Top 15 → Top 5", x: "left-[8%] bottom-[18%]", delay: 0.25 },
    { label: "Warm intros", x: "right-[5%] bottom-[22%]", delay: 0.35 },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden>
      {badges.map((b) => (
        <motion.div
          key={b.label}
          className={cn(
            "absolute rounded-full border border-white/80 bg-white/90 px-3 py-1.5 text-[11px] font-bold text-navy-900 shadow-[var(--shadow-soft)] backdrop-blur-md",
            b.x
          )}
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 + b.delay, duration: 0.6 }}
        >
          <span className="mr-1.5 inline-block size-1.5 rounded-full bg-brand-orange" />
          {b.label}
        </motion.div>
      ))}
    </div>
  );
}

/** Decorative number for section aesthetic */
export function SectionIndex({ n }: { n: string }) {
  return (
    <span
      className="pointer-events-none absolute top-6 right-4 select-none font-heading text-6xl font-extrabold tracking-tighter text-navy-900/[0.04] sm:top-8 sm:right-8 sm:text-7xl md:text-8xl"
      aria-hidden
    >
      {n}
    </span>
  );
}

/** Spotlight ring behind key modules */
export function Spotlight({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute left-1/2 top-0 h-64 w-[min(90%,720px)] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,_rgba(255,106,26,0.12),_transparent_70%)]",
        className
      )}
      aria-hidden
    />
  );
}
