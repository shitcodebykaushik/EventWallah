import Link from "next/link";
import { ArrowRight, Building2, MapPin } from "lucide-react";
import type { College } from "@/lib/api";

export function CollegeCard({ college }: { college: College }) {
  return <Link href={`/colleges/${college.slug}`} className="group flex items-center gap-4 border border-navy-900/12 bg-[#fffdf8] p-4 transition duration-300 hover:border-navy-900/30 hover:bg-white hover:shadow-[var(--shadow-soft)]">
    <span className="flex size-12 shrink-0 items-center justify-center bg-navy-950 text-xs font-extrabold text-white transition duration-300 group-hover:bg-brand-orange">{college.shortName.slice(0, 4) || <Building2 className="size-5" />}</span>
    <span className="min-w-0 flex-1"><span className="block truncate font-heading text-sm font-extrabold text-ink">{college.name}</span><span className="mt-1.5 flex items-center gap-1 text-[11px] text-zinc-500"><MapPin className="size-3 text-brand-orange" />{college.city}, {college.state}</span></span>
    <span className="text-right"><span className="block text-[9px] font-extrabold text-brand-orange">{college.eventCount} event{college.eventCount === 1 ? "" : "s"}</span><ArrowRight className="mt-2 ml-auto size-4 text-zinc-300 transition group-hover:translate-x-1 group-hover:text-brand-orange" /></span>
  </Link>;
}
