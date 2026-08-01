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
        description="Important information about EventWallah listings, registrations and passes."
        dark={false}
      />
      <Section>
        <div className="prose prose-slate max-w-3xl space-y-4 text-slate-600">
          <p>
            {site.name} provides institution and event listings, free registrations,
            and QR passes. Event schedules and venue information are supplied by
            authorised organisers and may change. Attendees should check the listing
            again before travelling.
          </p>
          <p>
            A pass is personal, may be used only once, and does not override an
            organiser&apos;s published eligibility or venue rules. Resale, automated
            registration, impersonation, and attempts to bypass check-in controls are
            prohibited. For listing corrections or account questions, contact{" "}
            <a
              className="font-medium text-brand-orange underline"
              href={`mailto:${site.contact.partnershipsEmail}`}
            >
              {site.contact.partnershipsEmail}
            </a>
            . Paid ticket terms will be added before payment functionality is enabled.
          </p>
        </div>
      </Section>
    </>
  );
}
