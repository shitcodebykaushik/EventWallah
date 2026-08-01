import { comparisonRows } from "@/content/benefits";
import { cn } from "@/lib/utils";

export function ComparisonTable() {
  return (
    <div className="overflow-hidden rounded-sm border border-navy-900/15 bg-[#fffdf8]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/80">
              <th className="px-6 py-4 text-[11px] font-semibold tracking-wide text-zinc-400 uppercase">
                Dimension
              </th>
              <th className="px-6 py-4 text-[11px] font-semibold tracking-wide text-zinc-400 uppercase">
                Typical fest
              </th>
              <th className="px-6 py-4 text-[11px] font-semibold tracking-wide text-brand-orange uppercase">
                Launch Bharat
              </th>
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row, i) => {
              const last = i === comparisonRows.length - 1;
              return (
                <tr
                  key={row.dimension}
                  className={cn(
                    last
                      ? "bg-ink text-white"
                      : "border-b border-zinc-100 bg-white transition hover:bg-zinc-50/80"
                  )}
                >
                  <td
                    className={cn(
                      "px-6 py-4 font-semibold",
                      last ? "text-brand-orange-light" : "text-ink"
                    )}
                  >
                    {row.dimension}
                  </td>
                  <td
                    className={cn(
                      "px-6 py-4",
                      last ? "text-zinc-400" : "text-zinc-500"
                    )}
                  >
                    {row.typical}
                  </td>
                  <td
                    className={cn(
                      "px-6 py-4 font-medium",
                      last ? "text-white" : "text-ink"
                    )}
                  >
                    {row.launch}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards */}
      <div className="space-y-3 border-t border-zinc-100 p-4 sm:hidden">
        {comparisonRows.map((row) => (
          <div
            key={row.dimension}
            className="rounded-sm border border-navy-900/10 bg-[#f2efe7] p-4"
          >
            <p className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">
              {row.dimension}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              <span className="font-medium text-zinc-400">Fest: </span>
              {row.typical}
            </p>
            <p className="mt-1 text-sm font-medium text-ink">
              <span className="text-brand-orange">LB: </span>
              {row.launch}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
