import { cn } from "@/lib/utils";

/** Palette fills for seamless curved section joins */
export const waveFill = {
  canvas: "#f7f9fc",
  white: "#ffffff",
  muted: "#f3f6fb",
  dark: "#06101f",
  navy: "#0b1b3a",
} as const;

type SectionWaveProps = {
  /** Color of the section ABOVE (fills the curved “lip”) */
  from: string;
  /** Flip for bottom-edge wave */
  position?: "top" | "bottom";
  className?: string;
  /** Taller curve on large screens */
  height?: "sm" | "md" | "lg";
};

/**
 * Soft curved join between sections — replaces hard straight cuts.
 * Place at the top of a section; `from` = previous section background.
 */
export function SectionWave({
  from,
  position = "top",
  className,
  height = "md",
}: SectionWaveProps) {
  const h =
    height === "sm"
      ? "h-7 sm:h-9"
      : height === "lg"
        ? "h-12 sm:h-16 md:h-20"
        : "h-9 sm:h-12 md:h-14";

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 z-[2] w-full overflow-hidden leading-[0]",
        position === "top" ? "top-0 -translate-y-px" : "bottom-0 translate-y-px",
        className
      )}
      aria-hidden
    >
      <svg
        className={cn("block w-full", h, position === "bottom" && "rotate-180")}
        viewBox="0 0 1440 96"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Smooth double-hump curve — reads as a soft wave, not a straight cut */}
        <path
          d="M0 0
             C 180 0, 240 72, 420 72
             C 600 72, 660 24, 840 28
             C 1020 32, 1080 80, 1260 76
             C 1380 74, 1420 40, 1440 32
             L 1440 0
             L 0 0
             Z"
          fill={from}
        />
      </svg>
    </div>
  );
}

/** Standalone full-width wave band (between freehand sections) */
export function WaveBand({
  from,
  to,
  height = "md",
}: {
  from: string;
  to: string;
  height?: "sm" | "md" | "lg";
}) {
  const h =
    height === "sm"
      ? "h-8 sm:h-10"
      : height === "lg"
        ? "h-14 sm:h-18 md:h-20"
        : "h-10 sm:h-12 md:h-16";

  return (
    <div
      className={cn("relative w-full overflow-hidden leading-[0]", h)}
      style={{ backgroundColor: to }}
      aria-hidden
    >
      <svg
        className="absolute inset-0 block h-full w-full"
        viewBox="0 0 1440 96"
        preserveAspectRatio="none"
      >
        <path
          d="M0 0
             C 200 8, 280 88, 480 80
             C 680 72, 760 16, 960 24
             C 1160 32, 1240 88, 1440 64
             L 1440 0
             Z"
          fill={from}
        />
      </svg>
    </div>
  );
}
