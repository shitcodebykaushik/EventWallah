"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Download, ExternalLink, FileCheck2, GraduationCap, LoaderCircle, Plus, Rocket, ShieldCheck, Sparkles, Target, Users } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { apiFetch, authHeaders, type College, type LaunchPartnership, type LaunchProblem, type LaunchProgram, type LaunchTeam } from "@/lib/api";

type Workspace = {
  program: LaunchProgram;
  teams: LaunchTeam[];
  problems: LaunchProblem[];
  partnerships: LaunchPartnership[];
  stageCounts: Record<string, number>;
};
type Operations = { inquiries: unknown[]; experts: unknown[]; sessions: unknown[]; pitchSlots: unknown[]; referrals: unknown[]; milestones: unknown[] };

const stages: LaunchTeam["stage"][] = ["applied", "eligible", "shortlisted", "finalist", "incubating", "launched", "rejected", "withdrawn"];

export function LaunchBharatWorkspace() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [operations, setOperations] = useState<Operations | null>(null);
  const [colleges, setColleges] = useState<College[]>([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      const [data, collegeData, operationData] = await Promise.all([
        apiFetch<Workspace>("/api/v1/admin/launch-bharat", { headers: authHeaders() }),
        apiFetch<{ items: College[] }>("/api/v1/colleges"),
        apiFetch<Operations>("/api/v1/admin/launch-bharat/operations"),
      ]);
      setWorkspace(data);
      setColleges(collegeData.items);
      setOperations(operationData);
    } catch (caught) {
      if ((caught as { status?: number }).status === 401) router.replace("/admin/login");
      else setError(caught instanceof Error ? caught.message : "Could not load Launch Bharat workspace");
    }
  }

  useEffect(() => {
    Promise.all([
      apiFetch<Workspace>("/api/v1/admin/launch-bharat", { headers: authHeaders() }),
      apiFetch<{ items: College[] }>("/api/v1/colleges"),
      apiFetch<Operations>("/api/v1/admin/launch-bharat/operations"),
    ]).then(([data, collegeData, operationData]) => { setWorkspace(data); setColleges(collegeData.items); setOperations(operationData); })
      .catch((caught) => { if ((caught as { status?: number }).status === 401) router.replace("/admin/login"); else setError(caught instanceof Error ? caught.message : "Could not load Launch Bharat workspace"); });
  }, [router]);

  const teams = useMemo(() => (workspace?.teams ?? []).filter((team) => `${team.publicId} ${team.teamName} ${team.ventureName} ${team.collegeName} ${team.stage}`.toLowerCase().includes(query.toLowerCase())), [query, workspace]);

  async function createPartnership(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const raw = Object.fromEntries(new FormData(form).entries());
    setBusy(true); setError("");
    try {
      await apiFetch("/api/v1/admin/launch-bharat/partnerships", { method: "POST", headers: authHeaders(), body: JSON.stringify({ ...raw, collegeId: Number(raw.collegeId) }) });
      form.reset(); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not add institution"); }
    finally { setBusy(false); }
  }

  async function createProblem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true); setError("");
    try {
      await apiFetch("/api/v1/admin/launch-bharat/problems", { method: "POST", headers: authHeaders(), body: JSON.stringify(Object.fromEntries(new FormData(form).entries())) });
      form.reset(); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not add problem statement"); }
    finally { setBusy(false); }
  }

  async function changeStage(teamId: number, stage: LaunchTeam["stage"]) {
    setBusy(true); setError("");
    try {
      await apiFetch(`/api/v1/admin/launch-bharat/teams/${teamId}/stage`, { method: "PUT", headers: authHeaders(), body: JSON.stringify({ stage }) });
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not update stage"); }
    finally { setBusy(false); }
  }

  async function evaluate(event: FormEvent<HTMLFormElement>, teamId: number) {
    event.preventDefault();
    const form = event.currentTarget;
    const raw = Object.fromEntries(new FormData(form).entries());
    const body = { round: raw.round, innovationScore: Number(raw.innovationScore), feasibilityScore: Number(raw.feasibilityScore), impactScore: Number(raw.impactScore), presentationScore: Number(raw.presentationScore), notes: raw.notes };
    setBusy(true); setError("");
    try {
      await apiFetch(`/api/v1/admin/launch-bharat/teams/${teamId}/evaluations`, { method: "POST", headers: authHeaders(), body: JSON.stringify(body) });
      form.reset(); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not save evaluation"); }
    finally { setBusy(false); }
  }

  const metrics = [
    ["Partner institutions", workspace?.partnerships.length ?? 0, Building2],
    ["Applications", workspace?.teams.length ?? 0, Users],
    ["Finalists", workspace?.stageCounts.finalist ?? 0, Target],
    ["Incubating / launched", (workspace?.stageCounts.incubating ?? 0) + (workspace?.stageCounts.launched ?? 0), Rocket],
  ] as const;

  return <AdminShell><div className="launch-admin">
    <div className="flex flex-col justify-between gap-6 border-t-4 border-brand-orange bg-navy-950 p-6 text-white sm:p-8 xl:flex-row xl:items-end"><div><div className="flex items-center gap-3"><span className="text-[9px] font-extrabold tracking-[.18em] text-brand-orange uppercase">Flagship programme</span><span className="text-[10px] font-bold text-white/40">{workspace?.program.edition}</span></div><h2 className="mt-5 font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Launch Bharat operations</h2><p className="mt-3 max-w-2xl text-xs leading-relaxed text-white/55">Manage institution onboarding, problem statements, team applications, evaluations and programme stages.</p></div><a href="/launch-bharat" target="_blank" className="inline-flex h-11 w-fit items-center gap-2 border border-white/20 px-5 text-xs font-bold text-white transition hover:border-white/40 hover:bg-white/5">Open public programme <ExternalLink className="size-4"/></a></div>
    {error && <p className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</p>}
    <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">{metrics.map(([label,value,Icon])=><article key={label} className="border-t-2 border-navy-950 bg-white p-5 shadow-[0_6px_20px_rgba(7,11,22,.04)]"><Icon className="size-4 text-brand-orange"/><p className="mt-6 text-[9px] font-bold tracking-wide text-zinc-400 uppercase">{label}</p><p className="mt-2 text-3xl font-extrabold">{value}</p></article>)}</div>

    <div className="mt-5 grid items-start gap-5 xl:grid-cols-[1fr_380px]">
      <section className="overflow-hidden rounded-md border border-navy-900/10 bg-white"><SectionHead icon={GraduationCap} title="College cohort" detail="Institutional onboarding and current programme phase"/><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead className="bg-zinc-50 text-[9px] font-bold text-zinc-400 uppercase"><tr><th className="px-5 py-3">Institution</th><th className="px-5 py-3">Lead</th><th className="px-5 py-3">Phase</th><th className="px-5 py-3">Status</th></tr></thead><tbody>{workspace?.partnerships.map((item)=><tr key={item.id} className="border-t border-navy-900/7"><td className="px-5 py-4"><strong>{item.collegeName}</strong><span className="mt-1 block font-mono text-[9px] text-zinc-400">{item.publicId}</span></td><td className="px-5 py-4"><span>{item.leadName}</span><span className="mt-1 block text-[9px] text-zinc-400">{item.leadEmail}</span></td><td className="px-5 py-4"><Status value={item.phase}/></td><td className="px-5 py-4"><Status value={item.status}/></td></tr>)}</tbody></table>{!workspace?.partnerships.length&&<Empty text="No partner institutions have been onboarded."/>}</div></section>
      <form onSubmit={createPartnership} className="rounded-md border border-navy-900/10 bg-white"><SectionHead icon={Building2} title="Onboard institution" detail="Create a controlled Launch Bharat cohort record"/><div className="space-y-4 border-t border-navy-900/8 p-5"><Select name="collegeId" label="Institution"><option value="">Select institution</option>{colleges.filter((college)=>!workspace?.partnerships.some((item)=>item.collegeId===college.id)).map((college)=><option key={college.id} value={college.id}>{college.name}</option>)}</Select><Input name="leadName" label="Institutional lead"/><Input name="leadEmail" label="Official email" type="email"/><Input name="notes" label="Internal notes" required={false}/><button disabled={busy} className="btn-accent h-11 w-full">{busy?<LoaderCircle className="size-4 animate-spin"/>:<Plus className="size-4"/>}Begin onboarding</button></div></form>
    </div>

    <div className="mt-5 grid items-start gap-5 xl:grid-cols-[1fr_380px]">
      <section className="overflow-hidden rounded-md border border-navy-900/10 bg-white"><div className="flex flex-col gap-4 border-b border-navy-900/8 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-sm font-extrabold">Problem statement bank</h3><p className="mt-1 text-[10px] text-zinc-400">Controlled challenges visible to student applicants</p></div><span className="rounded-full bg-zinc-100 px-2 py-1 text-[9px] font-bold text-zinc-500">{workspace?.problems.length ?? 0} RECORDS</span></div><div className="divide-y divide-navy-900/7">{workspace?.problems.map((problem)=><article key={problem.id} className="p-5"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-[9px] font-bold text-brand-orange uppercase">{problem.category}{problem.sponsorName?` · ${problem.sponsorName}`:""}</p><h4 className="mt-2 text-sm font-extrabold">{problem.title}</h4></div><Status value={problem.status}/></div><p className="mt-3 text-xs leading-relaxed text-zinc-500">{problem.brief}</p></article>)}{!workspace?.problems.length&&<Empty text="Add the first reviewed problem statement."/>}</div></section>
      <form onSubmit={createProblem} className="rounded-md border border-navy-900/10 bg-white"><SectionHead icon={Sparkles} title="Create problem" detail="Publish a clear, reviewable challenge"/><div className="space-y-4 border-t border-navy-900/8 p-5"><Input name="title" label="Problem title"/><Input name="category" label="Category"/><Input name="sponsorName" label="Sponsor / source" required={false}/><label><Label>Problem brief</Label><textarea required minLength={30} name="brief" className="mt-2 min-h-28 w-full rounded-md border border-navy-900/12 p-3 text-xs outline-none focus:border-brand-orange"/></label><Select name="status" label="Publication"><option value="draft">Draft</option><option value="open">Open for applications</option><option value="closed">Closed</option></Select><button disabled={busy} className="btn-primary h-11 w-full"><Plus className="size-4"/>Create statement</button></div></form>
    </div>

    <section className="mt-5 overflow-hidden rounded-md border border-navy-900/10 bg-white"><div className="flex flex-col gap-4 border-b border-navy-900/8 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-sm font-extrabold">Founder pipeline</h3><p className="mt-1 text-[10px] text-zinc-400">Applications, evaluation evidence and controlled stage progression</p></div><input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Search teams, colleges or stages" className="admin-input !mt-0 sm:w-72"/></div><div className="grid gap-4 p-5 lg:grid-cols-2">{teams.map((team)=><article key={team.id} className="rounded-md border border-navy-900/10 p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[9px] font-bold text-zinc-400">{team.publicId}</p><h4 className="mt-2 text-lg font-extrabold">{team.ventureName}</h4><p className="mt-1 text-[10px] text-zinc-500">{team.teamName} · {team.collegeName} · {team.memberCount} members</p></div><Status value={team.stage}/></div><p className="mt-4 line-clamp-3 text-xs leading-relaxed text-zinc-600">{team.summary}</p>{team.problemTitle&&<p className="mt-3 text-[10px] font-semibold text-brand-blue">Problem: {team.problemTitle}</p>}<div className="mt-4 grid grid-cols-2 gap-2 rounded-sm bg-zinc-50 p-3 text-[9px]"><span>Lead: <strong>{team.leadEmail}</strong></span><span>Average score: <strong>{team.averageScore?team.averageScore.toFixed(1):"Not scored"}</strong></span></div><div className="mt-4 flex flex-wrap items-center gap-2"><select disabled={busy} value={team.stage} onChange={(event)=>changeStage(team.id,event.target.value as LaunchTeam["stage"])} className="h-9 rounded-md border border-navy-900/12 px-3 text-[10px] font-bold">{stages.map((stage)=><option key={stage} value={stage}>{stage.replaceAll("_"," ")}</option>)}</select>{team.pitchDeckUrl&&<a href={team.pitchDeckUrl} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-brand-orange">Pitch deck ↗</a>}{team.prototypeUrl&&<a href={team.prototypeUrl} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-brand-blue">Prototype ↗</a>}</div><details className="mt-4 border-t border-navy-900/8 pt-3"><summary className="cursor-pointer text-[10px] font-extrabold text-brand-orange">Record evaluation</summary><form onSubmit={(event)=>evaluate(event,team.id)} className="mt-3 grid gap-3 sm:grid-cols-2"><Select name="round" label="Round"><option value="screening">Screening</option><option value="campus_pitch">Campus pitch</option><option value="grand_pitch">Grand pitch</option></Select>{["innovationScore","feasibilityScore","impactScore","presentationScore"].map((name)=><Input key={name} name={name} label={name.replace("Score","")} type="number" min="1" max="10"/>)}<Input name="notes" label="Review notes" required={false}/><button disabled={busy} className="sm:col-span-2 h-9 rounded-md bg-navy-950 text-[10px] font-bold text-white">Save accountable score</button></form></details></article>)}{!teams.length&&<div className="py-16 text-center text-xs text-zinc-400 lg:col-span-2">No team applications match the current search.</div>}</div></section>
    <section className="mt-5 overflow-hidden rounded-md border border-navy-900/10 bg-white"><div className="flex flex-col gap-4 border-b border-navy-900/8 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-sm font-extrabold">Programme delivery and outcomes</h3><p className="mt-1 text-[10px] text-zinc-400">National cohort readiness, people, live agenda and follow-through</p></div><a href="/api/v1/admin/launch-bharat/report.csv" className="inline-flex h-10 items-center gap-2 rounded-md border border-navy-900/12 px-4 text-[10px] font-bold"><Download className="size-4"/>Export team report</a></div><div className="grid grid-cols-2 gap-px bg-navy-900/8 sm:grid-cols-3 lg:grid-cols-6">{[["Partnership inquiries",operations?.inquiries.length??0],["Mentors & jury",operations?.experts.length??0],["Live sessions",operations?.sessions.length??0],["Pitch allocations",operations?.pitchSlots.length??0],["Ecosystem referrals",operations?.referrals.length??0],["Founder milestones",operations?.milestones.length??0]].map(([label,value])=><article key={String(label)} className="bg-white p-5"><p className="text-2xl font-extrabold">{value}</p><p className="mt-2 text-[9px] font-bold tracking-wide text-zinc-400 uppercase">{label}</p></article>)}</div><p className="border-t border-navy-900/8 bg-zinc-50 px-5 py-4 text-[10px] leading-5 text-zinc-500">The operations API supports full programme configuration, eligibility review, institution readiness, expert records, live sessions, pitch allocations, referrals and milestones. Detailed workflows remain governed by owner and event-manager roles.</p></section>
    <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-[0_8px_24px_rgba(5,150,105,.05)]"><span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100"><ShieldCheck className="size-4 text-emerald-600"/></span><p className="pt-1 text-[10px] leading-relaxed text-emerald-800">Launch Bharat mutations are organization-scoped, role-protected and written to the audit trail. Public applicants cannot access team, scoring or institutional contact records.</p></div>
  </div></AdminShell>;
}

function SectionHead({icon:Icon,title,detail}:{icon:typeof Rocket;title:string;detail:string}){return <div className="flex items-center gap-3 bg-white p-5"><span className="flex size-9 items-center justify-center bg-navy-950 text-white"><Icon className="size-4"/></span><div><h3 className="text-sm font-extrabold">{title}</h3><p className="mt-1 text-[10px] text-zinc-400">{detail}</p></div></div>}
function Label({children}:{children:React.ReactNode}){return <span className="text-[9px] font-bold text-zinc-500 uppercase">{children}</span>}
function Input({name,label,type="text",required=true,min,max}:{name:string;label:string;type?:string;required?:boolean;min?:string;max?:string}){return <label className="block"><Label>{label}</Label><input name={name} type={type} required={required} min={min} max={max} className="admin-input"/></label>}
function Select({name,label,children}:{name:string;label:string;children:React.ReactNode}){return <label className="block"><Label>{label}</Label><select name={name} required className="admin-input">{children}</select></label>}
function Status({value}:{value:string}){const positive=["active","open","eligible","shortlisted","finalist","incubating","launched","completed"].includes(value);return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[8px] font-extrabold tracking-wide uppercase ${positive?"bg-emerald-50 text-emerald-700":"bg-zinc-100 text-zinc-600"}`}><span className={`size-1.5 rounded-full ${positive?"bg-emerald-500":"bg-zinc-400"}`}/>{value.replaceAll("_"," ")}</span>}
function Empty({text}:{text:string}){return <div className="py-14 text-center"><FileCheck2 className="mx-auto size-6 text-zinc-300"/><p className="mt-3 text-xs text-zinc-400">{text}</p></div>}
