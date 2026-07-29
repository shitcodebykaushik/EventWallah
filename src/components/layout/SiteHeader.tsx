"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";

import { BrandMark } from "@/components/marketing/BrandMark";
import {
  navigation,
  navigationMore,
  navigationPrimary,
  site,
} from "@/content/site";
import { duration, easeWater, springSoft } from "@/lib/motion";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 32,
    mass: 0.45,
  });

  const moreActive = navigationMore.some((item) =>
    isActive(pathname, item.href)
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const onPointer = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="pointer-events-none sticky top-0 z-50">
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-20 transition-opacity duration-500",
            scrolled
              ? "bg-linear-to-b from-background via-background/80 to-transparent opacity-100"
              : "opacity-0"
          )}
          aria-hidden
        />

        <a
          href="#main"
          className="pointer-events-auto sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>

        <div className="pointer-events-none container-page pt-3 sm:pt-4">
          <motion.div
            initial={false}
            animate={{
              boxShadow: scrolled
                ? "0 8px 30px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)"
                : "0 0 0 1px rgba(0,0,0,0.05)",
            }}
            transition={{ duration: 0.4, ease: easeWater }}
            className={cn(
              "pointer-events-auto relative mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 rounded-full px-3 sm:h-[3.6rem] sm:px-4",
              "border border-[#d5e0f0]/90 bg-white/85 backdrop-blur-2xl"
            )}
          >
            <Link
              href="/"
              className="relative z-10 flex min-w-0 items-center gap-2 rounded-full py-1 pr-1"
            >
              <BrandMark size="sm" />
              <span className="font-heading truncate text-[13px] font-bold tracking-tight text-ink sm:text-sm">
                {site.name}
              </span>
            </Link>

            <nav
              className="relative z-10 hidden items-center gap-0.5 md:flex"
              aria-label="Primary"
            >
              {navigationPrimary.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors duration-300",
                      active
                        ? "text-ink"
                        : "text-zinc-500 hover:text-ink"
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 -z-10 rounded-full bg-zinc-100"
                        transition={springSoft}
                      />
                    )}
                    {item.label}
                  </Link>
                );
              })}

              <div ref={moreRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMoreOpen((v) => !v)}
                  aria-expanded={moreOpen}
                  aria-haspopup="menu"
                  className={cn(
                    "relative inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors duration-300",
                    moreOpen || moreActive
                      ? "bg-zinc-100 text-ink"
                      : "text-zinc-500 hover:text-ink"
                  )}
                >
                  More
                  <ChevronDown
                    className={cn(
                      "size-3.5 opacity-60 transition-transform duration-300",
                      moreOpen && "rotate-180"
                    )}
                  />
                </button>

                <AnimatePresence>
                  {moreOpen && (
                    <motion.div
                      role="menu"
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: duration.short, ease: easeWater }}
                      className="absolute top-[calc(100%+12px)] left-1/2 z-50 w-48 -translate-x-1/2 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-[var(--shadow-card)]"
                    >
                      {navigationMore.map((item) => {
                        const active = isActive(pathname, item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            role="menuitem"
                            className={cn(
                              "flex items-center justify-between rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors",
                              active
                                ? "bg-zinc-100 text-ink"
                                : "text-zinc-600 hover:bg-zinc-50 hover:text-ink"
                            )}
                          >
                            {item.label}
                            {active && (
                              <span className="size-1.5 rounded-full bg-brand-orange" />
                            )}
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>

            <div className="relative z-10 flex items-center gap-2">
              <Link
                href="/contact"
                className="btn-ghost hidden h-9 lg:inline-flex"
              >
                Talk to us
              </Link>
              <Link
                href="/partner"
                className="btn-primary hidden h-9 bg-navy-900 px-4 text-[13px] sm:inline-flex"
              >
                Partner
                <ArrowUpRight className="size-3.5" />
              </Link>

              <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex size-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-ink transition hover:bg-zinc-50 md:hidden"
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </button>
            </div>

            <motion.div
              className="absolute inset-x-5 bottom-0 h-px origin-left rounded-full bg-linear-to-r from-brand-orange via-[#ffb347] to-[#138808]/50"
              style={{ scaleX }}
              aria-hidden
            />
          </motion.div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-zinc-900/30 backdrop-blur-sm"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 12, opacity: 0 }}
              transition={{ duration: duration.medium, ease: easeWater }}
              className="absolute inset-x-3 top-3 bottom-3 flex flex-col overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-2xl sm:inset-x-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                  <BrandMark size="sm" />
                  <span className="font-heading text-sm font-bold text-ink">
                    {site.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex size-10 items-center justify-center rounded-full border border-zinc-200 text-ink"
                  aria-label="Close menu"
                >
                  <X className="size-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Mobile">
                <ul className="space-y-1">
                  {navigation.map((item, i) => {
                    const active = isActive(pathname, item.href);
                    return (
                      <motion.li
                        key={item.href}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: 0.04 * i,
                          duration: duration.short,
                          ease: easeWater,
                        }}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center justify-between rounded-2xl px-4 py-3.5 text-base font-medium",
                            active
                              ? "bg-zinc-100 text-ink"
                              : "text-zinc-600 hover:bg-zinc-50 hover:text-ink"
                          )}
                        >
                          {item.label}
                          {active ? (
                            <span className="size-1.5 rounded-full bg-brand-orange" />
                          ) : (
                            <ArrowUpRight className="size-4 opacity-30" />
                          )}
                        </Link>
                      </motion.li>
                    );
                  })}
                </ul>
              </nav>

              <div className="border-t border-zinc-100 p-4">
                <Link
                  href="/partner"
                  onClick={() => setOpen(false)}
                  className="btn-primary h-12 w-full"
                >
                  Partner with us
                  <ArrowUpRight className="size-4" />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
