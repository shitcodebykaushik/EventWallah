import { dayOne, dayTwo } from "@/content/agenda";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function AgendaList({
  items,
  dark = false,
}: {
  items: readonly { time: string; title: string; detail: string }[];
  dark?: boolean;
}) {
  return (
    <ul className={dark ? "divide-y divide-white/10" : "divide-y divide-zinc-100"}>
      {items.map((item) => (
        <li
          key={item.time + item.title}
          className="grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[130px_1fr] sm:gap-6"
        >
          <p className="text-sm font-bold tabular-nums text-brand-orange">
            {item.time}
          </p>
          <div>
            <p className={dark ? "font-semibold text-white" : "font-semibold text-ink"}>
              {item.title}
            </p>
            <p
              className={
                dark
                  ? "mt-1 text-sm text-zinc-400"
                  : "mt-1 text-sm text-zinc-500"
              }
            >
              {item.detail}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function AgendaTabs() {
  return (
    <Tabs defaultValue="day1" className="w-full">
      <TabsList className="mb-6 grid h-auto w-full grid-cols-2 rounded-full border border-zinc-200 bg-zinc-100 p-1 shadow-inner">
        <TabsTrigger
          value="day1"
          className="rounded-full py-2.5 text-sm font-semibold data-active:bg-white data-active:text-ink data-active:shadow-sm"
        >
          Day 01 · Challenge
        </TabsTrigger>
        <TabsTrigger
          value="day2"
          className="rounded-full py-2.5 text-sm font-semibold data-active:bg-ink data-active:text-white data-active:shadow-sm"
        >
          Day 02 · Grand Pitch
        </TabsTrigger>
      </TabsList>
      <TabsContent
        value="day1"
        className="rounded-[1.75rem] border border-zinc-200 bg-white p-6 shadow-[var(--shadow-soft)] md:p-8"
      >
        <div className="mb-6 border-b border-zinc-100 pb-5">
          <p className="text-[11px] font-semibold tracking-wide text-brand-orange uppercase">
            Day 01
          </p>
          <h3 className="mt-1 text-xl font-bold text-ink">{dayOne.title}</h3>
          <p className="mt-1 text-sm text-zinc-500">{dayOne.subtitle}</p>
        </div>
        <AgendaList items={dayOne.items} />
      </TabsContent>
      <TabsContent
        value="day2"
        className="rounded-[1.75rem] border border-zinc-800 bg-ink p-6 text-white shadow-[var(--shadow-soft)] md:p-8"
      >
        <div className="mb-6 border-b border-white/10 pb-5">
          <p className="text-[11px] font-semibold tracking-wide text-brand-orange uppercase">
            Day 02
          </p>
          <h3 className="mt-1 text-xl font-bold text-white">{dayTwo.title}</h3>
          <p className="mt-1 text-sm text-zinc-400">{dayTwo.subtitle}</p>
        </div>
        <AgendaList items={dayTwo.items} dark />
      </TabsContent>
    </Tabs>
  );
}
