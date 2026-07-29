import {
  AmbientOrbs,
  SectionIndex,
} from "@/components/marketing/AestheticExtras";
import {
  SectionWave,
  waveFill,
} from "@/components/marketing/SectionWave";
import { cn } from "@/lib/utils";

type SectionVariant = "light" | "dark" | "muted" | "orange" | "water" | "white";

type SectionProps = {
  id?: string;
  eyebrow?: string;
  title?: React.ReactNode;
  lead?: React.ReactNode;
  children: React.ReactNode;
  variant?: SectionVariant;
  className?: string;
  containerClassName?: string;
  headerClassName?: string;
  align?: "left" | "center";
  /**
   * Background of the section above — enables a curved top join.
   * Use waveFill.* helpers for consistent colors.
   */
  waveFrom?: string;
  /** Optional curved bottom lip color (section below) */
  waveTo?: string;
  waveHeight?: "sm" | "md" | "lg";
  /** Large faded index numeral for aesthetic depth */
  index?: string;
  /** Soft ambient orbs inside the section */
  ambient?: boolean;
};

const variants: Record<SectionVariant, string> = {
  light: "bg-background text-ink",
  white: "bg-white text-ink",
  dark: "bg-mesh-dark text-white",
  muted: "bg-[#f3f6fb] text-ink",
  water: "bg-mesh-water text-ink",
  orange: "bg-brand-orange text-white",
};

export { waveFill };

export function Section({
  id,
  eyebrow,
  title,
  lead,
  children,
  variant = "light",
  className,
  containerClassName,
  headerClassName,
  align = "left",
  waveFrom,
  waveTo,
  waveHeight = "md",
  index,
  ambient = false,
}: SectionProps) {
  const isDark = variant === "dark" || variant === "orange";
  const hasTopWave = Boolean(waveFrom);
  const hasBottomWave = Boolean(waveTo);

  return (
    <section
      id={id}
      className={cn(
        "relative overflow-hidden",
        hasTopWave
          ? "pt-20 sm:pt-24 md:pt-28"
          : "pt-16 sm:pt-20 md:pt-28",
        hasBottomWave
          ? "pb-20 sm:pb-24 md:pb-28"
          : "pb-16 sm:pb-20 md:pb-28",
        variants[variant],
        className
      )}
    >
      {waveFrom && (
        <SectionWave from={waveFrom} position="top" height={waveHeight} />
      )}
      {waveTo && (
        <SectionWave from={waveTo} position="bottom" height={waveHeight} />
      )}
      {ambient && <AmbientOrbs />}
      {index && <SectionIndex n={index} />}

      <div className={cn("container-page relative z-[1]", containerClassName)}>
        {(eyebrow || title || lead) && (
          <header
            className={cn(
              "mb-10 max-w-3xl md:mb-14",
              align === "center" && "mx-auto text-center",
              headerClassName
            )}
          >
            {eyebrow && (
              <p
                className={cn(
                  "eyebrow mb-4",
                  align === "center" && "mx-auto",
                  isDark &&
                    "border-white/15 bg-white/10 text-white/80 shadow-none"
                )}
              >
                {eyebrow}
              </p>
            )}
            {title && (
              <h2
                className={cn("display-section", isDark && "text-white")}
              >
                {title}
              </h2>
            )}
            {lead && (
              <p
                className={cn(
                  "section-lead mt-4 sm:mt-5",
                  isDark && "text-zinc-300",
                  align === "center" && "mx-auto"
                )}
              >
                {lead}
              </p>
            )}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
