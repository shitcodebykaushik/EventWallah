"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

import { duration, easeWater } from "@/lib/motion";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden bg-mesh-dark px-4 text-center">
      <div className="pointer-events-none absolute inset-0 bg-grid-fade" aria-hidden />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.medium, ease: easeWater }}
        className="relative"
      >
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-red-500/20 ring-1 ring-red-500/20">
          <AlertTriangle className="size-7 text-red-400" />
        </span>

        <h1 className="mt-6 font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Something went wrong
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-300">
          An unexpected error occurred. Our team has been notified.
          Try refreshing, or head back to the homepage.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            onClick={reset}
            className="btn-primary h-11 px-5"
          >
            <RefreshCw className="size-4" />
            Try again
          </button>
          <Link
            href="/"
            className="btn-secondary-dark h-11 px-5"
          >
            <Home className="size-4" />
            Go home
          </Link>
        </div>

        {error.digest && (
          <p className="mt-6 text-[11px] text-slate-600">
            Error ID: {error.digest}
          </p>
        )}
      </motion.div>
    </div>
  );
}
