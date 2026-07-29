"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { SectionWave, waveFill } from "@/components/marketing/SectionWave";
import { duration, easeWater } from "@/lib/motion";
import { cn } from "@/lib/utils";

type CtaBandProps = {
  title: React.ReactNode;
  description?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  className?: string;
  /** Previous section fill for curved top join */
  waveFrom?: string;
};

export function CtaBand({
  title,
  description,
  primaryHref = "/partner",
  primaryLabel = "Book a discovery call",
  secondaryHref,
  secondaryLabel,
  className,
  waveFrom = waveFill.canvas,
}: CtaBandProps) {
  const reduced = useReducedMotion();

  return (
    <section
      className={cn(
        "relative bg-background pt-20 pb-16 sm:pt-24 sm:pb-20 md:pt-28 md:pb-24",
        className
      )}
    >
      {waveFrom && (
        <SectionWave from={waveFrom} position="top" height="md" />
      )}
      <div className="container-page relative z-[1]">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: duration.long, ease: easeWater }}
          className="relative overflow-hidden rounded-[2rem] border border-navy-800 bg-navy-950 px-6 py-12 text-center sm:px-10 sm:py-16"
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,106,26,0.22),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(47,111,237,0.12),_transparent_45%)]"
            aria-hidden
          />
          <div className="relative mx-auto max-w-2xl">
            <p className="mb-4 text-[11px] font-bold tracking-[0.18em] text-brand-orange uppercase">
              College partnership
            </p>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
              {title}
            </h2>
            {description && (
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-zinc-400">
                {description}
              </p>
            )}
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={primaryHref}
                className="btn-accent h-12 w-full px-7 sm:w-auto"
              >
                {primaryLabel}
                <ArrowRight className="size-4" />
              </Link>
              {secondaryHref && secondaryLabel && (
                <Link
                  href={secondaryHref}
                  className="btn-secondary-dark h-12 w-full px-7 sm:w-auto"
                >
                  {secondaryLabel}
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
