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
        description="How information submitted through EventWallah is handled."
        dark={false}
      />
      <Section>
        <div className="prose prose-slate max-w-3xl">
          <p>
            {site.name} stores the information a student submits when registering,
            including their name, contact details, institution, course, event,
            pass status, and check-in time. This information is used to issue the
            pass, prevent duplicate registrations, and help authorised event teams
            manage entry.
          </p>
          <p className="mt-4">
            A QR code contains a random pass reference rather than the attendee&apos;s
            personal details. Registration records are available only to authorised
            event personnel. For access, correction, or deletion requests, contact{" "}
            <a
              className="text-brand-orange underline"
              href={`mailto:${site.contact.partnershipsEmail}`}
            >
              {site.contact.partnershipsEmail}
            </a>
            . Do not submit sensitive financial, identity-document, or health data.
          </p>
        </div>
      </Section>
    </>
  );
}
