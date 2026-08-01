"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  CircleAlert,
  ClipboardList,
  LoaderCircle,
  MapPin,
  Save,
  Settings2,
  Users,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { apiFetch, authHeaders, type College, type Event, type Registration } from "@/lib/api";

function localInput(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

export function EventEditor({ id }: { id?: string }) {
  const router = useRouter();
  const [colleges, setColleges] = useState<College[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const editing = Boolean(id);

  useEffect(() => {
    const headers = authHeaders();
    Promise.all([
      apiFetch<{ items: College[] }>("/api/v1/colleges"),
      editing ? apiFetch<{ items: Event[] }>("/api/v1/admin/events", { headers }) : Promise.resolve({ items: [] as Event[] }),
    ]).then(([collegeData, eventData]) => {
      setColleges(collegeData.items);
      const found = eventData.items.find((item) => String(item.id) === id);
      if (editing && !found) { setError("Event not found"); return; }
      if (found) {
        setEvent(found);
        apiFetch<{ items: Registration[] }>(`/api/v1/admin/events/${id}/registrations`, { headers }).then((data) => setRegistrations(data.items)).catch(() => {});
      }
    }).catch((caught) => {
      if ((caught as { status?: number }).status === 401) router.replace("/admin/login");
      else setError(caught instanceof Error ? caught.message : "Could not load editor");
    });
  }, [editing, id, router]);

  async function submit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setLoading(true);
    setError("");
    const raw = Object.fromEntries(new FormData(formEvent.currentTarget).entries());
    const body = { ...raw, collegeId: Number(raw.collegeId), capacity: Number(raw.capacity), startsAt: new Date(String(raw.startsAt)).toISOString(), endsAt: new Date(String(raw.endsAt)).toISOString(), registrationDeadline: new Date(String(raw.registrationDeadline)).toISOString() };
    try {
      await apiFetch(editing ? `/api/v1/admin/events/${id}` : "/api/v1/admin/events", { method: editing ? "PUT" : "POST", headers: authHeaders(), body: JSON.stringify(body) });
      router.push("/admin");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save event");
      setLoading(false);
    }
  }

  if (editing && !event && !error) return <AdminShell><div className="flex min-h-[55vh] items-center justify-center"><LoaderCircle className="size-5 animate-spin text-brand-orange"/><span className="ml-3 text-xs font-semibold text-zinc-500">Loading event record…</span></div></AdminShell>;
  const values = event;

  return <AdminShell>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div><Link href="/admin" className="inline-flex items-center gap-2 text-[10px] font-bold text-zinc-400 transition hover:text-ink"><ArrowLeft className="size-3.5"/>COMMAND CENTRE</Link><div className="mt-3 flex flex-wrap items-center gap-3"><h2 className="font-heading text-2xl font-extrabold tracking-tight">{editing ? "Event record" : "New event record"}</h2>{editing&&<span className="rounded-full border border-navy-900/10 bg-white px-2.5 py-1 font-mono text-[9px] font-bold text-zinc-500">EW-EVT-{String(id).padStart(4,"0")}</span>}</div><p className="mt-2 text-xs text-zinc-500">{editing ? "Maintain event information and review the attendee ledger." : "Complete the operational details before publishing this listing."}</p></div>
      {values&&<span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-600/15"><span className="size-1.5 rounded-full bg-emerald-500"/>{values.status.toUpperCase()}</span>}
    </div>

    <form onSubmit={submit} className="mt-7 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-5">
        <EditorSection icon={ClipboardList} title="General information" detail="Public identity and event description">
          <div className="grid gap-5 sm:grid-cols-2"><Field label="Event title" name="title" defaultValue={values?.title}/><label><FieldLabel>Institution</FieldLabel><select required name="collegeId" defaultValue={values?.collegeId??""} className="admin-input"><option value="" disabled>Select institution</option>{colleges.map((college)=><option key={college.id} value={college.id}>{college.name}</option>)}</select></label><Field label="Category" name="category" defaultValue={values?.category} placeholder="Technology, Culture, Sports…"/><Field label="Banner image URL" name="bannerUrl" required={false} defaultValue={values?.bannerUrl} placeholder="Optional image URL"/><label className="sm:col-span-2"><FieldLabel>Short summary</FieldLabel><input required maxLength={180} name="summary" defaultValue={values?.summary} className="admin-input" placeholder="One clear sentence for event cards"/><p className="mt-1.5 text-[9px] text-zinc-400">Maximum 180 characters</p></label><label className="sm:col-span-2"><FieldLabel>Full description</FieldLabel><textarea required name="description" defaultValue={values?.description} className="mt-2 min-h-40 w-full rounded-md border border-navy-900/12 bg-white p-4 text-sm leading-relaxed outline-none transition focus:border-brand-orange focus:ring-3 focus:ring-brand-orange/8"/></label></div>
        </EditorSection>

        <EditorSection icon={CalendarClock} title="Schedule and capacity" detail="Venue timing, registration window and pass inventory">
          <div className="grid gap-5 sm:grid-cols-2"><Field label="Venue" name="venue" defaultValue={values?.venue}/><Field label="Pass capacity" name="capacity" type="number" min="1" defaultValue={values?.capacity}/><Field label="Starts at" name="startsAt" type="datetime-local" defaultValue={values?localInput(values.startsAt):undefined}/><Field label="Ends at" name="endsAt" type="datetime-local" defaultValue={values?localInput(values.endsAt):undefined}/><Field label="Registration deadline" name="registrationDeadline" type="datetime-local" defaultValue={values?localInput(values.registrationDeadline):undefined}/></div>
        </EditorSection>

        <EditorSection icon={Users} title="Organizer record" detail="Responsible team and attendee support contact">
          <div className="grid gap-5 sm:grid-cols-2"><Field label="Organizer name" name="organizerName" defaultValue={values?.organizerName}/><Field label="Contact email" name="contactEmail" type="email" defaultValue={values?.contactEmail}/></div>
        </EditorSection>
      </div>

      <aside className="space-y-5 xl:sticky xl:top-[100px]">
        <section className="rounded-md border border-navy-900/10 bg-white shadow-[0_1px_2px_rgba(16,24,43,.03)]"><div className="flex items-center gap-3 border-b border-navy-900/8 p-4"><span className="flex size-8 items-center justify-center rounded-md bg-orange-50"><Settings2 className="size-4 text-brand-orange"/></span><div><h3 className="text-xs font-extrabold">Publishing control</h3><p className="mt-0.5 text-[9px] text-zinc-400">Visibility and record state</p></div></div><div className="p-4"><label><FieldLabel>Event status</FieldLabel><select required name="status" defaultValue={values?.status??"draft"} className="admin-input"><option value="draft">Draft — internal only</option><option value="published">Published — publicly visible</option><option value="cancelled">Cancelled</option><option value="completed">Completed</option></select></label><div className="mt-5 space-y-3 border-t border-navy-900/8 pt-4">{["Required information complete","Capacity is greater than zero","Registration closes before start"].map((item)=><p key={item} className="flex items-center gap-2 text-[10px] font-semibold text-zinc-500"><span className="flex size-4 items-center justify-center rounded-full bg-emerald-50"><Check className="size-2.5 text-emerald-600"/></span>{item}</p>)}</div></div><div className="border-t border-navy-900/8 bg-zinc-50 p-4"><button disabled={loading} className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-brand-orange text-xs font-extrabold text-white transition hover:bg-brand-orange-dark disabled:opacity-60">{loading?<LoaderCircle className="size-4 animate-spin"/>:<Save className="size-4"/>}{loading?"Saving record…":editing?"Save event record":"Create event record"}</button><p className="mt-3 text-center text-[9px] leading-relaxed text-zinc-400">Published updates appear on the client website immediately.</p></div></section>
        <section className="rounded-md border border-blue-200 bg-blue-50 p-4"><div className="flex gap-3"><CircleAlert className="mt-0.5 size-4 shrink-0 text-blue-600"/><div><p className="text-[10px] font-extrabold text-blue-800">Operational note</p><p className="mt-1 text-[10px] leading-relaxed text-blue-700/70">Review venue and deadline details with the institution before setting the record to published.</p></div></div></section>
        {error&&<p className="rounded-md border border-red-200 bg-red-50 p-4 text-xs leading-relaxed text-red-700">{error}</p>}
      </aside>
    </form>

    {editing&&<AttendeeLedger registrations={registrations}/>} 
  </AdminShell>;
}

function EditorSection({icon:Icon,title,detail,children}:{icon:typeof ClipboardList;title:string;detail:string;children:React.ReactNode}){return <section className="rounded-md border border-navy-900/10 bg-white shadow-[0_1px_2px_rgba(16,24,43,.03)]"><div className="flex items-center gap-3 border-b border-navy-900/8 px-5 py-4"><span className="flex size-8 items-center justify-center rounded-md bg-zinc-100"><Icon className="size-4 text-zinc-600"/></span><div><h3 className="text-xs font-extrabold">{title}</h3><p className="mt-0.5 text-[9px] text-zinc-400">{detail}</p></div></div><div className="p-5 sm:p-6">{children}</div></section>}
function FieldLabel({children}:{children:React.ReactNode}){return <span className="text-[10px] font-bold tracking-wide text-zinc-500 uppercase">{children}</span>}
function Field({label,name,type="text",defaultValue,placeholder,min,required=true}:{label:string;name:string;type?:string;defaultValue?:string|number;placeholder?:string;min?:string;required?:boolean}){return <label><FieldLabel>{label}</FieldLabel><input required={required} name={name} type={type} min={min} defaultValue={defaultValue} placeholder={placeholder} className="admin-input"/></label>}
function AttendeeLedger({registrations}:{registrations:Registration[]}){return <section className="mt-5 overflow-hidden rounded-md border border-navy-900/10 bg-white"><div className="flex items-center justify-between border-b border-navy-900/8 p-5"><div><h3 className="text-sm font-extrabold">Attendee ledger</h3><p className="mt-1 text-[10px] text-zinc-400">Registration identity, contact and access state</p></div><span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[9px] font-bold text-zinc-500">{registrations.length} RECORDS</span></div><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs"><thead className="bg-zinc-50 text-[9px] tracking-wider text-zinc-400 uppercase"><tr><th className="px-5 py-3">Pass ID</th><th className="px-5 py-3">Student</th><th className="px-5 py-3">Institution</th><th className="px-5 py-3">Contact</th><th className="px-5 py-3">Access state</th></tr></thead><tbody>{registrations.map((item)=><tr key={item.id} className="border-t border-navy-900/7"><td className="px-5 py-4 font-mono font-bold">{item.publicId}</td><td className="px-5 py-4"><strong className="block">{item.fullName}</strong><span className="mt-1 block text-[10px] text-zinc-400">{item.course} · {item.yearOfStudy}</span></td><td className="px-5 py-4 text-zinc-600">{item.collegeName}</td><td className="px-5 py-4 text-[10px] leading-relaxed text-zinc-500">{item.email}<br/>{item.phone}</td><td className="px-5 py-4"><span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[9px] font-extrabold uppercase">{item.status.replace("_"," ")}</span></td></tr>)}</tbody></table>{!registrations.length&&<div className="py-14 text-center"><MapPin className="mx-auto size-5 text-zinc-300"/><p className="mt-3 text-xs text-zinc-400">No registrations have been recorded.</p></div>}</div></section>}
