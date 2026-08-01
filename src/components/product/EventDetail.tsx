"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Building2, CalendarDays, Clock3, Mail, MapPin, ShieldCheck, Ticket } from "lucide-react";
import { demoEvents } from "@/content/demo";
import { apiFetch, formatEventDate, formatEventTime, formatMoney, type Event, type TicketType } from "@/lib/api";

export function EventDetail({ slug }: { slug: string }) {
  const initialEvent = demoEvents.find((item) => item.slug === slug);
  const [event, setEvent] = useState<Event | undefined>(initialEvent);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch<Event>(`/api/v1/events/${slug}`),
      apiFetch<{ items: TicketType[] }>(`/api/v1/events/${slug}/tickets`),
    ]).then(([eventData, ticketData]) => { setEvent(eventData); setTickets(ticketData.items); })
      .catch(() => { if (!initialEvent) setMissing(true); });
  }, [initialEvent, slug]);

  const availability = useMemo(() => tickets.reduce((sum, item) => sum + Math.max(0, item.capacity - item.soldQuantity), 0), [tickets]);
  if (missing) return <div className="container-page py-24"><h1 className="text-3xl font-bold">Event not found</h1><Link href="/events" className="btn-primary mt-6">Browse events</Link></div>;
  if (!event) return <div className="container-page py-24">Loading event…</div>;
  const closed = tickets.length === 0 || availability === 0 || new Date(event.registrationDeadline) < new Date();
  const prices = tickets.map((item) => item.pricePaise);
  const startingPrice = prices.length ? Math.min(...prices) : 0;

  return <>
    <section className="relative overflow-hidden bg-navy-950 pb-20 pt-10 text-white sm:pb-28"><div className="absolute inset-0 bg-grid-fade" /><div className="absolute right-0 top-0 size-[30rem] rounded-full bg-brand-orange/15 blur-[100px]" /><div className="container-page relative"><Link href="/events" className="inline-flex items-center gap-2 text-xs font-bold text-white/45 hover:text-white"><ArrowLeft className="size-4" />All events</Link><div className="mt-14 grid gap-10 lg:grid-cols-[1fr_340px] lg:items-end"><div><div className="flex flex-wrap gap-2"><span className="rounded-full bg-brand-orange px-3 py-1 text-[10px] font-bold tracking-wider uppercase">{event.category}</span><span className="rounded-full border border-white/15 px-3 py-1 text-[10px] font-bold tracking-wider uppercase">{tickets.length} ticket {tickets.length === 1 ? "type" : "types"}</span></div><h1 className="mt-6 max-w-4xl font-heading text-4xl font-extrabold leading-[1.02] tracking-tight text-white sm:text-6xl">{event.title}</h1><Link href={`/colleges/${event.collegeSlug}`} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white/60 hover:text-white"><Building2 className="size-4 text-brand-orange" />{event.collegeName}</Link></div><div className="rounded-md border border-white/12 bg-white/[.055] p-5 backdrop-blur-sm"><p className="text-[10px] font-bold tracking-[.16em] text-white/40 uppercase">Event schedule</p><p className="mt-4 flex items-center gap-3 text-sm"><CalendarDays className="size-4 text-brand-orange" />{formatEventDate(event.startsAt, true)}</p><p className="mt-3 flex items-center gap-3 text-sm"><Clock3 className="size-4 text-brand-orange" />{formatEventTime(event.startsAt)} – {formatEventTime(event.endsAt)}</p><p className="mt-3 flex items-start gap-3 text-sm"><MapPin className="mt-0.5 size-4 shrink-0 text-brand-orange" />{event.venue}, {event.collegeCity}</p></div></div></div></section>
    <section className="bg-[#f7f4ed] py-14 sm:py-20"><div className="container-page grid gap-10 lg:grid-cols-[1fr_380px]"><article><p className="eyebrow">About this event</p><p className="mt-6 max-w-3xl text-lg leading-relaxed text-zinc-700">{event.description}</p><div className="mt-10 grid gap-4 border-y border-navy-900/10 py-7 sm:grid-cols-2"><div><span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">Organised by</span><p className="mt-2 font-semibold">{event.organizerName}</p></div><div><span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">Questions</span><a href={`mailto:${event.contactEmail}`} className="mt-2 flex items-center gap-2 font-semibold text-brand-orange"><Mail className="size-4" />{event.contactEmail}</a></div></div><div className="mt-10"><h2 className="font-heading text-2xl font-extrabold">Available passes</h2><div className="mt-4 grid gap-3">{tickets.map((item) => <div key={item.id} className="flex items-start justify-between gap-5 rounded-md border border-navy-900/10 bg-white p-5"><div><h3 className="text-sm font-extrabold">{item.name}</h3><p className="mt-1 text-xs leading-relaxed text-zinc-500">{item.description}</p><p className="mt-3 text-[10px] font-semibold text-zinc-400">{Math.max(0, item.capacity - item.soldQuantity)} of {item.capacity} remaining</p></div><strong className="shrink-0 text-sm">{item.pricePaise ? formatMoney(item.pricePaise) : "Free"}</strong></div>)}</div></div></article>
      <aside className="h-fit rounded-md border border-navy-900/12 bg-[#fffdf8] p-6 shadow-[var(--shadow-soft)] lg:-mt-28 lg:sticky lg:top-24"><p className="text-[10px] font-bold tracking-[.16em] text-zinc-400 uppercase">Event tickets</p><div className="mt-5 flex items-end justify-between"><div><p className="font-heading text-3xl font-extrabold">{startingPrice ? `From ${formatMoney(startingPrice)}` : "Free passes"}</p><p className="text-xs text-zinc-500">Separate inventory for every ticket</p></div><Ticket className="size-8 text-brand-orange" /></div><div className="mt-6 h-1.5 overflow-hidden rounded-full bg-zinc-100"><div className="h-full bg-brand-orange" style={{ width: `${tickets.length ? Math.min(100, tickets.reduce((sum, item) => sum + item.soldQuantity, 0) / tickets.reduce((sum, item) => sum + item.capacity, 0) * 100) : 0}%` }} /></div><p className="mt-2 text-xs font-medium text-zinc-500">{availability} passes currently available</p>{closed ? <button disabled className="mt-6 h-12 w-full rounded-md bg-zinc-200 text-sm font-bold text-zinc-500">Registration closed</button> : <Link href={`/register/${event.slug}`} className="btn-accent mt-6 h-12 w-full">Choose a pass</Link>}<p className="mt-4 flex items-center gap-2 text-[11px] leading-relaxed text-zinc-500"><ShieldCheck className="size-4 shrink-0 text-emerald-600" />A unique QR is issued only after a confirmed order.</p></aside>
    </div></section>
  </>;
}
