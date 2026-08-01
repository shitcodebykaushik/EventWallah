"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, LoaderCircle, LockKeyhole, TicketCheck } from "lucide-react";
import { demoEvents } from "@/content/demo";
import {
  apiFetch,
  formatEventDate,
  formatMoney,
  type Event,
  type Registration,
  type TicketType,
} from "@/lib/api";

type CheckoutResponse = {
  orderId: string;
  status: string;
  paymentRequired: boolean;
  amountPaise?: number;
  message?: string;
  registration?: Registration;
};

const fields = [
  { name: "fullName", label: "Full name", placeholder: "As shown on your college ID", type: "text" },
  { name: "email", label: "Email address", placeholder: "you@example.com", type: "email" },
  { name: "phone", label: "Mobile number", placeholder: "10-digit mobile number", type: "tel" },
  { name: "collegeName", label: "Your college or university", placeholder: "Institution name", type: "text" },
  { name: "course", label: "Course / programme", placeholder: "For example, B.Tech CSE", type: "text" },
] as const;

export function RegistrationForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [event, setEvent] = useState<Event | undefined>(demoEvents.find((item) => item.slug === slug));
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [ticketID, setTicketID] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiFetch<Event>(`/api/v1/events/${slug}`),
      apiFetch<{ items: TicketType[] }>(`/api/v1/events/${slug}/tickets`),
    ]).then(([eventData, ticketData]) => {
      setEvent(eventData);
      setTickets(ticketData.items);
      setTicketID((current) => current ?? ticketData.items[0]?.id ?? null);
    }).catch(() => setError("Ticket inventory is temporarily unavailable. Please try again shortly."));
  }, [slug]);

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === ticketID),
    [ticketID, tickets],
  );
  const soldOut = selectedTicket ? selectedTicket.soldQuantity >= selectedTicket.capacity : true;
  const paidCheckout = Boolean(selectedTicket?.pricePaise);

  async function submit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (!selectedTicket || soldOut || paidCheckout) return;
    setLoading(true);
    setError("");
    const body = Object.fromEntries(new FormData(formEvent.currentTarget).entries());
    try {
      const checkout = await apiFetch<CheckoutResponse>(`/api/v1/events/${slug}/orders`, {
        method: "POST",
        body: JSON.stringify({ ...body, ticketTypeId: selectedTicket.id, quantity: 1 }),
      });
      if (!checkout.registration) throw new Error(checkout.message ?? "The order could not be confirmed.");
      sessionStorage.setItem(
        `eventwallah_pass_${checkout.registration.passToken}`,
        JSON.stringify(checkout.registration),
      );
      router.push(`/pass/${checkout.registration.passToken}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not complete registration");
      setLoading(false);
    }
  }

  if (!event) return <div className="container-narrow py-24">Loading registration…</div>;

  return <div className="bg-[#f7f4ed] py-12 sm:py-20">
    <div className="container-page">
      <Link href={`/events/${slug}`} className="inline-flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-ink"><ArrowLeft className="size-4" />Back to event</Link>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="rounded-md border border-navy-900/12 bg-[#fffdf8] p-6 shadow-[var(--shadow-soft)] sm:p-9">
          <p className="eyebrow">Secure checkout</p>
          <h1 className="mt-5 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">Choose your pass.</h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">Each ticket has separate pricing and inventory. Your details are used for venue verification.</p>

          <div className="mt-8 grid gap-3">
            {tickets.map((ticket) => {
              const unavailable = ticket.soldQuantity >= ticket.capacity;
              return <label key={ticket.id} className={`flex cursor-pointer items-start gap-4 rounded-md border p-4 transition ${ticketID === ticket.id ? "border-brand-orange bg-orange-50/60" : "border-navy-900/10 bg-white"} ${unavailable ? "cursor-not-allowed opacity-50" : ""}`}>
                <input type="radio" name="ticketSelection" checked={ticketID === ticket.id} disabled={unavailable} onChange={() => setTicketID(ticket.id)} className="mt-1 accent-orange-600" />
                <span className="min-w-0 flex-1"><strong className="block text-sm">{ticket.name}</strong><span className="mt-1 block text-xs leading-relaxed text-zinc-500">{ticket.description}</span><span className="mt-2 block text-[10px] font-semibold text-zinc-400">{Math.max(0, ticket.capacity - ticket.soldQuantity)} remaining</span></span>
                <strong className="text-sm">{ticket.pricePaise ? formatMoney(ticket.pricePaise) : "Free"}</strong>
              </label>;
            })}
            {!tickets.length && <p className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">No ticket types are currently on sale.</p>}
          </div>

          <form onSubmit={submit} className="mt-8 grid gap-5 sm:grid-cols-2">
            {fields.map((field) => <label key={field.name} className={field.name === "collegeName" ? "sm:col-span-2" : ""}><span className="text-xs font-bold text-zinc-600">{field.label}</span><input required name={field.name} type={field.type} placeholder={field.placeholder} className="mt-2 h-12 w-full rounded-sm border border-navy-900/15 bg-white px-4 text-sm outline-none transition focus:border-brand-orange" /></label>)}
            <label><span className="text-xs font-bold text-zinc-600">Year of study</span><select required name="yearOfStudy" defaultValue="" className="mt-2 h-12 w-full rounded-sm border border-navy-900/15 bg-white px-4 text-sm outline-none focus:border-brand-orange"><option value="" disabled>Select year</option><option>1st year</option><option>2nd year</option><option>3rd year</option><option>4th year</option><option>5th year or above</option><option>Alumni</option></select></label>
            <label><span className="text-xs font-bold text-zinc-600">Coupon code <span className="font-normal text-zinc-400">(optional)</span></span><input name="couponCode" placeholder="Enter code" className="mt-2 h-12 w-full rounded-sm border border-navy-900/15 bg-white px-4 text-sm uppercase outline-none focus:border-brand-orange" /></label>
            {paidCheckout && <p className="sm:col-span-2 rounded-sm border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">Online payment for this ticket is being configured. The ticket is visible, but checkout will open only after the payment gateway is connected.</p>}
            {error && <p role="alert" className="sm:col-span-2 rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <div className="sm:col-span-2"><button disabled={loading || soldOut || paidCheckout || !selectedTicket} className="btn-accent h-12 w-full disabled:cursor-not-allowed disabled:opacity-50">{loading ? <><LoaderCircle className="size-4 animate-spin" />Confirming your order…</> : paidCheckout ? <>Payment checkout coming soon</> : <>Confirm free pass <TicketCheck className="size-4" /></>}</button><p className="mt-3 flex items-center justify-center gap-2 text-[11px] text-zinc-400"><LockKeyhole className="size-3.5" />Your QR contains a secure pass ID, not personal details.</p></div>
          </form>
        </div>

        <aside className="rounded-md bg-navy-950 p-6 text-white lg:sticky lg:top-24">
          <p className="text-[10px] font-bold tracking-[.16em] text-brand-orange uppercase">Order summary</p>
          <h2 className="mt-4 text-2xl font-bold text-white">{event.title}</h2>
          <p className="mt-3 text-sm text-white/50">{event.collegeName}</p>
          <div className="mt-7 space-y-3 border-t border-white/10 pt-6 text-sm text-white/65"><p>{formatEventDate(event.startsAt, true)}</p><p>{event.venue}</p><p className="flex justify-between"><span>{selectedTicket?.name ?? "Select a ticket"}</span><strong className="text-white">{selectedTicket ? selectedTicket.pricePaise ? formatMoney(selectedTicket.pricePaise) : "Free" : "—"}</strong></p></div>
          <div className="mt-8 space-y-3">{["Instant confirmation for free passes", "Unique QR for each attendee", "Faster entry at the venue"].map((item) => <p key={item} className="flex items-center gap-2 text-xs text-white/55"><Check className="size-4 text-emerald-400" />{item}</p>)}</div>
        </aside>
      </div>
    </div>
  </div>;
}
