import type { Metadata } from "next";

import { PageHero } from "@/components/marketing/PageHero";
import { Section } from "@/components/marketing/Section";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Privacy",
};

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Privacy policy"
        description="Placeholder policy for the Launch Bharat frontend MVP."
        dark={false}
      />
      <Section>
        <div className="prose prose-slate max-w-3xl">
          <p>
            This website is a marketing frontend MVP for {site.name}, operated
            in association with {site.poweredBy.name}. Partnership inquiry forms
            currently validate data in the browser only and do not transmit
            personal information to a server.
          </p>
          <p className="mt-4">
            When a backend is connected, this page will describe how lead data is
            stored, processed, and retained. For privacy questions, contact{" "}
            <a
              className="text-brand-orange underline"
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
