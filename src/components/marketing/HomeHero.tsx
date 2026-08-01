import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";

const program = [
  { id: "01", title: "Activate", detail: "Campus cell · ambassadors · teams" },
  { id: "02", title: "Build", detail: "Industry brief · mentor sprint" },
  { id: "03", title: "Pitch", detail: "Jury room · investor stage" },
  { id: "04", title: "Launch", detail: "Capital · incubation · network" },
] as const;

export function HomeHero() {
  return (
    <section className="relative overflow-hidden border-b border-navy-900/15 bg-[#f7f4ed]">
      <div className="container-page">
        <div className="flex items-center justify-between border-b border-navy-900/15 py-5 text-[10px] font-bold uppercase tracking-[0.22em] text-navy-900/45">
            <span>Launch Bharat · 2026–27 partner cohort</span>
          <span className="hidden items-center gap-2 sm:flex">
            <span className="size-1.5 bg-brand-orange" />
            Partner cohort open
          </span>
        </div>

        <div className="grid lg:grid-cols-[1.18fr_.82fr]">
          <div className="border-navy-900/15 py-14 lg:border-r lg:py-20 lg:pr-16 xl:py-24 xl:pr-20">
            <p className="eyebrow mb-9">A structured program for student founders</p>

            <h1 className="display-hero max-w-[760px] text-navy-950">
              Ideas live
              <br />
              <span className="text-brand-orange">everywhere.</span>
              <br />
              Access doesn&apos;t.
            </h1>

            <div className="mt-10 grid gap-8 border-t border-navy-900/15 pt-8 sm:grid-cols-[1fr_auto] sm:items-end">
              <p className="max-w-xl text-base leading-relaxed text-zinc-600 sm:text-lg">
                Launch Bharat gives colleges a defined way to help student
                teams move from idea to tested venture, with experienced
                mentors, relevant funding pathways, and external review.
              </p>
              <span className="hidden font-heading text-5xl font-extrabold text-navy-900/10 sm:block">
                01
              </span>
            </div>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/partner" className="btn-accent h-13 w-full px-7 sm:w-auto">
                Bring it to your campus
                <ArrowUpRight className="size-4" />
              </Link>
              <Link href="/program" className="btn-secondary-light h-13 w-full px-7 sm:w-auto">
                Explore the program
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <ul className="mt-10 grid gap-x-8 gap-y-3 border-t border-navy-900/10 pt-6 text-xs font-medium text-zinc-600 sm:grid-cols-3">
              {["External review panel", "Defined campus responsibilities", "12-week follow-up"].map((signal) => (
                <li key={signal} className="flex items-center gap-2">
                  <Check className="size-3.5 text-brand-orange" strokeWidth={2.5} />
                  {signal}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#fffdf8] py-12 lg:py-20 lg:pl-12 xl:py-24 xl:pl-16">
            <div className="flex items-end justify-between border-b-2 border-navy-950 pb-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-orange">
                  The operating model
                </p>
                <h2 className="mt-2 font-heading text-2xl font-extrabold tracking-[-0.03em] text-navy-950 sm:text-3xl">
                  Campus → Company
                </h2>
              </div>
              <p className="text-right text-[10px] font-bold uppercase tracking-[0.16em] text-navy-900/35">
                12 weeks
                <br />
                end to end
              </p>
            </div>

            <ol>
              {program.map((step, index) => (
                <li
                  key={step.id}
                  className={
                    index === 2
                      ? "grid grid-cols-[48px_1fr_auto] items-center gap-4 border-b border-navy-900/15 bg-brand-orange px-4 py-6 text-white"
                      : "grid grid-cols-[48px_1fr_auto] items-center gap-4 border-b border-navy-900/15 py-6"
                  }
                >
                  <span className={index === 2 ? "font-mono text-xs text-white/60" : "font-mono text-xs text-navy-900/35"}>
                    {step.id}
                  </span>
                  <div>
                    <h3 className={index === 2 ? "font-heading text-xl font-bold text-white" : "font-heading text-xl font-bold text-navy-950"}>
                      {step.title}
                    </h3>
                    <p className={index === 2 ? "mt-1 text-xs text-white/70" : "mt-1 text-xs text-zinc-500"}>
                      {step.detail}
                    </p>
                  </div>
                  <ArrowRight className="size-4" />
                </li>
              ))}
            </ol>

            <div className="grid grid-cols-3 border-b border-l border-navy-900/15">
              {[
                ["100+", "Campuses"],
                ["200+", "Mentors"],
                ["300+", "Ventures"],
              ].map(([value, label]) => (
                <div key={label} className="border-r border-navy-900/15 p-4 sm:p-5">
                  <p className="font-heading text-2xl font-extrabold text-navy-950">{value}</p>
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-navy-900/40">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
