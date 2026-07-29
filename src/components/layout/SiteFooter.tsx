import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { BrandMark } from "@/components/marketing/BrandMark";
import { navigation, site } from "@/content/site";

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-[#dde5f0] bg-white">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-brand-orange/40 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 left-1/2 size-96 -translate-x-1/2 rounded-full bg-brand-orange/5 blur-3xl"
        aria-hidden
      />
      <div className="container-page relative py-14 md:py-16">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <BrandMark />
              <span className="font-heading text-lg font-bold text-ink">
                {site.name}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-zinc-500">
              {site.tagline} India&apos;s nationwide student startup movement —
              activating campuses as innovation hubs.
            </p>
            <Link href="/partner" className="btn-primary h-10 px-4 text-[13px]">
              Become a partner
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <div>
              <p className="mb-3 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
                Explore
              </p>
              <ul className="space-y-2.5 text-sm">
                {navigation.slice(0, 5).map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-zinc-600 transition hover:text-ink"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
                Company
              </p>
              <ul className="space-y-2.5 text-sm">
                {navigation.slice(5).map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-zinc-600 transition hover:text-ink"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/partner"
                    className="font-medium text-brand-orange transition hover:text-brand-orange-dark"
                  >
                    Partner
                  </Link>
                </li>
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="mb-3 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
                Contact
              </p>
              <ul className="space-y-2.5 text-sm text-zinc-600">
                <li>
                  <a
                    href={`mailto:${site.contact.partnershipsEmail}`}
                    className="transition hover:text-ink"
                  >
                    {site.contact.partnershipsEmail}
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${site.poweredBy.email}`}
                    className="transition hover:text-ink"
                  >
                    {site.poweredBy.email}
                  </a>
                </li>
                <li className="text-zinc-400">{site.poweredBy.phone}</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-zinc-100 pt-6 text-xs text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name}. Powered by{" "}
            {site.poweredBy.name}.
          </p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-ink">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-ink">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
