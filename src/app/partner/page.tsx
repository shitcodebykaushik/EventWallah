import type { Metadata } from "next";

import { PartnershipForm } from "@/components/forms/PartnershipForm";
import { PageHero } from "@/components/marketing/PageHero";
import { Section } from "@/components/marketing/Section";
import { partnershipTimeline } from "@/content/phases";
import { site } from "@/content/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Partner",
  description:
    "From MoU to Grand Pitch in 60 days. Reserve one of 100 anchor college slots for 2024–25.",
};

export default function PartnerPage() {
  return (
    <>
      <PageHero
        eyebrow="24 — The decision"
        title={
          <>
            Will happen with your campus —{" "}
            <span className="text-brand-orange">or without it.</span>
          </>
        }
        description={`The first ${site.scarcity.slots} partner colleges are being chosen now for ${site.scarcity.season}. Join as an anchor institution before your peer college does.`}
      />

      <Section
        eyebrow="22 — Partnership timeline"
        title="From MoU to Grand Pitch — in 60 days."
        lead="A predictable, low-friction rollout designed around the academic calendar."
      >
        <ol className="space-y-0">
          {partnershipTimeline.map((step, index) => (
            <li
              key={step.when}
              className="grid gap-4 border-l-2 border-slate-200 py-6 pl-6 md:grid-cols-[160px_1fr]"
            >
              <div>
                <p
                  className={cn(
                    "text-sm font-bold",
                    step.highlight ? "text-brand-orange" : "text-navy-900"
                  )}
                >
                  {step.when}
                </p>
                <p className="text-xs text-slate-500">{step.label}</p>
              </div>
              <div>
                <h3
                  className={cn(
                    "text-lg font-bold",
                    step.highlight ? "text-brand-orange" : "text-navy-900"
                  )}
                >
                  {step.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  {step.detail}
                </p>
              </div>
              {index === partnershipTimeline.length - 1 ? null : null}
            </li>
          ))}
        </ol>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { step: "Step 01", label: "Book 30-min discovery call" },
            { step: "Step 02", label: "Sign the partnership MoU" },
            { step: "Step 03", label: "Host the flagship in 60 days" },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-orange">
                {item.step}
              </p>
              <p className="mt-1 font-semibold text-navy-900">{item.label}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        variant="muted"
        eyebrow="Reserve your slot"
        title={`${site.scarcity.slots} anchor college slots · ${site.scarcity.season}`}
        lead={`Selection is by zone, discipline mix, and readiness. Priority cohort: ${site.scarcity.priority}.`}
      >
        <div className="grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-zinc-800 bg-ink p-8 text-white shadow-[var(--shadow-soft)]">
            <div
              className="pointer-events-none absolute -top-10 -right-10 size-40 rounded-full bg-brand-orange/30 blur-3xl"
              aria-hidden
            />
            <p className="relative text-[11px] font-semibold tracking-wide text-zinc-400 uppercase">
              Limited · {site.scarcity.season}
            </p>
            <p className="relative mt-3 font-heading text-6xl font-extrabold tracking-tight text-brand-orange">
              {site.scarcity.slots}
            </p>
            <p className="relative mt-2 text-lg font-semibold">
              anchor college slots
            </p>
            <p className="relative mt-4 text-sm leading-relaxed text-zinc-400">
              Selection by zone, discipline mix, and readiness. Confirmed
              institutions are designed for joint Startup India announcement.
            </p>
            <div className="relative mt-8 space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
              <p>
                <span className="font-semibold text-white">Email · </span>
                {site.contact.partnershipsEmail}
              </p>
              <p>
                <span className="font-semibold text-white">Web · </span>
                {site.contact.websiteLabel}
              </p>
            </div>
          </div>
          <PartnershipForm />
        </div>
      </Section>
    </>
  );
}
