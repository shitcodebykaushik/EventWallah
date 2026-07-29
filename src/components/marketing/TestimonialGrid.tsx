import { Quote } from "lucide-react";

import { testimonials } from "@/content/trackRecord";
import { cn } from "@/lib/utils";

export function TestimonialGrid() {
  return (
    <div>
      <p className="mb-6 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold tracking-wide text-amber-800">
        Illustrative voices · sample framing
      </p>
      <div className="grid gap-5 md:grid-cols-3">
        {testimonials.map((t) => (
          <blockquote
            key={t.initials}
            className={cn(
              "flex h-full flex-col rounded-3xl border p-6 transition-transform duration-300 hover:-translate-y-0.5 sm:p-7",
              t.highlight
                ? "border-zinc-800 bg-ink text-white shadow-[var(--shadow-soft)]"
                : "border-zinc-200 bg-white shadow-[var(--shadow-soft)]"
            )}
          >
            <Quote
              className={cn(
                "mb-4 size-7 opacity-40",
                t.highlight ? "text-brand-orange" : "text-brand-orange"
              )}
            />
            <p
              className={cn(
                "flex-1 text-[15px] leading-relaxed",
                t.highlight ? "text-zinc-200" : "text-zinc-600"
              )}
            >
              “{t.quote}”
            </p>
            <footer className="mt-8 flex items-center gap-3 border-t border-current/10 pt-5">
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-full text-xs font-bold",
                  t.highlight
                    ? "bg-brand-orange text-white"
                    : "bg-ink text-white"
                )}
              >
                {t.initials}
              </span>
              <div>
                <p
                  className={cn(
                    "text-sm font-semibold",
                    t.highlight ? "text-white" : "text-ink"
                  )}
                >
                  {t.role}
                </p>
                <p
                  className={cn(
                    "text-xs",
                    t.highlight ? "text-zinc-400" : "text-zinc-400"
                  )}
                >
                  {t.org}
                </p>
              </div>
            </footer>
          </blockquote>
        ))}
      </div>
    </div>
  );
}
