import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim =
    size === "sm" ? "size-8" : size === "lg" ? "size-11" : "size-9";

  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-navy-950 shadow-sm ring-1 ring-navy-900/10",
        dim,
        className
      )}
      aria-hidden
    >
      <span className="absolute inset-0 bg-navy-950" />
      <span className="absolute -bottom-1 -right-1 size-1/2 rounded-full bg-brand-orange blur-[1px]" />
      {/* Ticket cutout and check — the core EventWallah action */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={size === "sm" ? "relative size-3.5" : "relative size-4"}
      >
        <path d="M5 6.5A1.5 1.5 0 0 1 6.5 5h11A1.5 1.5 0 0 1 19 6.5V9a3 3 0 0 0 0 6v2.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 17.5V15a3 3 0 0 0 0-6V6.5Z" fill="#fffdf8" fillOpacity="0.96"/>
        <path d="m9 12 2 2 4-4" stroke="#ff5a1f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  );
}
