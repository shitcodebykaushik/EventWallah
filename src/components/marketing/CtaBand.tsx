"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

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
}: CtaBandProps) {
  const reduced = useReducedMotion();

  return (
    <section
      className={cn(
        "relative border-t border-navy-900/10 bg-background py-16 sm:py-20 md:py-24",
        className
      )}
    >
      <div className="container-page relative z-[1]">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: duration.long, ease: easeWater }}
          className="relative overflow-hidden border border-navy-950 bg-navy-950 px-6 py-14 text-left sm:px-10 sm:py-16 md:px-16"
        >
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-2 bg-brand-orange"
            aria-hidden
          />
          <div className="relative grid items-end gap-8 md:grid-cols-[1fr_auto]">
            <div>
            <p className="mb-5 text-[10px] font-bold tracking-[0.2em] text-brand-orange uppercase">
              College partnership
            </p>
            <h2 className="max-w-3xl font-heading text-4xl font-extrabold leading-[1.02] tracking-[-0.04em] text-white sm:text-5xl md:text-6xl">
              {title}
            </h2>
            {description && (
              <p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-400">
                {description}
              </p>
            )}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
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
