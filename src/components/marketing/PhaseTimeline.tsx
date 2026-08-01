import { phases } from "@/content/phases";
import { cn } from "@/lib/utils";

export function PhaseTimeline({ compact = false }: { compact?: boolean }) {
  return (
    <ol className="relative grid gap-6 sm:gap-8 md:grid-cols-5 md:gap-4">
      <div
        className="absolute top-5 right-[10%] left-[10%] hidden h-px rounded-full bg-linear-to-r from-zinc-200 via-brand-orange/50 to-zinc-200 md:block"
        aria-hidden
      />
      {phases.map((phase, index) => (
        <li
          key={phase.id}
          className="group relative flex flex-col transition-transform duration-300 md:hover:-translate-y-1"
        >
          <div className="mb-3 flex items-center gap-3 sm:mb-4 md:flex-col md:items-start">
            <span
              className={cn(
                "relative z-10 flex size-10 items-center justify-center rounded-sm text-sm font-bold ring-4 ring-white transition-transform duration-300 group-hover:scale-105 sm:size-11",
                index < 3
                  ? "bg-ink text-white"
                  : "bg-brand-orange text-white"
              )}
            >
              {phase.id}
            </span>
            <p className="text-[11px] font-semibold tracking-wide text-zinc-400 uppercase md:mt-4">
              {phase.timing}
            </p>
          </div>
          <h3 className="text-sm font-bold text-ink sm:text-base">
            {phase.title}
          </h3>
          {!compact && (
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              {phase.description}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
