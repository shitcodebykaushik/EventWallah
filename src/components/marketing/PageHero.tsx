import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
  return (
    <section
      className={cn(
        "relative overflow-hidden border-b",
        dark
          ? "border-white/10 bg-navy-950 text-white"
          : "border-navy-900/15 bg-[#f7f4ed] text-ink",
        className
      )}
    >
      <div className="container-page">
        <div className={cn("flex items-center justify-between border-b py-5 text-[10px] font-bold uppercase tracking-[0.2em]", dark ? "border-white/10 text-white/40" : "border-navy-900/12 text-navy-900/45")}>
          <span>EventWallah · College event platform</span>
          <span className="hidden sm:block">Operated by The Event Wallah</span>
        </div>

        <div className="grid lg:grid-cols-[1fr_280px]">
          <div className={cn("py-14 lg:border-r lg:py-20 lg:pr-16", dark ? "border-white/10" : "border-navy-900/15")}>
            {eyebrow && (
              <p className={cn("eyebrow mb-8", dark && "border-brand-orange text-white/55")}>
                {eyebrow}
              </p>
            )}
            <h1 className={cn("max-w-4xl font-heading text-[2.8rem] font-extrabold leading-[.98] tracking-[-0.045em] sm:text-5xl md:text-7xl", dark ? "text-white" : "text-navy-950")}>
              {title}
            </h1>
            {description && (
              <p className={cn("mt-8 max-w-2xl text-base leading-relaxed sm:text-lg", dark ? "text-white/55" : "text-zinc-600")}>
                {description}
              </p>
            )}
            {(primaryHref || secondaryHref) && (
              <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                {primaryHref && primaryLabel && (
                  <Link href={primaryHref} className={cn(dark ? "btn-accent" : "btn-primary", "h-12 w-full px-6 sm:w-auto")}>
                    {primaryLabel}
                    <ArrowRight className="size-4" />
                  </Link>
                )}
                {secondaryHref && secondaryLabel && (
                  <Link href={secondaryHref} className={cn(dark ? "btn-secondary-dark" : "btn-secondary-light", "h-12 w-full px-6 sm:w-auto")}>
                    {secondaryLabel}
                  </Link>
                )}
              </div>
            )}
          </div>

          <aside className="hidden py-20 pl-9 lg:flex lg:flex-col lg:justify-between">
            <p className={cn("text-[10px] font-bold uppercase tracking-[.2em]", dark ? "text-white/35" : "text-navy-900/35")}>
              Public platform
            </p>
            <div>
              <p className={cn("font-heading text-6xl font-extrabold", dark ? "text-white/10" : "text-navy-900/10")}>
                EW
              </p>
              <p className={cn("mt-4 border-t pt-4 text-sm font-semibold leading-relaxed", dark ? "border-white/15 text-white/65" : "border-navy-900/15 text-navy-900/65")}>
                Verified event information, registration and secure entry passes.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
