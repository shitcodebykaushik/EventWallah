"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarX2, Search } from "lucide-react";
import { EventCard } from "@/components/product/EventCard";
import { demoEvents } from "@/content/demo";
import { apiFetch, type Event } from "@/lib/api";

export function EventDirectory() {
  const [items,setItems]=useState<Event[]>(demoEvents); const [query,setQuery]=useState(""); const [category,setCategory]=useState("All");
  useEffect(()=>{apiFetch<{items:Event[]}>("/api/v1/events").then((data)=>setItems(data.items)).catch(()=>{});},[]);
  const categories=useMemo(()=>["All",...Array.from(new Set(items.map((event)=>event.category)))],[items]);
  const filtered=items.filter((event)=>`${event.title} ${event.collegeName} ${event.collegeCity}`.toLowerCase().includes(query.toLowerCase())&&(category==="All"||event.category===category));
  return <div className="min-h-[70vh] bg-[#f7f4ed] py-14 sm:py-20"><div className="container-page"><div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end"><div className="max-w-2xl"><p className="eyebrow">Event directory</p><h1 className="mt-5 font-heading text-4xl font-extrabold tracking-tight text-ink sm:text-6xl">College events across India</h1></div><p className="max-w-md text-sm leading-6 text-zinc-600">Search published festivals, workshops, hackathons, competitions and cultural programmes.</p></div>
  <div className="mt-10 flex flex-col gap-4 border-y border-navy-900/10 py-5 lg:flex-row lg:items-center lg:justify-between"><label className="flex h-12 max-w-xl flex-1 items-center gap-3 rounded-md border border-navy-900/12 bg-white px-4"><Search className="size-4 text-brand-orange"/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search event, college or city" className="w-full bg-transparent text-sm outline-none"/></label><div className="flex gap-2 overflow-x-auto">{categories.map((item)=><button type="button" key={item} onClick={()=>setCategory(item)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${category===item?"bg-navy-900 text-white":"border border-navy-900/12 bg-white text-zinc-500 hover:text-ink"}`}>{item}</button>)}</div></div>
  {filtered.length?<div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{filtered.map((event)=><EventCard key={event.id} event={event}/>)}</div>:<div className="py-24 text-center"><CalendarX2 className="mx-auto size-9 text-zinc-300"/><h2 className="mt-4 font-bold">No matching events</h2><p className="mt-2 text-sm text-zinc-500">Try a different search or category.</p></div>}
  </div></div>;
}
