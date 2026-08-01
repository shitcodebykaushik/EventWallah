"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Check,
  CheckCircle2,
  CircleAlert,
  Keyboard,
  LoaderCircle,
  RotateCcw,
  ScanLine,
  ShieldCheck,
  ShieldX,
  Wifi,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { apiFetch, authHeaders } from "@/lib/api";

type Result={publicId:string;fullName:string;eventTitle:string;status:string;checkedInAt:string};
type BarcodeResult={rawValue:string};
type BarcodeDetectorInstance={detect:(source:HTMLVideoElement)=>Promise<BarcodeResult[]>};
type BarcodeDetectorConstructor=new(options:{formats:string[]})=>BarcodeDetectorInstance;

export function CheckInPanel(){
  const router=useRouter();
  const video=useRef<HTMLVideoElement>(null);
  const stream=useRef<MediaStream|null>(null);
  const scanning=useRef(false);
  const [token,setToken]=useState("");
  const [loading,setLoading]=useState(false);
  const [camera,setCamera]=useState(false);
  const [result,setResult]=useState<Result|null>(null);
  const [error,setError]=useState("");

  useEffect(()=>()=>stream.current?.getTracks().forEach((track)=>track.stop()),[]);

  async function check(value:string){
    setLoading(true);setError("");setResult(null);
    try{
      const data=await apiFetch<Result>("/api/v1/admin/check-in",{method:"POST",headers:authHeaders(),body:JSON.stringify({token:value})});
      setResult(data);setToken("");
    }catch(caught){
      if((caught as {status?:number}).status===401){router.replace("/admin/login");return}
      setError(caught instanceof Error?caught.message:"Could not verify pass");
    }finally{setLoading(false)}
  }

  function submit(event:FormEvent){event.preventDefault();if(token.trim())check(token.trim())}

  async function startCamera(){
    setError("");
    if(!navigator.mediaDevices?.getUserMedia){setError("Camera scanning is not supported in this browser. Enter the pass URL manually.");return}
    const Detector=(window as unknown as {BarcodeDetector?:BarcodeDetectorConstructor}).BarcodeDetector;
    if(!Detector){setError("Native QR scanning is not supported here. Paste the pass URL below or use Chrome on Android.");return}
    try{
      const media=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}});
      stream.current=media;setCamera(true);await new Promise((resolve)=>setTimeout(resolve,0));
      if(video.current){
        video.current.srcObject=media;await video.current.play();scanning.current=true;
        const detector=new Detector({formats:["qr_code"]});
        const scan=async()=>{if(!scanning.current||!video.current)return;try{const codes=await detector.detect(video.current);if(codes[0]?.rawValue){scanning.current=false;media.getTracks().forEach((track)=>track.stop());setCamera(false);await check(codes[0].rawValue);return}}catch{}requestAnimationFrame(scan)};
        requestAnimationFrame(scan);
      }
    }catch{setError("Camera permission was not granted. You can still paste the pass URL below.")}
  }

  function reset(){setResult(null);setError("");setToken("")}

  return <AdminShell>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-[10px] font-bold tracking-[.17em] text-zinc-400 uppercase">Venue access control</p><h2 className="mt-2 font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">Check-in terminal</h2><p className="mt-2 text-xs text-zinc-500">Validate one pass at a time against the live registration ledger.</p></div><span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700"><Wifi className="size-3.5"/>Terminal online</span></div>

    <div className="mt-7 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
      <section className="overflow-hidden rounded-md border border-navy-900/10 bg-white shadow-[0_1px_2px_rgba(16,24,43,.03)]">
        <div className="flex items-center justify-between border-b border-navy-900/8 px-5 py-4"><div><h3 className="text-xs font-extrabold">Pass validation</h3><p className="mt-1 text-[9px] text-zinc-400">Camera and manual verification terminal</p></div><span className="font-mono text-[9px] font-bold text-zinc-400">DEVICE 01</span></div>
        <div className="p-5 sm:p-7">
          {result?<div className="flex min-h-[470px] flex-col items-center justify-center text-center"><span className="flex size-20 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/60"><CheckCircle2 className="size-10 text-emerald-600"/></span><p className="mt-7 text-[10px] font-extrabold tracking-[.16em] text-emerald-700 uppercase">Access granted</p><h3 className="mt-3 font-heading text-3xl font-extrabold">{result.fullName}</h3><p className="mt-2 text-sm text-zinc-500">{result.eventTitle}</p><div className="mt-6 rounded-md border border-navy-900/8 bg-zinc-50 px-5 py-3"><p className="text-[9px] font-bold text-zinc-400 uppercase">Pass reference</p><p className="mt-1 font-mono text-sm font-extrabold">{result.publicId}</p></div><button type="button" onClick={reset} className="mt-7 inline-flex h-11 items-center gap-2 rounded-md bg-navy-950 px-5 text-xs font-bold text-white"><RotateCcw className="size-4"/>Process next attendee</button></div>:<>
            <div className="relative mx-auto flex aspect-video max-h-[500px] w-full items-center justify-center overflow-hidden rounded-md bg-navy-950">{camera?<video ref={video} muted playsInline className="h-full w-full object-cover"/>:<><div className="absolute inset-0 bg-grid-fade"/><div className="relative text-center"><span className="mx-auto flex size-20 items-center justify-center rounded-full border border-white/10 bg-white/5"><ScanLine className="size-10 text-brand-orange"/></span><p className="mt-4 text-[10px] font-bold tracking-[.15em] text-white/35 uppercase">Awaiting pass</p></div></>}<div className="pointer-events-none absolute inset-[13%] border border-white/20"><span className="absolute -left-px -top-px size-7 border-l-2 border-t-2 border-brand-orange"/><span className="absolute -right-px -top-px size-7 border-r-2 border-t-2 border-brand-orange"/><span className="absolute -bottom-px -left-px size-7 border-b-2 border-l-2 border-brand-orange"/><span className="absolute -bottom-px -right-px size-7 border-b-2 border-r-2 border-brand-orange"/></div></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[180px_1fr]"><button type="button" onClick={startCamera} className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-navy-950 text-xs font-bold text-white"><Camera className="size-4"/>{camera?"Camera active":"Start camera"}</button><form onSubmit={submit}><label className="flex h-12 items-center gap-3 rounded-md border border-navy-900/12 bg-zinc-50 px-4"><Keyboard className="size-4 text-zinc-400"/><input value={token} onChange={(e)=>setToken(e.target.value)} placeholder="Paste pass URL or secure token" className="min-w-0 flex-1 bg-transparent text-xs outline-none"/><button disabled={loading||!token.trim()} className="rounded-md bg-brand-orange px-4 py-2 text-[10px] font-bold text-white disabled:opacity-50">{loading?<LoaderCircle className="size-3.5 animate-spin"/>:"Verify"}</button></label></form></div>
            {error&&<p className="mt-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800"><ShieldX className="mt-0.5 size-4 shrink-0"/>{error}</p>}
          </>}
        </div>
      </section>

      <aside className="space-y-5">
        <section className="rounded-md border border-navy-900/10 bg-white"><div className="flex items-center gap-3 border-b border-navy-900/8 p-4"><ShieldCheck className="size-4 text-emerald-600"/><h3 className="text-xs font-extrabold">Validation controls</h3></div><div className="space-y-4 p-4">{[["Encrypted lookup","Pass token is matched on the server"],["Single entry","A checked-in pass cannot be reused"],["Live status","Cancelled passes are rejected immediately"]].map(([title,copy])=><div key={title} className="flex gap-3"><span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-50"><Check className="size-3 text-emerald-600"/></span><div><p className="text-[10px] font-extrabold">{title}</p><p className="mt-1 text-[9px] leading-relaxed text-zinc-400">{copy}</p></div></div>)}</div></section>
        <section className="rounded-md border border-blue-200 bg-blue-50 p-4"><div className="flex gap-3"><CircleAlert className="mt-0.5 size-4 shrink-0 text-blue-600"/><div><p className="text-[10px] font-extrabold text-blue-800">Entry procedure</p><ol className="mt-2 space-y-2 text-[9px] leading-relaxed text-blue-700/75"><li>1. Confirm the event shown after scanning.</li><li>2. Match the attendee name with their college ID.</li><li>3. Escalate rejected passes to the event lead.</li></ol></div></div></section>
      </aside>
    </div>
  </AdminShell>;
}
