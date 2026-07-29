import Link from "next/link";
import {
  Building2,
  Landmark,
  Network,
  Rocket,
  Users,
  Wallet,
  ArrowRight,
} from "lucide-react";

import { BrandMarquee } from "@/components/marketing/AestheticExtras";
import { CtaBand } from "@/components/marketing/CtaBand";
import { ComparisonTable } from "@/components/marketing/ComparisonTable";
import {
  AudienceRails,
  CredentialStrip,
} from "@/components/marketing/DomainDecor";
import { FadeIn, Stagger, StaggerItem } from "@/components/marketing/FadeIn";
import { Faq } from "@/components/marketing/Faq";
import { FeatureCard } from "@/components/marketing/FeatureCard";
import { HomeHero } from "@/components/marketing/HomeHero";
import { PhaseTimeline } from "@/components/marketing/PhaseTimeline";
import { PitchStageStrip } from "@/components/marketing/PitchStageStrip";
import { Section, waveFill } from "@/components/marketing/Section";
import { StatCard } from "@/components/marketing/StatCard";
import { homeCopy } from "@/content/copy";
import { portfolio } from "@/content/trackRecord";
import { missionLevers, tailwinds } from "@/content/phases";
import { ecosystemStats, problemStats } from "@/content/stats";

const leverIcons = [
  <Users key="u" className="size-5" />,
  <Wallet key="w" className="size-5" />,
  <Rocket key="r" className="size-5" />,
  <Network key="n" className="size-5" />,
];

const tailwindIcons = [
  <Landmark key="l" className="size-5" />,
  <Wallet key="w2" className="size-5" />,
  <Users key="u2" className="size-5" />,
  <Building2 key="b" className="size-5" />,
];

export default function HomePage() {
  return (
    <>
      <HomeHero />

      <BrandMarquee />

      {/* India ecosystem — curved in from hero canvas */}
      <Section
        variant="white"
        align="center"
        waveFrom={waveFill.canvas}
        waveHeight="md"
        className="!pt-16 sm:!pt-20"
        eyebrow={homeCopy.ecosystemEyebrow}
        index="01"
        ambient
      >
        <p className="-mt-4 mb-8 text-center text-sm text-zinc-500 sm:-mt-6 sm:text-base">
          {homeCopy.ecosystemLead}
        </p>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-4">
          {ecosystemStats.map((stat) => (
            <div
              key={stat.value}
              className="relative text-center md:border-r md:border-[#e8eef6] md:last:border-0"
            >
              <p className="font-heading text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-1 text-xs font-medium text-zinc-500 sm:text-sm">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* Audience rails */}
      <Section
        variant="light"
        align="center"
        waveFrom={waveFill.white}
        eyebrow={homeCopy.audienceEyebrow}
        index="02"
        ambient
        title={
          <>
            One campus stage.{" "}
            <span className="text-gradient-orange">Three outcomes.</span>
          </>
        }
        lead={homeCopy.audienceLead}
      >
        <FadeIn>
          <AudienceRails />
        </FadeIn>
      </Section>

      {/* Problem */}
      <Section
        variant="muted"
        align="center"
        waveFrom={waveFill.canvas}
        eyebrow={homeCopy.problemEyebrow}
        index="03"
        title={
          <>
            Ideas are not the bottleneck.{" "}
            <span className="text-gradient-orange">Access is.</span>
          </>
        }
        lead={homeCopy.problemLead}
      >
        <Stagger className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-3">
          {problemStats.map((stat) => (
            <StaggerItem key={stat.value}>
              <StatCard
                value={stat.value}
                label={stat.label}
                detail={stat.detail}
                highlight={stat.highlight}
              />
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      {/* Pitch stage strip */}
      <Section
        variant="white"
        align="center"
        waveFrom={waveFill.muted}
        eyebrow={homeCopy.stageEyebrow}
        index="04"
        ambient
        title={
          <>
            Whiteboard to company —{" "}
            <span className="text-gradient-orange">six moves on stage.</span>
          </>
        }
        lead={homeCopy.stageLead}
      >
        <FadeIn className="mx-auto max-w-6xl">
          <PitchStageStrip />
        </FadeIn>
        <div className="mt-8 flex justify-center">
          <Link href="/program" className="btn-secondary-light h-11 px-5">
            Full weekend agenda
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </Section>

      {/* How it works */}
      <Section
        variant="muted"
        align="center"
        waveFrom={waveFill.white}
        eyebrow={homeCopy.howEyebrow}
        index="05"
        title={
          <>
            MoU to Grand Pitch —{" "}
            <span className="text-zinc-400">without chaos.</span>
          </>
        }
        lead={homeCopy.howLead}
      >
        <FadeIn>
          <div className="mx-auto max-w-5xl rounded-[1.75rem] border border-[#dde5f0] bg-white p-5 shadow-[var(--shadow-soft)] sm:p-8 md:p-10">
            <div className="tricolor-bar mb-8 opacity-60" />
            <PhaseTimeline />
          </div>
        </FadeIn>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/program" className="btn-primary h-11 bg-navy-900 px-5">
            Program details
            <ArrowRight className="size-4" />
          </Link>
          <Link href="/for-colleges" className="btn-secondary-light h-11 px-5">
            College partnership ROI
          </Link>
        </div>
      </Section>

      {/* Rankings */}
      <Section
        variant="white"
        align="center"
        waveFrom={waveFill.muted}
        eyebrow={homeCopy.rankingsEyebrow}
        title="Innovation that shows up where rankings look."
        lead={homeCopy.rankingsLead}
      >
        <div className="mt-2">
          <CredentialStrip />
        </div>
        <div className="mt-8">
          <Link href="/for-colleges" className="btn-ghost text-navy-900">
            Ranking & ROI details →
          </Link>
        </div>
      </Section>

      {/* Why now */}
      <Section
        variant="light"
        align="center"
        waveFrom={waveFill.white}
        eyebrow={homeCopy.whyEyebrow}
        title={
          <>
            Four tailwinds.{" "}
            <span className="text-gradient-orange">One campus window.</span>
          </>
        }
        lead={homeCopy.whyLead}
      >
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tailwinds.map((item, i) => (
            <StaggerItem key={item.id}>
              <FeatureCard
                id={`${item.id} · ${item.category}`}
                title={item.title}
                description={item.description}
                highlight={item.highlight}
                icon={tailwindIcons[i]}
              />
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      {/* Founder levers */}
      <Section
        variant="muted"
        align="center"
        waveFrom={waveFill.canvas}
        eyebrow={homeCopy.leversEyebrow}
        title={
          <>
            Mentorship. Capital. Stage.{" "}
            <span className="text-gradient-orange">Network.</span>
          </>
        }
        lead={homeCopy.leversLead}
      >
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {missionLevers.map((lever, i) => (
            <StaggerItem key={lever.id}>
              <FeatureCard
                id={lever.id}
                title={lever.title}
                description={lever.description}
                icon={leverIcons[i]}
              />
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      {/* Comparison */}
      <Section
        variant="white"
        align="center"
        waveFrom={waveFill.muted}
        eyebrow={homeCopy.compareEyebrow}
        title={
          <>
            Day-2 applause is not{" "}
            <span className="text-gradient-orange">a startup pathway.</span>
          </>
        }
        lead={homeCopy.compareLead}
      >
        <FadeIn className="mx-auto max-w-5xl">
          <ComparisonTable />
        </FadeIn>
      </Section>

      {/* Operator */}
      <Section
        variant="muted"
        align="center"
        waveFrom={waveFill.white}
        eyebrow={homeCopy.operatorEyebrow}
        title={homeCopy.operatorTitle}
        lead={homeCopy.operatorLead}
      >
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {portfolio.map((item) => (
            <StaggerItem key={item.name}>
              <FeatureCard
                id={item.category}
                title={item.name}
                description={item.detail}
                highlight={item.highlight}
              />
            </StaggerItem>
          ))}
        </Stagger>
        <div className="mt-8">
          <Link href="/partners" className="btn-secondary-light h-11 px-5">
            Full track record
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </Section>

      {/* FAQ */}
      <Section
        variant="light"
        align="center"
        waveFrom={waveFill.muted}
        eyebrow={homeCopy.faqEyebrow}
        title={homeCopy.faqTitle}
        lead={homeCopy.faqLead}
      >
        <FadeIn className="mx-auto max-w-2xl">
          <Faq />
        </FadeIn>
      </Section>

      <CtaBand
        title={
          <>
            100 anchor campuses will lead.{" "}
            <span className="text-brand-orange">Will yours?</span>
          </>
        }
        description={homeCopy.ctaLead}
        primaryLabel="Reserve your campus slot"
        secondaryHref="/contact"
        secondaryLabel="Talk to partnerships"
        waveFrom={waveFill.canvas}
      />
    </>
  );
}
