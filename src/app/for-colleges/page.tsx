import type { Metadata } from "next";

import { ComparisonTable } from "@/components/marketing/ComparisonTable";
import { CtaBand } from "@/components/marketing/CtaBand";
import { FeatureCard } from "@/components/marketing/FeatureCard";
import { PageHero } from "@/components/marketing/PageHero";
import { RoiSplit } from "@/components/marketing/RoiSplit";
import { Section } from "@/components/marketing/Section";
import { institutionBenefits, rankingImpact } from "@/content/benefits";
import { collegeProvides, launchProvides } from "@/content/roi";

export const metadata: Metadata = {
  title: "For Colleges",
  description:
    "NAAC, NIRF, and IIC-ready innovation activity with near-zero cash cost and national brand amplification.",
};

export default function ForCollegesPage() {
  return (
    <>
      <PageHero
        eyebrow="For colleges & universities"
        title={
          <>
            Host a national founder stage —{" "}
            <span className="text-brand-orange">
              with rankings paperwork included.
            </span>
          </>
        }
        description="Turnkey flagship weekend for NAAC, NIRF, and IIC documentation, placement exposure, and national PR — designed for near-zero cash cost through in-kind partnership."
        primaryHref="/partner"
        primaryLabel="Become an anchor campus"
        secondaryHref="/program"
        secondaryLabel="See the program"
      />

      <Section>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl bg-navy-950 p-8 text-white">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-orange">
              Ranking impact
            </p>
            <h2 className="mt-3 font-heading text-2xl font-bold sm:text-3xl">
              Documented, audit-ready innovation activity for{" "}
              <span className="text-brand-orange">NAAC · NIRF · IIC.</span>
            </h2>
            <ul className="mt-8 space-y-4">
              {rankingImpact.map((row) => (
                <li
                  key={row.label}
                  className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 text-sm"
                >
                  <span className="text-slate-300">{row.label}</span>
                  <span
                    className={
                      row.status === "Automatic" || row.status === "Complete"
                        ? "font-semibold text-brand-orange"
                        : "font-semibold text-emerald-400"
                    }
                  >
                    {row.status === "Improves" ? "↑ Improves" : row.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {institutionBenefits.map((b) => (
              <FeatureCard
                key={b.id}
                id={b.id}
                title={b.title}
                description={b.detail}
              />
            ))}
          </div>
        </div>
      </Section>

      <Section
        variant="muted"
        eyebrow="14 — Return on partnership"
        title={
          <>
            The math works —{" "}
            <span className="text-brand-orange">
              before it works emotionally.
            </span>
          </>
        }
        lead="What a typical college invests vs. what it gets back — measured, not implied."
      >
        <RoiSplit />
      </Section>

      <Section
        eyebrow="17 — Logistics & infrastructure"
        title="A clean division of responsibility."
        lead="Colleges provide the physical stage. Launch Bharat provides the operation."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              College provides
            </h3>
            <ul className="mt-5 space-y-5">
              {collegeProvides.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <span className="text-sm font-bold text-brand-orange">
                    {item.id}
                  </span>
                  <div>
                    <p className="font-semibold text-navy-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-navy-950 p-6 text-white">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-orange">
              Launch Bharat provides
            </h3>
            <ul className="mt-5 space-y-5">
              {launchProvides.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <span className="text-sm font-bold text-brand-orange">
                    {item.id}
                  </span>
                  <div>
                    <p className="font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-300">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section
        variant="muted"
        eyebrow="18 — Why partner with us"
        title={
          <>
            Others host an event.{" "}
            <span className="text-brand-orange">
              We build a movement on your campus.
            </span>
          </>
        }
      >
        <ComparisonTable />
      </Section>

      <CtaBand
        title="Join the first 100 anchor colleges."
        description="Priority cohort: IITs · IIMs · NITs · NAAC A+ and top private institutions."
        primaryLabel="Request partnership"
      />
    </>
  );
}
