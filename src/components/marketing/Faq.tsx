"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "What does our college need to provide?",
    a: "Mostly what you already have: a 500+ seat auditorium, basic AV and Wi-Fi, student volunteers, a faculty champion, and standard hospitality. Cash outlay is designed to stay near zero. Launch Bharat brings production, jury, investors, registration platform, content, and PR.",
  },
  {
    q: "How long from first call to the flagship weekend?",
    a: "About 60 days. Discovery call → MoU and Launch Bharat Cell → ambassador activation and registrations → two-day flagship → incubation routing and impact documentation.",
  },
  {
    q: "Is there a fee for students?",
    a: "No. Partner campuses run with zero student registration fee. Teams of 2–5 sign up on the Launch Bharat platform when your college hosts.",
  },
  {
    q: "How does this help NAAC, NIRF, and IIC?",
    a: "You receive an audit-ready evidence pack: activity logs, media, jury composition, outcomes — mapped to NAAC Criterion 3, NIRF innovation weight, and IIC star-rating documentation, plus Startup India-aligned pathways.",
  },
  {
    q: "Who sits on the jury — and do investors really come?",
    a: "A curated mix of founders, operators, angels, and VCs. Investors only see pre-screened top teams in a fixed 5+3 format, with a post-event data room so follow-ups are easy — not ceremonial guest slots.",
  },
  {
    q: "Can a student join if our college is not a partner yet?",
    a: "Registration is campus-first in this phase. Share the partner page with your IIC, E-Cell, or Dean — or write to partnerships@launchbharat.in and we will help open a conversation.",
  },
];

export function Faq() {
  return (
    <Accordion className="w-full gap-2">
      {faqs.map((item, i) => (
        <AccordionItem
          key={item.q}
          value={`item-${i}`}
          className="rounded-2xl border border-[#dde5f0] bg-white px-5 shadow-[var(--shadow-soft)] not-last:border-b-[#dde5f0]"
        >
          <AccordionTrigger className="py-5 text-left text-[15px] font-semibold text-navy-900 hover:no-underline">
            {item.q}
          </AccordionTrigger>
          <AccordionContent className="pb-5 text-sm leading-relaxed text-zinc-500">
            {item.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
