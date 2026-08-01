"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgePercent, CircleDollarSign, LoaderCircle, Plus, ReceiptText, Ticket, Users } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { apiFetch, authHeaders, formatEventDate, formatMoney, type Coupon, type Event, type Order, type TicketType } from "@/lib/api";

export function TicketingWorkspace(){
  const router=useRouter();
  const [events,setEvents]=useState<Event[]>([]);
  const [tickets,setTickets]=useState<TicketType[]>([]);
  const [orders,setOrders]=useState<Order[]>([]);
  const [coupons,setCoupons]=useState<Coupon[]>([]);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");

  async function load(){
    const headers=authHeaders();
    try{
      const [eventData,orderData,couponData]=await Promise.all([
        apiFetch<{items:Event[]}>("/api/v1/admin/events",{headers}),
        apiFetch<{items:Order[]}>("/api/v1/admin/orders",{headers}),
        apiFetch<{items:Coupon[]}>("/api/v1/admin/coupons",{headers}),
      ]);
      setEvents(eventData.items);setOrders(orderData.items);setCoupons(couponData.items);
      const ticketGroups=await Promise.all(eventData.items.map((event)=>apiFetch<{items:TicketType[]}>(`/api/v1/admin/events/${event.id}/tickets`,{headers})));
      setTickets(ticketGroups.flatMap((group)=>group.items));
    }catch(caught){if((caught as {status?:number}).status===401)router.replace("/admin/login");else setError(caught instanceof Error?caught.message:"Could not load ticketing workspace")}
  }
  useEffect(()=>{
    const headers=authHeaders();
    Promise.all([
      apiFetch<{items:Event[]}>("/api/v1/admin/events",{headers}),
      apiFetch<{items:Order[]}>("/api/v1/admin/orders",{headers}),
      apiFetch<{items:Coupon[]}>("/api/v1/admin/coupons",{headers}),
    ]).then(async ([eventData,orderData,couponData])=>{
      setEvents(eventData.items);setOrders(orderData.items);setCoupons(couponData.items);
      const groups=await Promise.all(eventData.items.map((item)=>apiFetch<{items:TicketType[]}>(`/api/v1/admin/events/${item.id}/tickets`,{headers})));
      setTickets(groups.flatMap((group)=>group.items));
    }).catch((caught)=>{if((caught as {status?:number}).status===401)router.replace("/admin/login");else setError(caught instanceof Error?caught.message:"Could not load ticketing workspace")});
  },[router]);

  async function createTicket(event:FormEvent<HTMLFormElement>){event.preventDefault();const form=event.currentTarget;setBusy(true);setError("");const raw=Object.fromEntries(new FormData(form).entries());const eventID=Number(raw.eventId);const body={name:raw.name,description:raw.description,pricePaise:Math.round(Number(raw.priceRupees)*100),capacity:Number(raw.capacity),minPerOrder:1,maxPerOrder:Number(raw.maxPerOrder),salesStart:new Date(String(raw.salesStart)).toISOString(),salesEnd:new Date(String(raw.salesEnd)).toISOString(),benefits:"[]",status:raw.status};try{await apiFetch(`/api/v1/admin/events/${eventID}/tickets`,{method:"POST",headers:authHeaders(),body:JSON.stringify(body)});form.reset();await load()}catch(caught){setError(caught instanceof Error?caught.message:"Could not create ticket type")}finally{setBusy(false)}}
  async function createCoupon(event:FormEvent<HTMLFormElement>){event.preventDefault();const form=event.currentTarget;setBusy(true);setError("");const raw=Object.fromEntries(new FormData(form).entries());const body={eventId:Number(raw.eventId),code:raw.code,discountType:raw.discountType,discountValue:raw.discountType==="fixed"?Math.round(Number(raw.discountValue)*100):Number(raw.discountValue),maxDiscountPaise:null,minimumOrderPaise:0,usageLimit:raw.usageLimit?Number(raw.usageLimit):null,startsAt:new Date(String(raw.startsAt)).toISOString(),endsAt:new Date(String(raw.endsAt)).toISOString()};try{await apiFetch("/api/v1/admin/coupons",{method:"POST",headers:authHeaders(),body:JSON.stringify(body)});form.reset();await load()}catch(caught){setError(caught instanceof Error?caught.message:"Could not create coupon")}finally{setBusy(false)}}

  const gross=orders.reduce((sum,item)=>sum+item.subtotalPaise,0);const discounts=orders.reduce((sum,item)=>sum+item.discountPaise,0);const sold=tickets.reduce((sum,item)=>sum+item.soldQuantity,0);const capacity=tickets.reduce((sum,item)=>sum+item.capacity,0);
  return <AdminShell>
    <div><p className="text-[10px] font-bold tracking-[.17em] text-zinc-400 uppercase">Revenue operations</p><h2 className="mt-2 font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">Ticketing control room</h2><p className="mt-2 text-xs text-zinc-500">Every ticket type, offer and order remains scoped to its event.</p></div>
    {error&&<p className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</p>}
    <div className="mt-7 grid grid-cols-2 gap-3 xl:grid-cols-4">{[["Gross order value",formatMoney(gross),CircleDollarSign],["Discount issued",formatMoney(discounts),BadgePercent],["Tickets sold",sold.toLocaleString("en-IN"),Ticket],["Inventory available",Math.max(0,capacity-sold).toLocaleString("en-IN"),Users]].map(([label,value,Icon])=>{const Mark=Icon as typeof Ticket;return <article key={String(label)} className="rounded-md border border-navy-900/10 bg-white p-5"><Mark className="size-5 text-brand-orange"/><p className="mt-7 text-[10px] font-bold text-zinc-400 uppercase">{String(label)}</p><p className="mt-2 text-2xl font-extrabold">{String(value)}</p></article>})}</div>

    <div className="mt-5 grid items-start gap-5 xl:grid-cols-[1fr_360px]">
      <section className="overflow-hidden rounded-md border border-navy-900/10 bg-white"><SectionHead title="Ticket inventory" detail="Price and availability by event" count={tickets.length}/><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead className="bg-zinc-50 text-[9px] font-bold tracking-wider text-zinc-400 uppercase"><tr><th className="px-5 py-3">Ticket</th><th className="px-5 py-3">Event</th><th className="px-5 py-3">Price</th><th className="px-5 py-3">Inventory</th><th className="px-5 py-3">Sales window</th><th className="px-5 py-3">Status</th></tr></thead><tbody>{tickets.map((ticket)=><tr key={ticket.id} className="border-t border-navy-900/7"><td className="px-5 py-4"><strong>{ticket.name}</strong><span className="mt-1 block text-[10px] text-zinc-400">Max {ticket.maxPerOrder} per order</span></td><td className="px-5 py-4 text-zinc-600">{ticket.eventTitle}</td><td className="px-5 py-4 font-extrabold">{ticket.pricePaise?formatMoney(ticket.pricePaise):"Free"}</td><td className="px-5 py-4"><strong>{ticket.soldQuantity}</strong><span className="text-zinc-400"> / {ticket.capacity}</span><div className="mt-2 h-1 w-20 rounded-full bg-zinc-100"><div className="h-full rounded-full bg-brand-orange" style={{width:`${Math.min(100,ticket.soldQuantity/ticket.capacity*100)}%`}}/></div></td><td className="px-5 py-4 text-[10px] text-zinc-500">{formatEventDate(ticket.salesStart,true)}<br/>to {formatEventDate(ticket.salesEnd,true)}</td><td className="px-5 py-4"><Status value={ticket.status}/></td></tr>)}</tbody></table>{!tickets.length&&<Empty text="No ticket inventory found."/>}</div></section>

      <details open className="rounded-md border border-navy-900/10 bg-white"><summary className="cursor-pointer list-none"><SectionHead title="Create ticket type" detail="Add event-specific inventory"/></summary><form onSubmit={createTicket} className="space-y-4 border-t border-navy-900/8 p-5"><Select name="eventId" label="Event" required><option value="">Select event</option>{events.map((event)=><option key={event.id} value={event.id}>{event.title}</option>)}</Select><Input name="name" label="Ticket name" placeholder="General admission"/><Input name="description" label="Description" placeholder="What this ticket includes"/><div className="grid grid-cols-2 gap-3"><Input name="priceRupees" label="Price (₹)" type="number" min="0" defaultValue="0"/><Input name="capacity" label="Capacity" type="number" min="1"/></div><div className="grid grid-cols-2 gap-3"><Input name="maxPerOrder" label="Max/order" type="number" min="1" defaultValue="1"/><Select name="status" label="Status" required><option value="active">Active</option><option value="draft">Draft</option><option value="paused">Paused</option></Select></div><Input name="salesStart" label="Sales start" type="datetime-local"/><Input name="salesEnd" label="Sales end" type="datetime-local"/><button disabled={busy} className="btn-accent h-11 w-full">{busy?<LoaderCircle className="size-4 animate-spin"/>:<Plus className="size-4"/>}Create ticket type</button></form></details>
    </div>

    <div className="mt-5 grid items-start gap-5 xl:grid-cols-[1fr_360px]">
      <section className="overflow-hidden rounded-md border border-navy-900/10 bg-white"><SectionHead title="Order ledger" detail="Checkout, discount and payment status" count={orders.length}/><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead className="bg-zinc-50 text-[9px] font-bold tracking-wider text-zinc-400 uppercase"><tr><th className="px-5 py-3">Order</th><th className="px-5 py-3">Buyer</th><th className="px-5 py-3">Event</th><th className="px-5 py-3">Value</th><th className="px-5 py-3">Payment</th></tr></thead><tbody>{orders.map((order)=><tr key={order.id} className="border-t border-navy-900/7"><td className="px-5 py-4 font-mono font-bold">{order.publicId}<span className="mt-1 block font-sans text-[9px] font-normal text-zinc-400">{new Date(order.createdAt).toLocaleString("en-IN")}</span></td><td className="px-5 py-4"><strong>{order.buyerName}</strong><span className="mt-1 block text-[10px] text-zinc-400">{order.buyerEmail}</span></td><td className="px-5 py-4 text-zinc-600">{order.eventTitle}</td><td className="px-5 py-4 font-extrabold">{formatMoney(order.totalPaise)}{order.discountPaise>0&&<span className="mt-1 block text-[9px] font-normal text-emerald-600">Saved {formatMoney(order.discountPaise)}</span>}</td><td className="px-5 py-4"><Status value={order.paymentStatus}/></td></tr>)}</tbody></table>{!orders.length&&<Empty text="Orders appear after the first checkout."/>}</div></section>

      <details className="rounded-md border border-navy-900/10 bg-white"><summary className="cursor-pointer list-none"><SectionHead title="Create discount" detail="Issue a controlled coupon" count={coupons.length}/></summary><form onSubmit={createCoupon} className="space-y-4 border-t border-navy-900/8 p-5"><Select name="eventId" label="Event" required><option value="">Select event</option>{events.map((event)=><option key={event.id} value={event.id}>{event.title}</option>)}</Select><Input name="code" label="Coupon code" placeholder="EARLY25"/><div className="grid grid-cols-2 gap-3"><Select name="discountType" label="Type" required><option value="percentage">Percentage</option><option value="fixed">Fixed ₹</option></Select><Input name="discountValue" label="Value" type="number" min="1"/></div><Input name="usageLimit" label="Usage limit" type="number" min="1" required={false}/><Input name="startsAt" label="Valid from" type="datetime-local"/><Input name="endsAt" label="Valid until" type="datetime-local"/><button disabled={busy} className="btn-primary h-11 w-full"><BadgePercent className="size-4"/>Create coupon</button></form></details>
    </div>
  </AdminShell>;
}

function SectionHead({title,detail,count}:{title:string;detail:string;count?:number}){return <div className="flex items-center justify-between p-5"><div><h3 className="text-sm font-extrabold">{title}</h3><p className="mt-1 text-[10px] text-zinc-400">{detail}</p></div>{count!==undefined&&<span className="rounded-full bg-zinc-100 px-2 py-1 text-[9px] font-bold text-zinc-500">{count} RECORDS</span>}</div>}
function Input({name,label,type="text",placeholder,min,defaultValue,required=true}:{name:string;label:string;type?:string;placeholder?:string;min?:string;defaultValue?:string;required?:boolean}){return <label className="block"><span className="text-[9px] font-bold tracking-wide text-zinc-500 uppercase">{label}</span><input name={name} type={type} placeholder={placeholder} min={min} defaultValue={defaultValue} required={required} className="admin-input"/></label>}
function Select({name,label,children,required=false}:{name:string;label:string;children:React.ReactNode;required?:boolean}){return <label className="block"><span className="text-[9px] font-bold tracking-wide text-zinc-500 uppercase">{label}</span><select name={name} required={required} className="admin-input">{children}</select></label>}
function Status({value}:{value:string}){return <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[9px] font-extrabold tracking-wide text-zinc-600 uppercase">{value.replaceAll("_"," ")}</span>}
function Empty({text}:{text:string}){return <div className="py-14 text-center"><ReceiptText className="mx-auto size-6 text-zinc-300"/><p className="mt-3 text-xs text-zinc-400">{text}</p></div>}
