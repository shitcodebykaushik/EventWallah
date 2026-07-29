import type { Metadata } from "next";

import { PageHero } from "@/components/marketing/PageHero";
import { Section } from "@/components/marketing/Section";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Terms",
};

export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Terms of use"
        description="Placeholder terms for the Launch Bharat frontend MVP."
        dark={false}
      />
      <Section>
        <div className="prose prose-slate max-w-3xl space-y-4 text-slate-600">
          <p>
            Content on this site describes the {site.name} college partnership
            program and is provided for informational and partnership
            discussions. Figures marked as targets, illustrative, or sample
            framing are not guarantees of outcomes.
          </p>
          <p>
            Program participation requires a signed MoU with the relevant
            institution. For partnership terms, contact{" "}
            <a
              className="font-medium text-brand-orange underline"
              href={`mailto:${site.contact.partnershipsEmail}`}
            >
              {site.contact.partnershipsEmail}
            </a>
            .
          </p>
        </div>
      </Section>
    </>
  );
}
