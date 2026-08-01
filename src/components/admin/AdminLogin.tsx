"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle, LockKeyhole } from "lucide-react";
import { BrandMark } from "@/components/marketing/BrandMark";
import { apiFetch } from "@/lib/api";

export function AdminLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const data = await apiFetch<{ token: string }>("/api/v1/admin/login", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      localStorage.setItem("eventwallah_admin_token", data.token);
      router.replace("/admin");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not sign in");
      setLoading(false);
    }
  }

  return <div className="min-h-screen bg-navy-950 px-5 py-16">
    <div className="mx-auto max-w-md">
      <div className="text-center"><BrandMark size="lg" className="mx-auto ring-white/15"/><p className="mt-5 text-[10px] font-bold tracking-[.18em] text-brand-orange uppercase">Event operations</p><h1 className="mt-3 font-heading text-3xl font-extrabold text-white">Admin sign in</h1><p className="mt-3 text-sm text-white/45">Publish events, manage registrations and verify passes.</p></div>
      <form onSubmit={submit} className="mt-9 rounded-md border border-white/10 bg-white/[.055] p-6 backdrop-blur sm:p-8">
        <label className="block"><span className="text-xs font-bold text-white/60">Email address</span><input required name="email" type="email" defaultValue="admin@eventwallah.local" className="mt-2 h-12 w-full rounded-sm border border-white/12 bg-white/8 px-4 text-sm text-white outline-none focus:border-brand-orange"/></label>
        <label className="mt-5 block"><span className="text-xs font-bold text-white/60">Password</span><input required name="password" type="password" placeholder="Admin password" className="mt-2 h-12 w-full rounded-sm border border-white/12 bg-white/8 px-4 text-sm text-white outline-none focus:border-brand-orange"/></label>
        {error&&<p className="mt-4 rounded-sm bg-red-400/10 p-3 text-sm text-red-300">{error}</p>}
        <button disabled={loading} className="btn-accent mt-6 h-12 w-full">{loading?<><LoaderCircle className="size-4 animate-spin"/>Signing in…</>:<>Sign in securely <ArrowRight className="size-4"/></>}</button>
        <p className="mt-4 flex items-center justify-center gap-2 text-[10px] text-white/35"><LockKeyhole className="size-3"/>24-hour server-side session</p>
      </form>
    </div>
  </div>;
}
