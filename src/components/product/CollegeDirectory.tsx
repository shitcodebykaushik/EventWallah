"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Search, SlidersHorizontal } from "lucide-react";
import { CollegeCard } from "@/components/product/CollegeCard";
import { demoColleges } from "@/content/demo";
import { apiFetch, type College } from "@/lib/api";

export function CollegeDirectory({ initialQuery = "" }: { initialQuery?: string }) {
  const [items, setItems] = useState<College[]>(demoColleges);
  const [query, setQuery] = useState(initialQuery);
  const [ownership, setOwnership] = useState("all");
  useEffect(() => { apiFetch<{items: College[]}>("/api/v1/colleges").then((data)=>setItems(data.items)).catch(()=>{}); }, []);
  const filtered = useMemo(() => items.filter((college) => {
    const words = `${college.name} ${college.shortName} ${college.city} ${college.state}`.toLowerCase();
    return words.includes(query.toLowerCase()) && (ownership === "all" || college.ownership === ownership);
  }), [items, query, ownership]);
  return <div className="min-h-[70vh] bg-[#f7f4ed] py-14 sm:py-20"><div className="container-page">
    <div className="max-w-3xl"><p className="eyebrow">Institution directory</p><h1 className="mt-5 font-heading text-4xl font-extrabold tracking-tight text-ink sm:text-6xl">Colleges and universities</h1><p className="mt-5 leading-7 text-zinc-600">Search participating institutions across India and review their published events.</p></div>
    <div className="mt-10 grid gap-3 rounded-md border border-navy-900/12 bg-[#fffdf8] p-3 shadow-[var(--shadow-soft)] sm:grid-cols-[1fr_220px]"><label className="flex items-center gap-3 rounded-sm border border-navy-900/10 px-4"><Search className="size-4 text-brand-orange"/><input value={query} onChange={(e)=>setQuery(e.target.value)} className="h-12 w-full bg-transparent text-sm outline-none" placeholder="College, university, city or state"/></label><label className="flex items-center gap-3 rounded-sm border border-navy-900/10 px-4"><SlidersHorizontal className="size-4 text-zinc-400"/><select value={ownership} onChange={(e)=>setOwnership(e.target.value)} className="h-12 w-full bg-transparent text-sm outline-none"><option value="all">All institutions</option><option value="government">Government</option><option value="private">Private</option><option value="deemed">Deemed</option></select></label></div>
    <div className="mt-8 flex items-center justify-between"><p className="text-sm font-semibold text-zinc-500">{filtered.length} institution{filtered.length===1?"":"s"}</p></div>
    {filtered.length ? <div className="mt-5 grid gap-3 md:grid-cols-2">{filtered.map((college)=><CollegeCard key={college.id} college={college}/>)}</div> : <div className="mt-5 rounded-md border border-dashed border-navy-900/20 bg-white/50 py-20 text-center"><Building2 className="mx-auto size-8 text-zinc-300"/><h2 className="mt-4 font-bold">No institution found</h2><p className="mt-2 text-sm text-zinc-500">Try another spelling, city or state.</p></div>}
  </div></div>;
}
