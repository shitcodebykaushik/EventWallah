import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin, Ticket } from "lucide-react";
import type { Event } from "@/lib/api";
import { formatEventDate, formatEventTime } from "@/lib/api";

export function EventCard({ event }: { event: Event }) {
  const remaining = Math.max(0, event.capacity - event.registrationCount);
  return (
    <article className="group flex h-full flex-col overflow-hidden border border-navy-900/12 bg-[#fffdf8] transition duration-300 hover:border-navy-900/30 hover:shadow-[var(--shadow-soft)]">
      <div className="relative min-h-44 overflow-hidden border-t-4 border-brand-orange bg-navy-950 p-5 text-white">
        <div className="relative flex h-full flex-col justify-between gap-9">
          <div className="flex items-center justify-between"><span className="text-[9px] font-bold tracking-[.14em] text-white/55 uppercase">{event.category}</span><ArrowUpRight className="size-4 text-white/30 transition duration-300 group-hover:text-brand-orange" /></div>
          <div><p className="text-[10px] font-bold tracking-wider text-brand-orange-light uppercase">{formatEventDate(event.startsAt, true)}</p><h3 className="mt-2 font-heading text-xl font-extrabold leading-tight text-white">{event.title}</h3></div>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="line-clamp-2 text-sm leading-relaxed text-zinc-600">{event.summary}</p>
        <div className="mt-5 space-y-2 text-xs text-zinc-500">
          <p className="flex items-center gap-2"><MapPin className="size-3.5 text-brand-orange" />{event.collegeName}, {event.collegeCity}</p>
          <p className="flex items-center gap-2"><CalendarDays className="size-3.5 text-brand-orange" />{formatEventTime(event.startsAt)} · {event.venue}</p>
          <p className="flex items-center gap-2"><Ticket className="size-3.5 text-brand-orange" />{remaining} passes available · Free</p>
        </div>
        <Link href={`/events/${event.slug}`} className="mt-5 flex items-center justify-between border-t border-navy-900/8 pt-4 text-sm font-extrabold text-ink">
          View event <ArrowUpRight className="size-4 text-brand-orange transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
    </article>
  );
}
