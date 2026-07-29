import type { Metadata } from "next";

import { CtaBand } from "@/components/marketing/CtaBand";
import { FeatureCard } from "@/components/marketing/FeatureCard";
import { PageHero } from "@/components/marketing/PageHero";
import { Section } from "@/components/marketing/Section";
import { StatCard } from "@/components/marketing/StatCard";
import { TestimonialGrid } from "@/components/marketing/TestimonialGrid";
import { site } from "@/content/site";
import { operatorStats } from "@/content/stats";
import { portfolio } from "@/content/trackRecord";

export const metadata: Metadata = {
  title: "Partners",
  description:
    "Event Wallah track record, portfolio brands, and illustrative partnership voices.",
};

export default function PartnersPage() {
  return (
    <>
      <PageHero
        eyebrow="19 — Track record"
        title={
          <>
            The team behind Launch Bharat has already{" "}
            <span className="text-brand-orange">run the playbook.</span>
          </>
        }
        description={`Powered by ${site.poweredBy.name} — an operator with over a decade of national-scale event delivery.`}
        primaryHref="/partner"
        primaryLabel="Partner with us"
      />

      <Section>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {portfolio.map((item) => (
            <FeatureCard
              key={item.name}
              id={item.category}
              title={item.name}
              description={item.detail}
              highlight={item.highlight}
            />
          ))}
        </div>
      </Section>

      <Section variant="dark">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {operatorStats.map((stat) => (
            <StatCard
              key={stat.label}
              value={stat.value}
              label={stat.label}
              dark
              highlight={stat.value === "Zero"}
            />
          ))}
        </div>
      </Section>

      <Section
        eyebrow="20 — In their words"
        title="Voices from the field."
        lead="Sample framing used in partnership conversations. Not attributed to named institutions."
      >
        <TestimonialGrid />
      </Section>

      <Section variant="muted">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-orange">
            Ecosystem alignment
          </p>
          <p className="mt-3 font-heading text-2xl font-bold text-navy-900">
            {site.backing}
          </p>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600">
            Launch Bharat is designed to plug campuses into Startup India
            pathways, DPIIT recognition, and national innovation documentation
            frameworks.
          </p>
        </div>
      </Section>

      <CtaBand
        title="Build the next chapter with us."
        primaryLabel="Start a partnership"
      />
    </>
  );
}
