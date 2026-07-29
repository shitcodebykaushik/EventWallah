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
        "relative inline-flex items-center justify-center overflow-hidden rounded-2xl bg-navy-900 shadow-sm ring-1 ring-navy-900/10",
        dim,
        className
      )}
      aria-hidden
    >
      <span className="absolute inset-0 bg-linear-to-br from-brand-orange via-brand-orange to-brand-orange-dark" />
      <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.4)_0%,transparent_48%)]" />
      {/* Launch pad / rocket — movement metaphor */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={size === "sm" ? "relative size-3.5" : "relative size-4"}
      >
        <path
          d="M12 3c2.5 2.2 4 5.2 4 9.2 0 1.4-.2 2.7-.6 3.8L12 21l-3.4-5c-.4-1.1-.6-2.4-.6-3.8C8 8.2 9.5 5.2 12 3z"
          fill="white"
          fillOpacity="0.95"
        />
        <circle cx="12" cy="11" r="1.6" fill="#0b1b3a" fillOpacity="0.35" />
        <path
          d="M9.2 14.5c-1.2.4-2.4 1.2-3.2 2.2.9.3 1.9.5 2.9.5h.6c-.2-.8-.3-1.7-.3-2.7zM14.8 14.5c1.2.4 2.4 1.2 3.2 2.2-.9.3-1.9.5-2.9.5h-.6c.2-.8.3-1.7.3-2.7z"
          fill="white"
          fillOpacity="0.55"
        />
      </svg>
    </span>
  );
}
