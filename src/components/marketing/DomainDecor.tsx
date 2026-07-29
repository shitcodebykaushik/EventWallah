/** Decorative motifs aligned with Launch Bharat: stage, network, India movement */

import Link from "next/link";

export function OrbitRings({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden>
      <div className="absolute top-1/2 left-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-navy-900/5" />
      <div className="absolute top-1/2 left-1/2 size-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-orange/10" />
      <div className="absolute top-1/2 left-1/2 size-[240px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-blue/10" />
    </div>
  );
}

export function CredentialStrip() {
  const items = [
    { label: "NAAC", sub: "Criterion 3 ready" },
    { label: "NIRF", sub: "Innovation weight" },
    { label: "IIC", sub: "Star rating docs" },
    { label: "Startup India", sub: "Aligned pathways" },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
      {items.map((item) => (
        <div key={item.label} className="credential-chip">
          <span className="flex size-5 items-center justify-center rounded-full bg-navy-900 text-[9px] font-bold text-white">
            {item.label.slice(0, 1)}
          </span>
          <span>
            <span className="text-navy-900">{item.label}</span>
            <span className="ml-1.5 font-medium text-zinc-400">· {item.sub}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export function AudienceRails() {
  const rails = [
    {
      who: "Colleges",
      title: "Rankings, brand, zero chaos",
      points: [
        "NAAC / NIRF / IIC evidence pack",
        "Near-zero cash; in-kind partnership",
        "National PR with your campus at the centre",
      ],
      href: "/for-colleges",
      cta: "See college ROI",
    },
    {
      who: "Students",
      title: "Pitch people who write cheques",
      points: [
        "Jury of VCs, angels & operators",
        "₹10L+ prizes, grants & warm intros",
        "Alumni network across 100+ campuses",
      ],
      href: "/for-students",
      cta: "Student journey",
    },
    {
      who: "Investors",
      title: "Campus deal flow, filtered",
      points: [
        "Only pre-screened top ~5%",
        "Same 5+3 format every campus",
        "Data room live within 24 hours",
      ],
      href: "/program",
      cta: "Pitch format",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {rails.map((rail) => (
        <Link
          key={rail.who}
          href={rail.href}
          className="audience-card group block transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]"
        >
          <p className="text-[11px] font-bold tracking-[0.16em] text-brand-orange uppercase">
            {rail.who}
          </p>
          <h3 className="mt-2 font-heading text-lg font-bold text-navy-900">
            {rail.title}
          </h3>
          <ul className="mt-4 space-y-2">
            {rail.points.map((p) => (
              <li key={p} className="flex items-start gap-2 text-sm text-zinc-500">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-orange/80" />
                {p}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm font-semibold text-navy-900 transition group-hover:text-brand-orange">
            {rail.cta} →
          </p>
        </Link>
      ))}
    </div>
  );
}

export function StageFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="stage-glow pointer-events-none absolute inset-x-0 -bottom-8 h-40" aria-hidden />
      <div className="relative overflow-hidden rounded-[1.75rem] border border-[#c9d5e8] bg-white shadow-[var(--shadow-card)] sm:rounded-[2rem]">
        {/* Stage header bar — event console */}
        <div className="flex items-center justify-between gap-3 border-b border-[#e8eef6] bg-linear-to-r from-navy-950 via-navy-900 to-navy-800 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <span className="size-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-[11px] font-semibold tracking-wide text-white/90 uppercase">
              Live flagship format
            </span>
          </div>
          <div className="hidden items-center gap-3 text-[11px] font-medium text-white/50 sm:flex">
            <span>Day 1 · Sprint</span>
            <span className="text-white/20">|</span>
            <span>Day 2 · Grand Pitch</span>
          </div>
          <span className="rounded-full bg-brand-orange/20 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-brand-orange-light uppercase">
            Investor room
          </span>
        </div>
        <div className="tricolor-bar opacity-70" />
        {children}
      </div>
    </div>
  );
}
