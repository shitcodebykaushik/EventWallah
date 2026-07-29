import Link from "next/link";
import { Home, Search } from "lucide-react";

import { site } from "@/content/site";

export default function NotFound() {
  return (
    <div className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden bg-mesh-dark px-4 text-center">
      <div className="pointer-events-none absolute inset-0 bg-grid-fade" aria-hidden />

      <div className="relative">
        <p className="font-heading text-[6rem] font-extrabold leading-none tracking-tighter text-white/10 sm:text-[8rem]">
          404
        </p>

        <div className="-mt-8 sm:-mt-12">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Page not found
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-300">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
            Explore our program or head home.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/" className="btn-primary h-11 px-5">
              <Home className="size-4" />
              Go home
            </Link>
            <Link href="/program" className="btn-secondary-dark h-11 px-5">
              <Search className="size-4" />
              See the program
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm">
            <Link href="/about" className="text-slate-400 transition hover:text-white">
              About
            </Link>
            <Link href="/for-colleges" className="text-slate-400 transition hover:text-white">
              For Colleges
            </Link>
            <Link href="/for-students" className="text-slate-400 transition hover:text-white">
              For Students
            </Link>
            <Link href="/impact" className="text-slate-400 transition hover:text-white">
              Impact
            </Link>
            <Link href="/contact" className="text-slate-400 transition hover:text-white">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
