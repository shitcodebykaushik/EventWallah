import { collegeContribution, institutionalReturn } from "@/content/roi";

export function RoiSplit() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-[var(--shadow-soft)]">
        <div className="border-b border-zinc-100 bg-zinc-50/80 px-6 py-5 md:px-8">
          <p className="text-[11px] font-semibold tracking-wide text-zinc-400 uppercase">
            College contribution
          </p>
          <h3 className="mt-1 text-2xl font-bold text-ink">In-kind, not cash.</h3>
        </div>
        <ul className="px-6 py-2 md:px-8">
          {collegeContribution.map((row) => (
            <li
              key={row.item}
              className="flex items-start justify-between gap-4 border-b border-zinc-100 py-4 text-sm last:border-0"
            >
              <span className="text-zinc-600">{row.item}</span>
              <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500">
                {row.source}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t border-zinc-100 bg-blue-50/40 px-6 py-5 md:px-8">
          <span className="text-sm font-semibold text-ink">
            Approx. cash cost
          </span>
          <span className="font-heading text-2xl font-extrabold text-blue-600">
            Near ₹0
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-zinc-800 bg-ink text-white shadow-[var(--shadow-soft)]">
        <div className="border-b border-white/10 px-6 py-5 md:px-8">
          <p className="text-[11px] font-semibold tracking-wide text-brand-orange uppercase">
            Institutional return
          </p>
          <h3 className="mt-1 text-2xl font-bold">A media & ranking asset.</h3>
        </div>
        <ul className="px-6 py-2 md:px-8">
          {institutionalReturn.map((row) => (
            <li
              key={row.item}
              className="flex items-start justify-between gap-4 border-b border-white/8 py-4 text-sm last:border-0"
            >
              <span className="text-zinc-400">{row.item}</span>
              <span className="shrink-0 font-semibold text-white">{row.value}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t border-white/10 bg-brand-orange/15 px-6 py-5 md:px-8">
          <span className="text-sm font-semibold text-zinc-300">
            Effective value
          </span>
          <span className="font-heading text-2xl font-extrabold text-brand-orange-light">
            ₹50L+ / campus
          </span>
        </div>
      </div>
    </div>
  );
}
