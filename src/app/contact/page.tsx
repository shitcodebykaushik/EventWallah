import type { Metadata } from "next";
import { Mail, Phone, Globe } from "lucide-react";

import { PartnershipForm } from "@/components/forms/PartnershipForm";
import { PageHero } from "@/components/marketing/PageHero";
import { Section } from "@/components/marketing/Section";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Launch Bharat partnerships and The Event Wallah operations desk.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title={
          <>
            Ready when{" "}
            <span className="text-brand-orange">you are.</span>
          </>
        }
        description="Reach the partnerships desk for college MoUs, or The Event Wallah for operational questions."
      />

      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          <ContactCard
            title="Launch Bharat · Partnerships"
            items={[
              {
                icon: Mail,
                label: "Email",
                value: site.contact.partnershipsEmail,
                href: `mailto:${site.contact.partnershipsEmail}`,
              },
              {
                icon: Globe,
                label: "Web",
                value: site.contact.websiteLabel,
                href: site.contact.website,
              },
            ]}
          />
          <ContactCard
            title="The Event Wallah · Operations"
            items={[
              {
                icon: Mail,
                label: "Email",
                value: site.poweredBy.email,
                href: `mailto:${site.poweredBy.email}`,
              },
              {
                icon: Phone,
                label: "Phone",
                value: site.poweredBy.phone,
                href: `tel:${site.poweredBy.phone.replace(/\s/g, "")}`,
              },
              {
                icon: Globe,
                label: "Web",
                value: site.poweredBy.websiteLabel,
                href: site.poweredBy.website,
              },
            ]}
          />
        </div>
      </Section>

      <Section
        variant="muted"
        eyebrow="Inquiry"
        title="Send a partnership request"
        lead="Same form as the partner page — validated client-side for this frontend MVP."
      >
        <div className="mx-auto max-w-3xl">
          <PartnershipForm />
        </div>
      </Section>
    </>
  );
}

function ContactCard({
  title,
  items,
}: {
  title: string;
  items: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    href: string;
  }[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-navy-900">{title}</h2>
      <ul className="mt-5 space-y-4">
        {items.map((item) => (
          <li key={item.label} className="flex items-start gap-3">
            <item.icon className="mt-0.5 size-5 text-brand-orange" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {item.label}
              </p>
              <a
                href={item.href}
                className="text-sm font-medium text-navy-900 hover:text-brand-orange"
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel={item.href.startsWith("http") ? "noreferrer" : undefined}
              >
                {item.value}
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
