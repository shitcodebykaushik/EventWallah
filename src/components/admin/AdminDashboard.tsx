"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Download,
  Filter,
  Pencil,
  Plus,
  QrCode,
  Search,
  TicketCheck,
  TrendingUp,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { apiFetch, authHeaders, formatEventDate, formatEventTime, type Event } from "@/lib/api";
import { cn } from "@/lib/utils";

type Metrics = { institutions: number; publishedEvents: number; registrations: number; checkIns: number };

export function AdminDashboard() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [error, setError] = useState("");

  useEffect(() => {
    const headers = authHeaders();
    Promise.all([
      apiFetch<Metrics>("/api/v1/admin/dashboard", { headers }),
      apiFetch<{ items: Event[] }>("/api/v1/admin/events", { headers }),
    ]).then(([metricData, eventData]) => {
      setMetrics(metricData);
      setEvents(eventData.items);
    }).catch((caught) => {
      if ((caught as { status?: number }).status === 401) router.replace("/admin/login");
      else setError(caught instanceof Error ? caught.message : "Could not load dashboard");
    });
  }, [router]);

  const totalCapacity = events.reduce((sum, event) => sum + event.capacity, 0);
  const totalRegistrations = metrics?.registrations ?? events.reduce((sum, event) => sum + event.registrationCount, 0);
  const utilisation = totalCapacity ? Math.round((totalRegistrations / totalCapacity) * 100) : 0;
  const checkInRate = totalRegistrations ? Math.round(((metrics?.checkIns ?? 0) / totalRegistrations) * 100) : 0;
  const upcoming = [...events].filter((event) => new Date(event.startsAt) >= new Date()).sort((a,b)=>+new Date(a.startsAt)-+new Date(b.startsAt));
  const filtered = useMemo(() => events.filter((event) => {
    const matchesQuery = `${event.title} ${event.collegeName} ${event.category}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (status === "all" || event.status === status);
  }), [events, query, status]);

  const cards = [
    { label: "Institutions", value: metrics?.institutions, icon: Building2, note: "Active directory records", color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Live events", value: metrics?.publishedEvents, icon: CalendarDays, note: `${events.filter(e=>e.status==="draft").length} drafts in workspace`, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Registrations", value: metrics?.registrations, icon: TicketCheck, note: `${utilisation}% overall capacity`, color: "text-brand-orange", bg: "bg-orange-50" },
    { label: "Check-ins", value: metrics?.checkIns, icon: CheckCircle2, note: `${checkInRate}% attendance rate`, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  return <AdminShell>
    <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
      <div><p className="text-[10px] font-bold tracking-[.17em] text-zinc-400 uppercase">Executive overview</p><h2 className="mt-2 font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">Operations at a glance</h2><p className="mt-2 text-sm text-zinc-500">Live activity across institutions, listings and venue access.</p></div>
      <div className="flex flex-wrap gap-2"><Link href="/admin/check-in" className="inline-flex h-10 items-center gap-2 rounded-md border border-navy-900/12 bg-white px-4 text-xs font-bold shadow-sm transition hover:border-navy-900/25"><QrCode className="size-4"/>Open scanner</Link><Link href="/admin/events/new" className="inline-flex h-10 items-center gap-2 rounded-md bg-brand-orange px-4 text-xs font-bold text-white shadow-sm transition hover:bg-brand-orange-dark"><Plus className="size-4"/>Create event</Link></div>
    </div>

    {error&&<p className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

    <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {cards.map((card) => { const Icon=card.icon; return <article key={card.label} className="rounded-md border border-navy-900/10 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,43,.03)] sm:p-5"><div className="flex items-start justify-between gap-2"><div><p className="text-[10px] font-bold text-zinc-500 sm:text-[11px]">{card.label}</p><p className="mt-3 font-heading text-3xl font-extrabold tracking-tight">{card.value??"—"}</p></div><span className={cn("flex size-9 shrink-0 items-center justify-center rounded-md sm:size-10",card.bg)}><Icon className={cn("size-4 sm:size-[18px]",card.color)}/></span></div><div className="mt-4 flex items-start gap-1.5 border-t border-navy-900/7 pt-3 text-[9px] font-semibold leading-relaxed text-zinc-400 sm:mt-5 sm:text-[10px]"><TrendingUp className="mt-0.5 size-3 shrink-0 text-emerald-500 sm:size-3.5"/>{card.note}</div></article> })}
    </div>

    <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_.85fr]">
      <section className="rounded-md border border-navy-900/10 bg-white shadow-[0_1px_2px_rgba(16,24,43,.03)]">
        <div className="flex items-center justify-between border-b border-navy-900/8 px-5 py-4"><div><h3 className="text-sm font-extrabold">Event capacity monitor</h3><p className="mt-1 text-[11px] text-zinc-400">Registrations against available passes</p></div><BarChart3 className="size-5 text-zinc-300"/></div>
        <div className="space-y-5 p-5">{events.slice(0,5).map((event)=>{const percent=Math.min(100,Math.round((event.registrationCount/event.capacity)*100));return <div key={event.id}><div className="mb-2 flex items-center justify-between gap-4"><div className="min-w-0"><p className="truncate text-xs font-bold">{event.title}</p><p className="mt-0.5 truncate text-[10px] text-zinc-400">{event.collegeName}</p></div><div className="text-right"><p className="text-xs font-extrabold">{percent}%</p><p className="text-[9px] text-zinc-400">{event.registrationCount}/{event.capacity}</p></div></div><div className="h-2 overflow-hidden rounded-full bg-zinc-100"><div className={cn("h-full rounded-full",percent>=90?"bg-red-500":percent>=65?"bg-brand-orange":"bg-navy-900")} style={{width:`${percent}%`}}/></div></div>})}{!events.length&&<div className="py-16 text-center text-xs text-zinc-400">Capacity data will appear after the first event is created.</div>}</div>
        <div className="grid grid-cols-3 border-t border-navy-900/8 bg-zinc-50/70"><SmallMetric label="Total capacity" value={totalCapacity}/><SmallMetric label="Reserved" value={totalRegistrations}/><SmallMetric label="Available" value={Math.max(0,totalCapacity-totalRegistrations)}/></div>
      </section>

      <section className="rounded-md border border-navy-900/10 bg-white shadow-[0_1px_2px_rgba(16,24,43,.03)]">
        <div className="flex items-center justify-between border-b border-navy-900/8 px-5 py-4"><div><h3 className="text-sm font-extrabold">Upcoming schedule</h3><p className="mt-1 text-[11px] text-zinc-400">Next operational dates</p></div><CalendarClock className="size-5 text-zinc-300"/></div>
        <div className="divide-y divide-navy-900/7 px-5">{upcoming.slice(0,4).map((event)=><Link href={`/admin/events/${event.id}`} key={event.id} className="group flex items-center gap-4 py-4"><span className="flex size-11 shrink-0 flex-col items-center justify-center rounded-md bg-navy-950 text-white"><span className="text-[8px] font-bold text-brand-orange uppercase">{new Intl.DateTimeFormat("en-IN",{month:"short"}).format(new Date(event.startsAt))}</span><span className="text-base font-extrabold leading-none">{new Date(event.startsAt).getDate()}</span></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold">{event.title}</span><span className="mt-1 block truncate text-[10px] text-zinc-400">{formatEventTime(event.startsAt)} · {event.collegeCity}</span></span><ChevronRight className="size-4 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-brand-orange"/></Link>)}{!upcoming.length&&<p className="py-16 text-center text-xs text-zinc-400">No upcoming events.</p>}</div>
        <Link href="/admin/events/new" className="flex items-center justify-center gap-2 border-t border-navy-900/8 py-3.5 text-[11px] font-bold text-brand-orange">Add to schedule <ArrowRight className="size-3.5"/></Link>
      </section>
    </div>

    <section className="mt-5 overflow-hidden rounded-md border border-navy-900/10 bg-white shadow-[0_1px_2px_rgba(16,24,43,.03)]">
      <div className="flex flex-col gap-4 border-b border-navy-900/8 p-5 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex items-center gap-2"><h3 className="text-sm font-extrabold">Event register</h3><span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[9px] font-bold text-zinc-500">{events.length} RECORDS</span></div><p className="mt-1 text-[11px] text-zinc-400">Master list of published and internal event records</p></div><div className="flex flex-col gap-2 sm:flex-row"><label className="flex h-9 items-center gap-2 rounded-md border border-navy-900/10 bg-zinc-50 px-3"><Search className="size-3.5 text-zinc-400"/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search records" className="w-full bg-transparent text-xs outline-none sm:w-44"/></label><label className="flex h-9 items-center gap-2 rounded-md border border-navy-900/10 bg-white px-3"><Filter className="size-3.5 text-zinc-400"/><select value={status} onChange={(e)=>setStatus(e.target.value)} className="bg-transparent text-xs font-semibold outline-none"><option value="all">All status</option><option value="published">Published</option><option value="draft">Draft</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label><button type="button" title="Export will be enabled with reporting" className="flex size-9 items-center justify-center rounded-md border border-navy-900/10 text-zinc-400"><Download className="size-3.5"/></button></div></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[920px] text-left"><thead className="bg-[#fafafa] text-[9px] font-bold tracking-[.12em] text-zinc-400 uppercase"><tr><th className="px-5 py-3">Event record</th><th className="px-5 py-3">Institution</th><th className="px-5 py-3">Schedule</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Occupancy</th><th className="px-5 py-3 text-right">Action</th></tr></thead><tbody>{filtered.map((event)=>{const percent=Math.round((event.registrationCount/event.capacity)*100);return <tr key={event.id} className="border-t border-navy-900/7 text-xs transition hover:bg-zinc-50/70"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex size-8 items-center justify-center rounded-md bg-orange-50 text-brand-orange"><CalendarDays className="size-4"/></span><span><span className="block max-w-56 truncate font-extrabold">{event.title}</span><span className="mt-1 block text-[10px] text-zinc-400">#{String(event.id).padStart(4,"0")} · {event.category}</span></span></div></td><td className="px-5 py-4"><span className="block max-w-48 truncate font-semibold text-zinc-600">{event.collegeName}</span><span className="mt-1 block text-[10px] text-zinc-400">{event.collegeCity}</span></td><td className="px-5 py-4"><span className="font-semibold">{formatEventDate(event.startsAt,true)}</span><span className="mt-1 block text-[10px] text-zinc-400">{formatEventTime(event.startsAt)}</span></td><td className="px-5 py-4"><StatusBadge status={event.status}/></td><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="h-1.5 w-20 overflow-hidden rounded-full bg-zinc-100"><div className="h-full rounded-full bg-brand-orange" style={{width:`${Math.min(100,percent)}%`}}/></div><span className="font-bold">{event.registrationCount}<span className="font-normal text-zinc-400">/{event.capacity}</span></span></div></td><td className="px-5 py-4 text-right"><Link href={`/admin/events/${event.id}`} className="inline-flex items-center gap-1.5 rounded-md border border-navy-900/10 px-3 py-2 text-[10px] font-bold transition hover:border-brand-orange/40 hover:text-brand-orange"><Pencil className="size-3"/>Open</Link></td></tr>})}</tbody></table>{!filtered.length&&<div className="p-14 text-center"><CircleDot className="mx-auto size-6 text-zinc-300"/><p className="mt-3 text-xs font-semibold text-zinc-400">No records match the current filters.</p></div>}</div>
    </section>
  </AdminShell>;
}

function SmallMetric({label,value}:{label:string;value:number}){return <div className="border-r border-navy-900/7 px-4 py-3 last:border-0"><p className="text-[9px] font-bold tracking-wider text-zinc-400 uppercase">{label}</p><p className="mt-1 text-sm font-extrabold">{value.toLocaleString("en-IN")}</p></div>}
function StatusBadge({status}:{status:Event["status"]}){const styles={published:"bg-emerald-50 text-emerald-700 ring-emerald-600/15",draft:"bg-amber-50 text-amber-700 ring-amber-600/15",completed:"bg-blue-50 text-blue-700 ring-blue-600/15",cancelled:"bg-red-50 text-red-700 ring-red-600/15"};return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-extrabold tracking-wide uppercase ring-1",styles[status])}><span className="size-1.5 rounded-full bg-current opacity-70"/>{status}</span>}
