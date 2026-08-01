import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin, Ticket } from "lucide-react";
import type { Event } from "@/lib/api";
import { formatEventDate, formatEventTime } from "@/lib/api";

export function EventCard({ event }: { event: Event }) {
  const remaining = Math.max(0, event.capacity - event.registrationCount);
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-md border border-navy-900/12 bg-[#fffdf8] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card)]">
      <div className="relative min-h-40 overflow-hidden bg-navy-950 p-5 text-white">
        <div className="absolute inset-0 bg-grid-fade opacity-60" />
        <div className="absolute -right-12 -bottom-16 size-44 rounded-full bg-brand-orange/25 blur-2xl" />
        <div className="relative flex h-full flex-col justify-between gap-9">
          <span className="w-fit rounded-full border border-white/15 bg-white/8 px-3 py-1 text-[10px] font-bold tracking-[.14em] uppercase">{event.category}</span>
          <div><p className="text-xs font-semibold text-brand-orange-light">{formatEventDate(event.startsAt, true)}</p><h3 className="mt-2 font-heading text-xl font-bold leading-tight text-white">{event.title}</h3></div>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="line-clamp-2 text-sm leading-relaxed text-zinc-600">{event.summary}</p>
        <div className="mt-5 space-y-2 text-xs text-zinc-500">
          <p className="flex items-center gap-2"><MapPin className="size-3.5 text-brand-orange" />{event.collegeName}, {event.collegeCity}</p>
          <p className="flex items-center gap-2"><CalendarDays className="size-3.5 text-brand-orange" />{formatEventTime(event.startsAt)} · {event.venue}</p>
          <p className="flex items-center gap-2"><Ticket className="size-3.5 text-brand-orange" />{remaining} passes available · Free</p>
        </div>
        <Link href={`/events/${event.slug}`} className="mt-5 flex items-center justify-between border-t border-navy-900/10 pt-4 text-sm font-bold text-ink">
          View event <ArrowUpRight className="size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
    </article>
  );
}
