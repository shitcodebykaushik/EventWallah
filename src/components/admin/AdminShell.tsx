"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  CircleHelp,
  Handshake,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  QrCode,
  ReceiptText,
  Rocket,
  ScrollText,
  ShieldCheck,
  Settings,
} from "lucide-react";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/marketing/BrandMark";
import { API_URL, apiFetch, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

type OrganizationRole = "owner" | "event_manager" | "ticketing_manager" | "sponsorship_manager" | "finance_manager" | "checkin_operator" | "viewer";
type AdminIdentity = { name: string; email: string; organizationRole: OrganizationRole };

const navigation: Array<{ href: string; label: string; icon: typeof Rocket; roles: OrganizationRole[] }> = [
  { href: "/admin/launch-bharat", label: "Launch Bharat", icon: Rocket, roles: ["owner", "event_manager"] },
  { href: "/admin", label: "Command centre", icon: LayoutDashboard, roles: ["owner", "event_manager", "ticketing_manager", "sponsorship_manager", "finance_manager", "checkin_operator", "viewer"] },
  { href: "/admin/events/new", label: "Create event", icon: Plus, roles: ["owner", "event_manager"] },
  { href: "/admin/ticketing", label: "Ticketing & sales", icon: ReceiptText, roles: ["owner", "event_manager", "ticketing_manager", "finance_manager"] },
  { href: "/admin/sponsors", label: "Sponsorship CRM", icon: Handshake, roles: ["owner", "sponsorship_manager", "finance_manager"] },
  { href: "/admin/finance", label: "Finance", icon: IndianRupee, roles: ["owner", "finance_manager"] },
  { href: "/admin/check-in", label: "Pass check-in", icon: QrCode, roles: ["owner", "event_manager", "checkin_operator"] },
  { href: "/admin/audit", label: "Audit trail", icon: ScrollText, roles: ["owner"] },
  { href: "/admin/settings", label: "Access & security", icon: Settings, roles: ["owner"] },
];

function pageDetails(pathname: string) {
  if (pathname === "/admin") return { title: "Command centre", detail: "Platform operations and event performance" };
  if (pathname === "/admin/launch-bharat") return { title: "Launch Bharat", detail: "National programme, college cohorts and founder pipeline" };
  if (pathname === "/admin/events/new") return { title: "Create event", detail: "Add a new listing to the campus calendar" };
  if (pathname.startsWith("/admin/events/")) return { title: "Event workspace", detail: "Listing details, capacity and attendees" };
  if (pathname === "/admin/check-in") return { title: "Pass check-in", detail: "Validate attendee access at the venue" };
  if (pathname === "/admin/ticketing") return { title: "Ticketing & sales", detail: "Inventory, orders, discounts and revenue" };
  if (pathname === "/admin/sponsors") return { title: "Sponsorship CRM", detail: "Brands, commercial deals and deliverables" };
  if (pathname === "/admin/finance") return { title: "Finance", detail: "Income, outstanding value, expenses and margin" };
  if (pathname === "/admin/audit") return { title: "Audit trail", detail: "Immutable history of operational changes" };
  if (pathname === "/admin/settings") return { title: "Access & security", detail: "Team roles and account protection" };
  return { title: "EventWallah ERP", detail: "Administration workspace" };
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [identity, setIdentity] = useState<AdminIdentity | null>(null);
  const page = pageDetails(pathname);
  const today = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date());

  useEffect(() => {
    apiFetch<AdminIdentity>("/api/v1/admin/me")
      .then(setIdentity)
      .catch((error) => {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) router.replace("/admin/login");
      });
  }, [router]);

  async function logout() {
    await fetch(`${API_URL}/api/v1/admin/logout`, { method: "POST", credentials: "include" }).catch(() => undefined);
    router.replace("/admin/login");
  }

  const permittedNavigation = identity ? navigation.filter((item) => item.roles.includes(identity.organizationRole)) : [];

  const sidebar = <>
    <div className="flex h-[76px] items-center gap-3 border-b border-white/8 px-5">
      <BrandMark size="sm" className="ring-white/10" />
      <div><p className="text-sm font-extrabold text-white">EventWallah</p><p className="text-[9px] font-bold tracking-[.18em] text-white/35 uppercase">Operations ERP</p></div>
    </div>
    <div className="flex flex-1 flex-col overflow-y-auto px-3 py-6">
      <p className="px-3 text-[9px] font-bold tracking-[.18em] text-white/25 uppercase">Workspace</p>
      <nav className="mt-3 space-y-1">
        {permittedNavigation.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={cn("group flex items-center gap-3 rounded-md px-3 py-3 text-[13px] font-semibold transition", active ? "bg-white text-navy-950 shadow-sm" : "text-white/48 hover:bg-white/7 hover:text-white")}><Icon className={cn("size-[18px]", active ? "text-brand-orange" : "text-white/35 group-hover:text-white/70")}/><span className="flex-1">{item.label}</span>{active&&<ChevronRight className="size-3.5 text-zinc-300"/>}</Link>;
        })}
      </nav>
      <p className="mt-8 px-3 text-[9px] font-bold tracking-[.18em] text-white/25 uppercase">Quick access</p>
      <div className="mt-3 space-y-1">
        <Link href="/" target="_blank" className="flex items-center gap-3 rounded-md px-3 py-3 text-[13px] font-semibold text-white/48 transition hover:bg-white/7 hover:text-white"><ArrowUpRight className="size-[18px] text-white/35"/>Public website</Link>
        <a href="mailto:info@theeventwallah.com" className="flex items-center gap-3 rounded-md px-3 py-3 text-[13px] font-semibold text-white/48 transition hover:bg-white/7 hover:text-white"><CircleHelp className="size-[18px] text-white/35"/>Operations support</a>
      </div>
      <div className="mt-auto pt-8">
        <div className="rounded-md border border-white/8 bg-white/[.035] p-3">
          <div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-md bg-brand-orange text-xs font-extrabold text-white">{identity?.name.split(/\s+/).slice(0,2).map((part)=>part[0]).join("").toUpperCase() || "EW"}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-white">{identity?.name || "Authenticated user"}</span><span className="block truncate text-[10px] text-white/35">{identity?.organizationRole.replaceAll("_", " ") || "Loading access…"}</span></span><ShieldCheck className="size-4 text-emerald-400"/></div>
          <button type="button" onClick={logout} className="mt-3 flex w-full items-center justify-center gap-2 border-t border-white/8 pt-3 text-[11px] font-bold text-white/40 transition hover:text-white"><LogOut className="size-3.5"/>Sign out</button>
        </div>
      </div>
    </div>
  </>;

  return <div className="min-h-screen bg-[#f4f5f7] text-ink">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-navy-950 lg:flex">{sidebar}</aside>
    {mobileOpen&&<div className="fixed inset-0 z-50 lg:hidden"><button type="button" aria-label="Close navigation" onClick={()=>setMobileOpen(false)} className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm"/><aside className="relative flex h-full w-[min(86vw,300px)] flex-col bg-navy-950 shadow-2xl">{sidebar}</aside></div>}
    <div className="min-h-screen lg:pl-64">
      <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between gap-4 border-b border-navy-900/10 bg-white/95 px-4 backdrop-blur-xl sm:px-7 lg:px-9">
        <div className="flex min-w-0 items-center gap-3"><button type="button" onClick={()=>setMobileOpen(true)} className="flex size-10 shrink-0 items-center justify-center rounded-md border border-navy-900/10 lg:hidden"><Menu className="size-5"/></button><div className="min-w-0"><h1 className="truncate text-sm font-extrabold sm:text-base">{page.title}</h1><p className="mt-0.5 hidden truncate text-[11px] text-zinc-400 sm:block">{page.detail}</p></div></div>
        <div className="flex items-center gap-3"><div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 sm:flex"><span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,.1)]"/><span className="text-[10px] font-bold text-emerald-700">System operational</span></div><div className="hidden h-7 w-px bg-navy-900/10 sm:block"/><div className="text-right"><p className="text-[10px] font-bold text-zinc-400">BUSINESS DATE</p><p className="mt-0.5 text-xs font-bold">{today}</p></div></div>
      </header>
      <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-7 lg:p-9">{children}</main>
      <footer className="mx-4 border-t border-navy-900/8 py-5 text-center text-[10px] text-zinc-400 sm:mx-7 lg:mx-9"><CalendarDays className="mr-1 inline size-3"/>EventWallah operations suite · 2026</footer>
    </div>
  </div>;
}
