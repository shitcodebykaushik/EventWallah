import { waveFill } from "@/components/marketing/SectionWave";
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
  white: "bg-[#fffdf8] text-ink",
  dark: "bg-mesh-dark text-white",
  muted: "bg-[#eeebe3] text-ink",
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
}: SectionProps) {
  const isDark = variant === "dark" || variant === "orange";

  return (
    <section
      id={id}
      className={cn(
        "relative overflow-hidden border-t border-navy-900/10 py-18 sm:py-24 md:py-32",
        isDark && "border-white/10",
        variants[variant],
        className
      )}
    >
      <div className={cn("container-page relative z-[1]", containerClassName)}>
        {(eyebrow || title || lead) && (
          <header
            className={cn(
              "mb-10 max-w-4xl md:mb-14",
              align === "center" && "mx-auto text-center",
              headerClassName
            )}
          >
            {eyebrow && (
              <p
                className={cn(
                  "eyebrow mb-6",
                  align === "center" && "mx-auto",
                  isDark &&
                    "border-brand-orange text-white/55"
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
