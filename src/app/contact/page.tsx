import type { Metadata } from "next";
import { Mail, Phone } from "lucide-react";
import { PageHero } from "@/components/marketing/PageHero";
import { Section } from "@/components/marketing/Section";
import { site } from "@/content/site";

export const metadata:Metadata={title:"Contact",description:"Contact EventWallah about institution listings and upcoming events."};

export default function ContactPage(){return <><PageHero eyebrow="Contact EventWallah" title={<>Bring your campus events <span className="text-brand-orange">onto one calendar.</span></>} description="Write to us from an official institution address for listing corrections, event submissions or general support."/><Section><div className="grid gap-5 md:grid-cols-2"><article className="rounded-md border border-navy-900/12 bg-[#fffdf8] p-7"><Mail className="size-6 text-brand-orange"/><h2 className="mt-8 text-xl font-bold">Institution and event support</h2><p className="mt-3 text-sm leading-relaxed text-zinc-500">Include your institution, role and the event you represent.</p><a href={`mailto:${site.contact.partnershipsEmail}`} className="mt-6 inline-block font-bold text-brand-orange">{site.contact.partnershipsEmail}</a></article><article className="rounded-md border border-navy-900/12 bg-[#fffdf8] p-7"><Phone className="size-6 text-brand-orange"/><h2 className="mt-8 text-xl font-bold">EventWallah help desk</h2><p className="mt-3 text-sm leading-relaxed text-zinc-500">For time-sensitive listing, registration or event-day support.</p><a href={`tel:${site.poweredBy.phone.replace(/\s/g,"")}`} className="mt-6 inline-block font-bold text-brand-orange">{site.poweredBy.phone}</a></article></div></Section></>}
