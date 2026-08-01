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
    a: "The institution provides the venue, basic AV and internet, student volunteers, a faculty coordinator, and agreed hospitality. Launch Bharat manages the program plan, external participants, registration workflow, production, and post-event reporting.",
  },
  {
    q: "How long from first call to the flagship weekend?",
    a: "The standard planning window is approximately 60 days. It covers the initial review, MoU, campus team setup, registration, the two-day flagship, and the first round of post-event follow-up.",
  },
  {
    q: "Is there a fee for students?",
    a: "There is no student registration fee at partner institutions. Teams of two to five register after the institution opens its campus cohort.",
  },
  {
    q: "How does this help NAAC, NIRF, and IIC?",
    a: "The post-program pack organises participation records, activity logs, jury composition, outcomes, and media assets. Each institution should review how those records apply to its own NAAC, NIRF, and IIC submissions.",
  },
  {
    q: "Who reviews the student teams?",
    a: "The review panel is assembled from founders, operators, subject specialists, angels, and early-stage investors. Finalists use a five-minute presentation and three-minute question format, followed by structured sharing of relevant team materials.",
  },
  {
    q: "Can a student join if our college is not a partner yet?",
    a: "Registration is currently managed through partner institutions. Students can share the partnership page with their IIC, E-Cell, or faculty lead, or contact the partnerships team for an introduction.",
  },
];

export function Faq() {
  return (
    <Accordion className="w-full gap-2">
      {faqs.map((item, i) => (
        <AccordionItem
          key={item.q}
          value={`item-${i}`}
          className="rounded-sm border border-navy-900/15 bg-[#fffdf8] px-5 not-last:border-b-navy-900/15"
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
