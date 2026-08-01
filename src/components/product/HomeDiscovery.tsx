"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Building2, CalendarCheck2, MapPin, QrCode, Search, ShieldCheck, TicketCheck } from "lucide-react";
import { CollegeCard } from "@/components/product/CollegeCard";
import { EventCard } from "@/components/product/EventCard";
import { demoColleges, demoEvents } from "@/content/demo";
import { apiFetch, type College, type Event } from "@/lib/api";

export function HomeDiscovery() {
  const [query, setQuery] = useState("");
  const [colleges, setColleges] = useState<College[]>(demoColleges);
  const [events, setEvents] = useState<Event[]>(demoEvents);

  useEffect(() => {
    Promise.all([
      apiFetch<{ items: College[] }>("/api/v1/colleges"),
      apiFetch<{ items: Event[] }>("/api/v1/events"),
    ]).then(([collegeData, eventData]) => {
      setColleges(collegeData.items);
      setEvents(eventData.items);
    }).catch(() => {
      // Seed content keeps the product preview useful while the local API starts.
    });
  }, []);

  const matches = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return colleges.slice(0, 4);
    return colleges.filter((college) => [college.name, college.shortName, college.city, college.state].some((field) => field.toLowerCase().includes(value))).slice(0, 6);
  }, [colleges, query]);

  return <>
    <section className="relative overflow-hidden bg-[#f7f4ed] pb-20 pt-14 sm:pb-28 sm:pt-20">
      <div className="absolute inset-0 bg-grid-light opacity-60" />
      <div className="absolute -left-24 top-0 size-80 rounded-full bg-brand-orange/10 blur-3xl" />
      <div className="container-page relative">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <p className="eyebrow">College events across India</p>
            <h1 className="mt-6 max-w-3xl font-heading text-[clamp(3.2rem,7vw,6.2rem)] font-extrabold leading-[.92] tracking-[-.055em] text-ink">Your campus.<br/><span className="text-brand-orange">Your next event.</span></h1>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-zinc-600 sm:text-lg">Find your college, see what is happening on campus, and reserve a verified event pass in a few minutes.</p>
            <div className="mt-8 max-w-2xl rounded-md border border-navy-900/15 bg-[#fffdf8] p-2 shadow-[var(--shadow-card)]">
              <label htmlFor="college-search" className="sr-only">Search for a college or university</label>
              <div className="flex items-center gap-3 px-3"><Search className="size-5 shrink-0 text-brand-orange"/><input id="college-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search IIT Bombay, Delhi University, city…" className="h-13 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"/><Link href={query ? `/colleges?q=${encodeURIComponent(query)}` : "/colleges"} className="btn-primary hidden h-11 px-5 sm:inline-flex">Search colleges <ArrowRight className="size-4"/></Link></div>
              {(query || matches.length > 0) && <div className="mt-2 grid gap-2 border-t border-navy-900/8 pt-2 sm:grid-cols-2">{matches.map((college) => <Link key={college.id} href={`/colleges/${college.slug}`} className="flex items-center justify-between rounded-sm px-3 py-2.5 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-ink"><span className="truncate">{college.name}</span><span className="ml-2 text-[10px] text-zinc-400">{college.city}</span></Link>)}</div>}
            </div>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-zinc-500"><span className="flex items-center gap-2"><TicketCheck className="size-4 text-brand-orange"/>Free passes</span><span className="flex items-center gap-2"><QrCode className="size-4 text-brand-orange"/>Instant QR confirmation</span><span className="flex items-center gap-2"><ShieldCheck className="size-4 text-brand-orange"/>Verified check-in</span></div>
          </div>
          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-5 rotate-2 rounded-md border border-brand-orange/20" />
            <div className="relative overflow-hidden rounded-md border border-white/10 bg-navy-950 p-6 text-white shadow-2xl sm:p-8">
              <div className="absolute inset-0 bg-grid-fade"/><div className="relative"><div className="flex items-center justify-between"><span className="text-[10px] font-bold tracking-[.18em] text-white/45 uppercase">This week on campus</span><span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_0_5px_rgba(52,211,153,.12)]"/></div><div className="mt-8 space-y-3">{demoEvents.slice(0,3).map((event,index)=><Link href={`/events/${event.slug}`} key={event.id} className="flex items-center gap-4 rounded-sm border border-white/10 bg-white/[.045] p-4 transition hover:bg-white/[.08]"><span className="font-heading text-2xl font-extrabold text-brand-orange">0{index+1}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{event.title}</span><span className="mt-1 flex items-center gap-1 text-[11px] text-white/45"><MapPin className="size-3"/>{event.collegeCity}</span></span><ArrowRight className="size-4 text-white/30"/></Link>)}</div><div className="mt-7 flex items-end justify-between border-t border-white/10 pt-5"><div><p className="font-heading text-3xl font-extrabold">2026</p><p className="text-[11px] text-white/40">Campus calendar is live</p></div><CalendarCheck2 className="size-8 text-brand-orange"/></div></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="bg-[#fffdf8] py-20 sm:py-24"><div className="container-page"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">Happening soon</p><h2 className="mt-4 section-title">Events worth showing up for.</h2><p className="mt-3 max-w-xl text-zinc-600">Freshly published and verified with participating college teams.</p></div><Link href="/events" className="btn-secondary-light w-fit">Browse all events <ArrowRight className="size-4"/></Link></div><div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">{events.slice(0,4).map((event)=><EventCard key={event.id} event={event}/>)}</div></div></section>

    <section className="border-y border-navy-900/10 bg-[#f2efe7] py-20"><div className="container-page"><div className="grid gap-10 lg:grid-cols-[.75fr_1.25fr]"><div><p className="eyebrow">Find your institution</p><h2 className="mt-4 section-title">Start with your campus.</h2><p className="mt-4 leading-relaxed text-zinc-600">Every institution gets one clear home for upcoming events, registration details and trusted updates.</p><Link href="/colleges" className="btn-primary mt-7">Explore colleges <Building2 className="size-4"/></Link></div><div className="grid gap-3 sm:grid-cols-2">{colleges.slice(0,6).map((college)=><CollegeCard key={college.id} college={college}/>)}</div></div></div></section>

    <section className="bg-navy-950 py-20 text-white"><div className="container-page"><div className="grid gap-8 md:grid-cols-3">{[
      ["01", "Search", "Find an institution by name, city or state."],
      ["02", "Register", "Choose an event and reserve your free pass."],
      ["03", "Check in", "Show your unique QR at the venue entrance."],
    ].map(([number,title,copy])=><div key={number} className="border-l border-white/15 pl-6"><span className="text-xs font-bold text-brand-orange">{number}</span><h3 className="mt-8 text-xl font-bold text-white">{title}</h3><p className="mt-2 text-sm leading-relaxed text-white/50">{copy}</p></div>)}</div></div></section>
  </>;
}
