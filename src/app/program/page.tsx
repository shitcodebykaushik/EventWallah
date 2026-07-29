import type { Metadata } from "next";

import { AgendaTabs } from "@/components/marketing/AgendaTabs";
import { CtaBand } from "@/components/marketing/CtaBand";
import { FeatureCard } from "@/components/marketing/FeatureCard";
import { PageHero } from "@/components/marketing/PageHero";
import { PhaseTimeline } from "@/components/marketing/PhaseTimeline";
import { PitchStageStrip } from "@/components/marketing/PitchStageStrip";
import { Section } from "@/components/marketing/Section";
import { investorPrinciples } from "@/content/agenda";

export const metadata: Metadata = {
  title: "Program",
  description:
    "Five campus phases, a 48-hour flagship weekend, and a six-step founder journey from register to launch.",
};

export default function ProgramPage() {
  return (
    <>
      <PageHero
        eyebrow="The program"
        title={
          <>
            A full startup arc —{" "}
            <span className="text-brand-orange">in one campus weekend</span>,
            with 12 weeks of follow-through.
          </>
        }
        description="Turnkey production for colleges. Real investor deal flow for students. Clear structure from MoU to incubation — not a one-day show."
        primaryHref="/partner"
        primaryLabel="Host on your campus"
        secondaryHref="/for-students"
        secondaryLabel="Student journey"
      />

      <Section
        align="center"
        eyebrow="Founder journey"
        title={
          <>
            The pitch stage strip —{" "}
            <span className="text-gradient-orange">six moves.</span>
          </>
        }
        lead="Register, build, pitch, advance, incubate, launch. Same funnel on every partner campus so outcomes stay comparable and high-signal."
      >
        <div className="mx-auto max-w-6xl">
          <PitchStageStrip />
        </div>
      </Section>

      <Section
        variant="muted"
        eyebrow="Campus operating system"
        title="Five phases from MoU to alumni loop."
        lead="Colleges bring the auditorium, students, and faculty champion. Launch Bharat brings investors, mentors, production, platform, PR, and post-event follow-through."
      >
        <div className="rounded-[1.75rem] border border-[#dde5f0] bg-white p-5 shadow-[var(--shadow-soft)] sm:p-8 md:p-10">
          <PhaseTimeline />
        </div>
      </Section>

      <Section
        eyebrow="Flagship weekend"
        title="48 hours on campus — full agenda."
        lead="Day 1 is the Innovation Challenge. Day 2 is the Startup Summit and Grand Pitch. Engineered so every student feels a real founder arc."
      >
        <AgendaTabs />
      </Section>

      <Section
        variant="dark"
        eyebrow="For investors"
        title={
          <>
            Built for founders.{" "}
            <span className="text-brand-orange">Designed for investors.</span>
          </>
        }
        lead="Not a college fest with a guest investor slot — a curated deal-flow room with rules investors respect."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {investorPrinciples.map((item) => (
            <FeatureCard
              key={item.title}
              title={item.title}
              description={item.detail}
              dark
            />
          ))}
        </div>
        <p className="mt-8 max-w-2xl border-l-4 border-brand-orange pl-4 text-lg font-medium text-zinc-200">
          &ldquo;Every minute of an investor&apos;s time earns them a signal —
          not another slide deck.&rdquo;
        </p>
      </Section>

      <CtaBand
        title={
          <>
            Bring the flagship{" "}
            <span className="text-brand-orange">to your campus.</span>
          </>
        }
        description="Discovery call to Grand Pitch in about 60 days. Zero student registration fee for partner colleges."
        primaryLabel="Book a discovery call"
        secondaryHref="/for-colleges"
        secondaryLabel="College benefits"
      />
    </>
  );
}
