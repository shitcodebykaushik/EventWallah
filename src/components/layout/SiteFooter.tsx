import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { BrandMark } from "@/components/marketing/BrandMark";
import { navigation, site } from "@/content/site";

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-white/8 bg-navy-950 text-white">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-brand-orange to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-40 left-1/2 size-[34rem] -translate-x-1/2 rounded-full bg-brand-orange/10 blur-[100px]"
        aria-hidden
      />
      <div className="container-page relative py-16 md:py-20">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <BrandMark />
              <span className="font-heading text-lg font-extrabold text-white">
                {site.name}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-white/50">
              {site.tagline} Discover, register and check in without paper lists
              or confusing message threads.
            </p>
            <Link href="/events" className="btn-primary h-10 px-4 text-[13px]">
                Explore events
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <div>
                <p className="mb-4 text-[10px] font-bold tracking-[.18em] text-white/35 uppercase">
                Explore
              </p>
              <ul className="space-y-2.5 text-sm">
                {navigation.slice(0, 5).map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-white/55 transition hover:text-white"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-4 text-[10px] font-bold tracking-[.18em] text-white/35 uppercase">
                Company
              </p>
              <ul className="space-y-2.5 text-sm">
                {navigation.slice(5).map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-white/55 transition hover:text-white"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/contact"
                    className="font-medium text-brand-orange transition hover:text-brand-orange-dark"
                  >
                    List an event
                  </Link>
                </li>
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="mb-4 text-[10px] font-bold tracking-[.18em] text-white/35 uppercase">
                Contact
              </p>
              <ul className="space-y-2.5 text-sm text-white/55">
                <li>
                  <a
                    href={`mailto:${site.contact.partnershipsEmail}`}
                    className="transition hover:text-white"
                  >
                    {site.contact.partnershipsEmail}
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${site.poweredBy.email}`}
                    className="transition hover:text-white"
                  >
                    {site.poweredBy.email}
                  </a>
                </li>
                <li className="text-white/35">{site.poweredBy.phone}</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-7 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name}. Powered by{" "}
            {site.poweredBy.name}.
          </p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
