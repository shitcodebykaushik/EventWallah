import type { Metadata } from "next";
import Link from "next/link";

import { CtaBand } from "@/components/marketing/CtaBand";
import { FeatureCard } from "@/components/marketing/FeatureCard";
import { PageHero } from "@/components/marketing/PageHero";
import { PitchStageStrip } from "@/components/marketing/PitchStageStrip";
import { Section } from "@/components/marketing/Section";
import { studentBenefits } from "@/content/benefits";

export const metadata: Metadata = {
  title: "For Students",
  description:
    "Pitch real investors, get operator mentorship, grants pathways, and a national founder network — beyond a certificate.",
};

export default function ForStudentsPage() {
  return (
    <>
      <PageHero
        eyebrow="For student founders"
        title={
          <>
            Leave with more than a certificate —{" "}
            <span className="text-brand-orange">leave with a trajectory.</span>
          </>
        }
        description="Pitch people who write cheques. Build with mentors who have shipped. Join a founder network that stretches across India. Registration opens when your campus partners with Launch Bharat."
        primaryHref="/program"
        primaryLabel="See the pitch stage"
        secondaryHref="/partner"
        secondaryLabel="Get your campus to host"
      />

      <Section
        align="center"
        eyebrow="What you walk away with"
        title="Six outcomes beyond the photo with a trophy."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {studentBenefits.map((b) => (
            <FeatureCard
              key={b.id}
              id={b.id}
              title={b.title}
              description={b.detail}
              highlight={b.highlight}
            />
          ))}
        </div>
      </Section>

      <Section
        variant="muted"
        align="center"
        eyebrow="Your path on stage"
        title={
          <>
            Register → Launch —{" "}
            <span className="text-gradient-orange">six clear moves.</span>
          </>
        }
        lead="No mystery process. Same high-signal funnel on every partner campus."
      >
        <div className="mx-auto max-w-6xl">
          <PitchStageStrip />
        </div>
      </Section>

      <Section
        variant="dark"
        title="Registration is campus-first"
        lead="There is no open public signup yet. When your college partners with Launch Bharat, team registration opens free for students. Share this with your IIC, E-Cell, or Dean."
      >
        <Link href="/partner" className="btn-accent h-11 px-5">
          Tell your institution
        </Link>
      </Section>

      <CtaBand
        title={
          <>
            Build something real{" "}
            <span className="text-brand-orange">this semester.</span>
          </>
        }
        description="Ask your campus leadership to host Launch Bharat — or write to partnerships if you need an introduction."
        primaryLabel="Partnership desk"
        primaryHref="/contact"
        secondaryHref="/program"
        secondaryLabel="Program details"
      />
    </>
  );
}
