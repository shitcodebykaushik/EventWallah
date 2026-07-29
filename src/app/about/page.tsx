import type { Metadata } from "next";

import { CtaBand } from "@/components/marketing/CtaBand";
import { FeatureCard } from "@/components/marketing/FeatureCard";
import { PageHero } from "@/components/marketing/PageHero";
import { Section } from "@/components/marketing/Section";
import {
  collegeFootprint,
  missionLevers,
  visionRoadmap,
} from "@/content/phases";

export const metadata: Metadata = {
  title: "About",
  description:
    "Vision 2030, mission levers, and the roadmap to make India the world's most vibrant student startup ecosystem.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="04 — Our vision"
        title={
          <>
            Make India the{" "}
            <span className="text-brand-orange">world&apos;s most vibrant</span>{" "}
            student startup ecosystem.
          </>
        }
        description="Not by building one incubator — but by activating every campus as an innovation hub, so that every Indian student with an idea has the mentorship, resources, and stage to build something extraordinary."
        primaryHref="/partner"
        primaryLabel="Become a partner campus"
        secondaryHref="/program"
        secondaryLabel="How it works"
      />

      <Section variant="muted">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow mb-3">Vision · 2030</p>
            <blockquote className="border-l-4 border-brand-orange pl-6">
              <p className="font-heading text-2xl font-bold leading-snug text-navy-900 sm:text-3xl">
                &ldquo;The next billion-dollar Indian idea will not come from a
                boardroom.{" "}
                <span className="text-brand-orange">
                  It will come from a classroom.
                </span>
                &rdquo;
              </p>
            </blockquote>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {collegeFootprint.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm"
              >
                <p className="font-heading text-2xl font-bold text-brand-orange sm:text-3xl">
                  {item.value}
                </p>
                <p className="mt-2 text-xs font-medium text-slate-600">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section
        eyebrow="05 — Our mission"
        title={
          <>
            Bridge the gap between the{" "}
            <span className="text-brand-blue">classroom</span> and the{" "}
            <span className="text-brand-orange">boardroom.</span>
          </>
        }
        lead="A pan-India movement that converts academic learning into real-world startup execution — with the four levers every founder needs."
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {missionLevers.map((lever) => (
            <FeatureCard
              key={lever.id}
              id={lever.id}
              title={lever.title}
              description={lever.description}
            />
          ))}
        </div>
      </Section>

      <Section
        variant="dark"
        eyebrow="23 — Future vision · 2030"
        title={
          <>
            By 2030, Launch Bharat is not a program.{" "}
            <span className="text-brand-orange">
              It&apos;s national infrastructure.
            </span>
          </>
        }
      >
        <ol className="grid gap-6 md:grid-cols-4">
          {visionRoadmap.map((step, i) => (
            <li key={step.year} className="relative">
              <p
                className={
                  step.highlight
                    ? "font-heading text-3xl font-bold text-brand-orange"
                    : "font-heading text-3xl font-bold text-white"
                }
              >
                {step.year}
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {step.label}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                {step.detail}
              </p>
              {i < visionRoadmap.length - 1 && (
                <div
                  className="absolute top-4 -right-3 hidden h-px w-6 bg-white/20 md:block"
                  aria-hidden
                />
              )}
            </li>
          ))}
        </ol>
      </Section>

      <CtaBand
        title="Ready when you are."
        description="Let's build the launchpad on your campus."
        primaryLabel="Start partnership"
      />
    </>
  );
}
