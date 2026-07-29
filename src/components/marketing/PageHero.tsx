"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { duration, easeWater } from "@/lib/motion";
import { cn } from "@/lib/utils";

type PageHeroProps = {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  dark?: boolean;
  className?: string;
};

export function PageHero({
  eyebrow,
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  dark = false,
  className,
}: PageHeroProps) {
  const reduced = useReducedMotion();

  return (
    <section
      className={cn(
        "relative overflow-hidden py-14 sm:py-16 md:py-24",
        dark ? "bg-mesh-dark text-white" : "bg-mesh-water text-ink",
        className
      )}
    >
      {!dark && (
        <>
          <div
            className="pointer-events-none absolute inset-0 bg-grid-light opacity-40"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -top-20 right-0 size-72 rounded-full bg-brand-orange/10 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute bottom-0 left-0 size-64 rounded-full bg-brand-blue/8 blur-3xl"
            aria-hidden
          />
        </>
      )}
      {dark && (
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,106,26,0.15),_transparent_50%)]"
          aria-hidden
        />
      )}
      <div className="container-page relative max-w-3xl">
        {eyebrow && (
          <motion.p
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: duration.medium, ease: easeWater }}
            className={cn(
              "eyebrow mb-5",
              dark && "border-white/15 bg-white/10 text-white/80 shadow-none"
            )}
          >
            {eyebrow}
          </motion.p>
        )}
        <motion.h1
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: duration.long,
            delay: 0.05,
            ease: easeWater,
          }}
          className={cn(
            "font-heading text-[2.15rem] font-extrabold leading-[1.08] tracking-[-0.03em] sm:text-4xl md:text-5xl",
            dark ? "text-white" : "text-ink"
          )}
        >
          {title}
        </motion.h1>
        {description && (
          <motion.p
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: duration.medium,
              delay: 0.12,
              ease: easeWater,
            }}
            className={cn(
              "mt-5 max-w-2xl text-base leading-relaxed sm:text-lg",
              dark ? "text-zinc-300" : "text-zinc-500"
            )}
          >
            {description}
          </motion.p>
        )}
        {(primaryHref || secondaryHref) && (
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: duration.medium,
              delay: 0.18,
              ease: easeWater,
            }}
            className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row"
          >
            {primaryHref && primaryLabel && (
              <Link
                href={primaryHref}
                className={cn(
                  dark ? "btn-accent" : "btn-primary",
                  "h-11 w-full justify-center px-5 sm:w-auto"
                )}
              >
                {primaryLabel}
                <ArrowRight className="size-4" />
              </Link>
            )}
            {secondaryHref && secondaryLabel && (
              <Link
                href={secondaryHref}
                className={cn(
                  dark ? "btn-secondary-dark" : "btn-secondary-light",
                  "h-11 w-full justify-center px-5 sm:w-auto"
                )}
              >
                {secondaryLabel}
              </Link>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}
