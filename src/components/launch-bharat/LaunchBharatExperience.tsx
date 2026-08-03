"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  Lightbulb,
  LoaderCircle,
  Mic2,
  Network,
  ShieldCheck,
  Users,
} from "lucide-react";
import { apiFetch, type College, type LaunchProblem, type LaunchProgram } from "@/lib/api";

type ProgrammeResponse = {
  program: LaunchProgram;
  problems: LaunchProblem[];
  metrics: { partnerColleges: number; teams: number; finalists: number };
};

type Member = {
  fullName: string;
  email: string;
  phone: string;
  course: string;
  yearOfStudy: string;
  role: "founder" | "cofounder" | "member";
  isLead: boolean;
};

const emptyMember = (lead = false): Member => ({
  fullName: "",
  email: "",
  phone: "",
  course: "",
  yearOfStudy: "",
  role: lead ? "founder" : "member",
  isLead: lead,
});

const programmeStages = [
  {
    number: "01",
    title: "College partnership",
    text: "The institution nominates a faculty coordinator and works with the programme team on student outreach and delivery.",
  },
  {
    number: "02",
    title: "Campus activation",
    text: "Students identify problems, form teams and prepare an initial solution with guidance from the campus programme cell.",
  },
  {
    number: "03",
    title: "Innovation challenge",
    text: "Teams validate the problem, develop their solution and present their work through a consistent evaluation process.",
  },
  {
    number: "04",
    title: "Startup summit and grand pitch",
    text: "Shortlisted teams present to an invited jury and receive specific feedback on the venture and its next milestones.",
  },
  {
    number: "05",
    title: "Post-programme support",
    text: "Selected teams may be introduced to relevant mentors, incubators, grant programmes and investment networks.",
  },
];

const inputClass = "mt-2 h-12 w-full rounded-md border border-navy-900/15 bg-white px-4 text-sm text-ink outline-none transition placeholder:text-zinc-400 hover:border-navy-900/30 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10";

export function LaunchBharatExperience() {
  const [programme, setProgramme] = useState<ProgrammeResponse | null>(null);
  const [colleges, setColleges] = useState<College[]>([]);
  const [members, setMembers] = useState<Member[]>([emptyMember(true), emptyMember()]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<ProgrammeResponse>("/api/v1/launch-bharat"),
      apiFetch<{ items: College[] }>("/api/v1/colleges"),
    ])
      .then(([programData, collegeData]) => {
        setProgramme(programData);
        setColleges(collegeData.items);
      })
      .catch((error) => setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Programme information is currently unavailable.",
      }));
  }, []);

  function updateMember(index: number, field: keyof Member, value: string | boolean) {
    setMembers((current) => current.map((member, memberIndex) => {
      if (field === "isLead" && value === true) return { ...member, isLead: memberIndex === index };
      return memberIndex === index ? { ...member, [field]: value } : member;
    }));
  }

  function removeMember(index: number) {
    setMembers((current) => {
      const removedLead = current[index].isLead;
      const next = current.filter((_, memberIndex) => memberIndex !== index);
      return next.map((member, memberIndex) => ({
        ...member,
        isLead: removedLead ? memberIndex === 0 : member.isLead,
      }));
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const form = event.currentTarget;
    const raw = Object.fromEntries(new FormData(form).entries());
    try {
      const result = await apiFetch<{ applicationId: string; message: string }>("/api/v1/launch-bharat/applications", {
        method: "POST",
        body: JSON.stringify({
          collegeId: Number(raw.collegeId),
          problemStatementId: raw.problemStatementId ? Number(raw.problemStatementId) : null,
          teamName: raw.teamName,
          ventureName: raw.ventureName,
          summary: raw.summary,
          pitchDeckUrl: raw.pitchDeckUrl,
          prototypeUrl: raw.prototypeUrl,
          consent: raw.consent === "on",
          termsAccepted: raw.termsAccepted === "on",
          privacyAccepted: raw.privacyAccepted === "on",
          password: raw.password,
          members,
        }),
      });
      setMessage({ type: "success", text: `${result.message} Application reference: ${result.applicationId}` });
      form.reset();
      setMembers([emptyMember(true), emptyMember()]);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "The application could not be submitted." });
    } finally {
      setSubmitting(false);
    }
  }

  return <>
    <section className="border-b border-navy-900/10 bg-[#f4f1e9]">
      <div className="container-page py-16 sm:py-20 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.12fr_.88fr] lg:items-end">
          <div>
            <p className="text-[10px] font-extrabold tracking-[.2em] text-brand-orange uppercase">A flagship programme operated by The Event Wallah</p>
            <h1 className="mt-7 font-heading text-[clamp(4rem,9vw,7.5rem)] font-extrabold leading-[.84] tracking-[-.065em] text-navy-950">Launch<br/>Bharat</h1>
            <div className="mt-8 h-1 w-20 bg-brand-orange" />
            <h2 className="mt-8 max-w-2xl font-heading text-2xl font-bold leading-tight text-ink sm:text-3xl">A national student startup programme for colleges across India.</h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-600">Launch Bharat helps student teams identify meaningful problems, develop practical solutions and present their work to experienced reviewers. The programme combines campus activity, a national flagship event and structured post-event support.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row"><a href="#apply" className="btn-accent h-12 px-6">Apply as a student team <ArrowRight className="size-4" /></a><Link href="/launch-bharat/portal" className="btn-secondary-light h-12 bg-white px-6">Applicant portal</Link><Link href="/contact" className="btn-secondary-light h-12 bg-white px-6">Institution partnership <Building2 className="size-4" /></Link></div>
          </div>

          <aside className="border-t-4 border-navy-950 bg-white p-6 shadow-[0_14px_40px_rgba(7,11,22,.07)] sm:p-8">
            <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold tracking-[.16em] text-zinc-500 uppercase">Programme brief</p><p className="mt-2 text-lg font-extrabold">{programme?.program.edition ?? "2026–27"} edition</p></div><span className="font-heading text-3xl font-extrabold text-brand-orange">LB</span></div>
            <dl className="mt-8 divide-y divide-navy-900/10 border-y border-navy-900/10">
              <Fact label="Eligible team" value="2–5 current students" />
              <Fact label="Programme format" value="Campus stages and national flagship" />
              <Fact label="Evaluation" value="Problem, solution, feasibility and presentation" />
              <Fact label="Application fee" value="No payment on this form" />
            </dl>
            <p className="mt-5 text-xs leading-5 text-zinc-500">Applications are reviewed for eligibility. Submission does not guarantee shortlisting, funding or incubation.</p>
          </aside>
        </div>
      </div>
    </section>

    <section className="bg-white py-20 sm:py-24">
      <div className="container-page">
        <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr]">
          <div><p className="eyebrow">Programme purpose</p><h2 className="mt-5 section-title">Students need more than a one-day competition.</h2></div>
          <div className="border-l border-navy-900/15 pl-6 sm:pl-10"><p className="text-lg leading-8 text-zinc-700">Launch Bharat creates a managed route from the college campus to the wider startup ecosystem. It brings institutions, student founders, mentors, industry contributors, incubators and investors into one programme with defined stages.</p><p className="mt-5 text-sm leading-7 text-zinc-500">Regular college events continue to operate independently through EventWallah. Launch Bharat has its own application, selection and evaluation process.</p></div>
        </div>

        <div className="mt-16 grid border-y border-navy-900/12 md:grid-cols-2 lg:grid-cols-4">
          <Purpose icon={Lightbulb} title="Problem selection" text="Teams begin with a clearly defined user, campus, industry or community problem." />
          <Purpose icon={Users} title="Team development" text="Students work in small teams and document their assumptions, evidence and progress." />
          <Purpose icon={Mic2} title="Structured review" text="Each presentation follows common evaluation criteria so feedback is comparable." />
          <Purpose icon={Network} title="Relevant introductions" text="Selected teams may be connected with suitable mentors, incubators and support programmes." />
        </div>
      </div>
    </section>

    <section className="bg-navy-950 py-20 text-white sm:py-24">
      <div className="container-page">
        <div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr]"><div><p className="text-[10px] font-extrabold tracking-[.2em] text-brand-orange uppercase">Programme structure</p><h2 className="mt-5 font-heading text-4xl font-extrabold leading-tight text-white sm:text-5xl">How Launch Bharat works</h2><p className="mt-5 max-w-sm text-sm leading-7 text-white/50">The programme is delivered in five connected stages. Progression depends on participation, eligibility and evaluation.</p></div><div className="border-t border-white/15">{programmeStages.map((stage) => <article key={stage.number} className="grid gap-4 border-b border-white/15 py-6 sm:grid-cols-[70px_220px_1fr] sm:items-start"><span className="font-mono text-xs font-bold text-brand-orange">{stage.number}</span><h3 className="text-base font-bold text-white">{stage.title}</h3><p className="text-sm leading-6 text-white/50">{stage.text}</p></article>)}</div></div>
      </div>
    </section>

    <section className="bg-[#f4f1e9] py-20 sm:py-24">
      <div className="container-page">
        <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr]"><div><p className="eyebrow">Flagship format</p><h2 className="mt-5 section-title">A focused two-day programme</h2><p className="mt-5 text-sm leading-7 text-zinc-600">The flagship event brings together selected student teams, programme partners and invited reviewers. The final schedule may vary by edition and host institution.</p></div><div className="grid border border-navy-900/15 bg-white md:grid-cols-2"><Day number="01" title="Innovation Challenge" text="Teams work through problem definition, solution development, mentor review and jury presentation." items={["Problem and user review", "Solution or prototype development", "Mentor feedback", "Jury evaluation"]}/><Day number="02" title="Startup Summit and Grand Pitch" text="Shortlisted teams join founder sessions and present their ventures to an invited national jury." items={["Founder and expert sessions", "Shortlisted team pitches", "Jury feedback", "Recorded next steps"]}/></div></div>
      </div>
    </section>

    <section id="apply" className="scroll-mt-24 bg-white py-20 sm:py-24">
      <div className="container-page">
        <div className="grid items-start gap-12 xl:grid-cols-[.68fr_1.32fr] xl:gap-16">
          <div className="xl:sticky xl:top-28"><p className="eyebrow">Team application</p><h2 className="mt-5 section-title">Apply to Launch Bharat</h2><p className="mt-5 text-sm leading-7 text-zinc-600">Complete the form on behalf of your team. Use accurate contact and academic information for every member.</p><div className="mt-8 border-t border-navy-900/15">{["Teams must include 2–5 current students.", "Exactly one student must be nominated as team lead.", "Private team details are visible only to authorized programme staff.", "No payment is collected through this application."].map((item) => <p key={item} className="flex gap-3 border-b border-navy-900/10 py-4 text-xs leading-5 text-zinc-600"><Check className="mt-0.5 size-4 shrink-0 text-brand-orange" />{item}</p>)}</div></div>

          <form onSubmit={submit} className="border border-navy-900/15 bg-[#fbfaf7]">
            <FormSection number="01" title="Venture information" description="Describe the team, institution and solution you are proposing." />
            <div className="grid gap-5 border-b border-navy-900/10 p-5 sm:grid-cols-2 sm:p-8"><Field label="Team name" name="teamName"/><Field label="Venture name" name="ventureName"/><label className="sm:col-span-2"><Label>College or university</Label><select required name="collegeId" className={inputClass}><option value="">Select an institution</option>{colleges.map((college) => <option key={college.id} value={college.id}>{college.name} · {college.city}</option>)}</select></label><label className="sm:col-span-2"><Label>Problem statement</Label><select name="problemStatementId" className={inputClass}><option value="">Open innovation — submit your own problem</option>{programme?.problems.map((problem) => <option key={problem.id} value={problem.id}>{problem.category} · {problem.title}</option>)}</select></label><label className="sm:col-span-2"><Label>Venture summary</Label><textarea required minLength={40} maxLength={1500} name="summary" className={`${inputClass} min-h-36 resize-y py-4`} placeholder="Explain the problem, who experiences it, your proposed solution and any work completed so far."/></label><Field label="Pitch deck URL (optional)" name="pitchDeckUrl" type="url" required={false}/><Field label="Prototype URL (optional)" name="prototypeUrl" type="url" required={false}/></div>

            <FormSection number="02" title="Team members" description="Add each student and nominate one team lead." action={members.length < 5 ? <button type="button" onClick={() => setMembers((items) => [...items, emptyMember()])} className="text-xs font-bold text-brand-orange hover:text-brand-orange-dark">Add another member</button> : undefined} />
            <div className="space-y-3 border-b border-navy-900/10 p-5 sm:p-8">{members.map((member, index) => <details open={index < 2} key={index} className="group border border-navy-900/12 bg-white"><summary className="flex cursor-pointer list-none items-center justify-between p-4"><span className="flex items-center gap-3"><span className={`flex size-8 items-center justify-center text-xs font-extrabold ${member.isLead ? "bg-brand-orange text-white" : "bg-navy-950 text-white"}`}>{index + 1}</span><span><span className="block text-xs font-bold">{member.fullName || `Team member ${index + 1}`}</span><span className="mt-0.5 block text-[9px] font-bold tracking-wide text-zinc-400 uppercase">{member.isLead ? "Team lead" : member.role.replaceAll("_", " ")}</span></span></span><ChevronDown className="size-4 text-zinc-400 transition group-open:rotate-180" /></summary><div className="grid gap-4 border-t border-navy-900/10 bg-zinc-50/60 p-4 sm:grid-cols-2"><MemberField label="Full name" value={member.fullName} onChange={(value) => updateMember(index, "fullName", value)}/><MemberField label="Email" type="email" value={member.email} onChange={(value) => updateMember(index, "email", value)}/><MemberField label="Phone" type="tel" value={member.phone} onChange={(value) => updateMember(index, "phone", value)}/><MemberField label="Course or programme" value={member.course} onChange={(value) => updateMember(index, "course", value)}/><MemberField label="Year of study" value={member.yearOfStudy} onChange={(value) => updateMember(index, "yearOfStudy", value)}/><label><Label>Team role</Label><select value={member.role} onChange={(event) => updateMember(index, "role", event.target.value)} className={inputClass}><option value="founder">Founder</option><option value="cofounder">Co-founder</option><option value="member">Team member</option></select></label><label className="flex items-center gap-3 border border-navy-900/10 bg-white p-3 text-xs font-bold"><input type="radio" checked={member.isLead} onChange={() => updateMember(index, "isLead", true)} name="teamLead" className="size-4 accent-orange-600"/>Nominate as team lead</label>{members.length > 2 && <button type="button" onClick={() => removeMember(index)} className="justify-self-start text-xs font-bold text-red-600">Remove member</button>}</div></details>)}</div>

            <FormSection number="03" title="Secure applicant portal" description="Create the password your team lead will use to track this application." />
            <div className="border-b border-navy-900/10 p-5 sm:p-8"><Field label="Portal password (10–72 characters)" name="password" type="password"/><p className="mt-3 text-xs leading-5 text-zinc-500">Keep your application reference after submission. You will need it with the lead email and this password.</p></div>
            <div className="space-y-3 p-5 sm:p-8">{message && <p role="status" className={`mb-5 border p-4 text-sm leading-6 ${message.type === "success" ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-red-300 bg-red-50 text-red-700"}`}>{message.text}</p>}<Consent name="consent">I am authorized by the team lead and every listed member has agreed to programme contact and review.</Consent><Consent name="termsAccepted">I accept the <Link className="font-bold underline" href="/terms" target="_blank">Launch Bharat participation terms</Link>.</Consent><Consent name="privacyAccepted">I have read the <Link className="font-bold underline" href="/privacy" target="_blank">privacy notice</Link> and consent to the stated processing.</Consent><button disabled={submitting || !programme} className="btn-accent mt-4 h-12 w-full disabled:cursor-not-allowed disabled:opacity-50">{submitting ? <><LoaderCircle className="size-4 animate-spin"/>Submitting application…</> : <>Submit application <ArrowRight className="size-4"/></>}</button><p className="mt-3 flex items-center justify-center gap-2 text-center text-[10px] text-zinc-400"><ShieldCheck className="size-3" />The application is transmitted to the authorized programme workspace.</p></div>
          </form>
        </div>
      </div>
    </section>
  </>;
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div className="grid grid-cols-[120px_1fr] gap-4 py-4 text-xs"><dt className="text-zinc-500">{label}</dt><dd className="font-bold text-ink">{value}</dd></div>;
}

function Purpose({ icon: Icon, title, text }: { icon: typeof Lightbulb; title: string; text: string }) {
  return <article className="border-b border-navy-900/12 p-6 first:pl-0 md:border-b-0 md:border-r md:last:border-r-0 lg:px-7"><Icon className="size-5 text-brand-orange"/><h3 className="mt-8 text-base font-extrabold">{title}</h3><p className="mt-3 text-xs leading-6 text-zinc-500">{text}</p></article>;
}

function Day({ number, title, text, items }: { number: string; title: string; text: string; items: string[] }) {
  return <article className="border-b border-navy-900/15 p-6 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 sm:p-8"><p className="font-mono text-xs font-bold text-brand-orange">DAY {number}</p><h3 className="mt-6 text-2xl font-extrabold">{title}</h3><p className="mt-4 text-sm leading-6 text-zinc-600">{text}</p><ul className="mt-7 space-y-3 border-t border-navy-900/10 pt-5">{items.map((item) => <li key={item} className="flex gap-2 text-xs text-zinc-500"><Check className="size-3.5 shrink-0 text-brand-orange" />{item}</li>)}</ul></article>;
}

function FormSection({ number, title, description, action }: { number: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-4 border-b border-navy-900/10 bg-white p-5 sm:px-8"><div className="flex items-center gap-4"><span className="font-mono text-xs font-bold text-brand-orange">{number}</span><div><h3 className="text-sm font-extrabold">{title}</h3><p className="mt-1 text-[10px] text-zinc-500">{description}</p></div></div>{action}</div>;
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-[9px] font-extrabold tracking-[.1em] text-zinc-500 uppercase">{children}</span>;
}

function Field({ label, name, type = "text", required = true }: { label: string; name: string; type?: string; required?: boolean }) {
  return <label><Label>{label}</Label><input required={required} name={name} type={type} className={inputClass}/></label>;
}

function MemberField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label><Label>{label}</Label><input required type={type} value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}/></label>;
}

function Consent({ name, children }: { name: string; children: React.ReactNode }) {
  return <label className="flex items-start gap-3 border border-navy-900/12 bg-white p-4 text-xs leading-5 text-zinc-600"><input required name={name} type="checkbox" className="mt-0.5 size-4 shrink-0 accent-orange-600"/><span>{children}</span></label>;
}
