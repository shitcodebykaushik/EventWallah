import type { Metadata } from "next";

import { CtaBand } from "@/components/marketing/CtaBand";
import { PageHero } from "@/components/marketing/PageHero";
import { Section } from "@/components/marketing/Section";
import { StatCard } from "@/components/marketing/StatCard";
import { marketCascade, postEventNote } from "@/content/impact-extra";
import {
  campusKpis,
  mediaReach,
  operatorStats,
  yearOneImpact,
} from "@/content/stats";
import { postEventAssets } from "@/content/trackRecord";

export const metadata: Metadata = {
  title: "Impact",
  description:
    "Year-1 national targets, per-campus KPIs, media reach, and Event Wallah operator track record.",
};

export default function ImpactPage() {
  return (
    <>
      <PageHero
        eyebrow="Impact"
        title={
          <>
            We don&apos;t chase applause. We chase{" "}
            <span className="text-brand-orange">measurable outcomes.</span>
          </>
        }
        description="Every partner college receives a Year-1 impact report — audited and shareable — across engagement, startups, investor follow-ups, media, and ranking movement."
        primaryHref="/partner"
        primaryLabel="Partner for Year 1"
      />

      <Section
        eyebrow="07 — Year 1 impact"
        title={
          <>
            The scale we&apos;re building — in{" "}
            <span className="text-brand-orange">one year.</span>
          </>
        }
        lead="National targets for the 2024–25 foundation year."
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {yearOneImpact.map((stat) => (
            <StatCard
              key={stat.label}
              value={stat.value}
              label={stat.label}
              detail={stat.detail}
              highlight={stat.highlight}
            />
          ))}
        </div>
      </Section>

      <Section
        variant="muted"
        eyebrow="21 — Success metrics"
        title="Per-campus KPIs"
        lead="Target outcomes each partner institution is designed to track."
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {campusKpis.map((kpi) => (
            <article
              key={kpi.id}
              className={
                kpi.highlight
                  ? "rounded-2xl bg-brand-orange p-5 text-white"
                  : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              }
            >
              <p
                className={
                  kpi.highlight
                    ? "text-xs font-semibold text-orange-100"
                    : "text-xs font-semibold text-slate-500"
                }
              >
                {kpi.id}
              </p>
              <p
                className={
                  kpi.highlight
                    ? "mt-2 text-sm font-semibold text-white"
                    : "mt-2 text-sm font-semibold text-navy-900"
                }
              >
                {kpi.title}
              </p>
              <p
                className={
                  kpi.highlight
                    ? "mt-3 font-heading text-3xl font-bold text-white"
                    : "mt-3 font-heading text-3xl font-bold text-navy-900"
                }
              >
                {kpi.value}
              </p>
              <p
                className={
                  kpi.highlight
                    ? "mt-2 text-xs text-orange-50"
                    : "mt-2 text-xs text-slate-600"
                }
              >
                {kpi.detail}
              </p>
            </article>
          ))}
        </div>
      </Section>

      <Section
        variant="dark"
        eyebrow="15 — Brand & media reach"
        title={
          <>
            Your campus.{" "}
            <span className="text-brand-orange">On the national stage.</span>
          </>
        }
        lead="Every partner college is placed at the centre of a national marketing engine — not a footnote."
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {mediaReach.map((stat) => (
            <StatCard
              key={stat.value}
              value={stat.value}
              label={stat.label}
              caption={stat.caption}
              dark
              highlight={stat.value === "15+"}
            />
          ))}
        </div>
        <p className="mt-8 text-sm text-slate-300">
          <span className="font-semibold text-white">
            Post-event brand assets:{" "}
          </span>
          {postEventAssets.join(" · ")}.
        </p>
      </Section>

      <Section
        eyebrow="Market"
        title="A market bigger than most nations combined."
        lead="Illustrative TAM cascade for Launch Bharat's college-first go-to-market."
      >
        <div className="grid gap-5 md:grid-cols-3">
          {marketCascade.map((row) => (
            <StatCard
              key={row.tier}
              value={row.value}
              label={row.detail}
              caption={row.tier}
              highlight={row.value.startsWith("500")}
            />
          ))}
        </div>
        <p className="mt-6 text-xs text-slate-500">{postEventNote}</p>
      </Section>

      <Section
        variant="muted"
        eyebrow="Operator"
        title="Powered by proven delivery"
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {operatorStats.map((stat) => (
            <StatCard
              key={stat.label}
              value={stat.value}
              label={stat.label}
              highlight={stat.value === "Zero"}
            />
          ))}
        </div>
      </Section>

      <CtaBand
        title="Put these numbers on your campus report."
        primaryLabel="Talk to partnerships"
      />
    </>
  );
}
