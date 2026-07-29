"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Send } from "lucide-react";

import { motion } from "framer-motion";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { springSoft } from "@/lib/motion";
import {
  collegeTypeLabels,
  interestLabels,
  partnershipSchema,
  roleLabels,
  type PartnershipLead,
} from "@/lib/validations/partnership";
import { cn } from "@/lib/utils";

export function PartnershipForm() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PartnershipLead>({
    resolver: zodResolver(partnershipSchema),
    defaultValues: {
      collegeType: "",
      message: "",
    },
  });

  const consent = watch("consent");
  const role = watch("role");
  const interest = watch("interest");
  const collegeType = watch("collegeType");

  async function onSubmit(data: PartnershipLead) {
    await new Promise((r) => setTimeout(r, 900));
    console.info("[PartnershipLead]", data);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-linear-to-br from-emerald-50 to-white p-10 text-center shadow-[var(--shadow-soft)]">
        <div className="relative mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50">
          <CheckCircle2 className="size-8" />
        </div>
        <h3 className="relative mt-5 text-2xl font-bold text-ink">
          Request received
        </h3>
        <p className="relative mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-500">
          Thanks for your interest in becoming a Launch Bharat anchor partner.
          Our partnerships desk will respond within{" "}
          <strong className="text-ink">48 business hours</strong> with next
          steps for the discovery call.
        </p>
        <motion.button
          type="button"
          className="btn-secondary-light relative mt-7 h-10 px-5"
          onClick={() => setSubmitted(false)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={springSoft}
        >
          Submit another inquiry
        </motion.button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 rounded-3xl border border-zinc-200 bg-white p-6 shadow-[var(--shadow-soft)] md:p-8"
      noValidate
    >
      <div className="border-b border-zinc-100 pb-5">
        <p className="text-[11px] font-semibold tracking-wide text-brand-orange uppercase">
          Partnership inquiry
        </p>
        <h3 className="mt-1 text-lg font-bold text-ink">
          Request a 30-minute discovery call
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
          We typically respond within 48 business hours.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Full name"
          error={errors.fullName?.message}
          htmlFor="fullName"
        >
          <Input
            id="fullName"
            placeholder="Dr. Priya Sharma"
            className="h-11 rounded-xl"
            {...register("fullName")}
          />
        </Field>
        <Field label="Work email" error={errors.email?.message} htmlFor="email">
          <Input
            id="email"
            type="email"
            placeholder="dean@university.edu.in"
            className="h-11 rounded-xl"
            {...register("email")}
          />
        </Field>
        <Field label="Phone" error={errors.phone?.message} htmlFor="phone">
          <Input
            id="phone"
            type="tel"
            placeholder="+91 98XXX XXXXX"
            className="h-11 rounded-xl"
            {...register("phone")}
          />
        </Field>
        <Field
          label="Institution"
          error={errors.institutionName?.message}
          htmlFor="institutionName"
        >
          <Input
            id="institutionName"
            placeholder="College / University name"
            className="h-11 rounded-xl"
            {...register("institutionName")}
          />
        </Field>
        <Field label="Your role" error={errors.role?.message}>
          <Select
            value={role}
            onValueChange={(v) =>
              setValue("role", v as PartnershipLead["role"], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger className="h-11 w-full rounded-xl">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(roleLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field
          label="City / State"
          error={errors.cityState?.message}
          htmlFor="cityState"
        >
          <Input
            id="cityState"
            placeholder="Bengaluru, Karnataka"
            className="h-11 rounded-xl"
            {...register("cityState")}
          />
        </Field>
        <Field label="Institution type (optional)">
          <Select
            value={collegeType || undefined}
            onValueChange={(v) =>
              setValue("collegeType", v as PartnershipLead["collegeType"])
            }
          >
            <SelectTrigger className="h-11 w-full rounded-xl">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(collegeTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="I am interested in" error={errors.interest?.message}>
          <Select
            value={interest}
            onValueChange={(v) =>
              setValue("interest", v as PartnershipLead["interest"], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger className="h-11 w-full rounded-xl">
              <SelectValue placeholder="Select interest" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(interestLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Message (optional)" htmlFor="message">
        <Textarea
          id="message"
          rows={4}
          placeholder="Preferred dates, IIC status, questions for the partnerships desk…"
          className="rounded-xl"
          {...register("message")}
        />
      </Field>

      <div className="flex items-start gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
        <Checkbox
          id="consent"
          checked={!!consent}
          onCheckedChange={(checked) =>
            setValue(
              "consent",
              checked === true ? true : (false as unknown as true),
              { shouldValidate: true }
            )
          }
        />
        <div className="grid gap-1">
          <Label
            htmlFor="consent"
            className="text-sm font-normal leading-snug text-zinc-600"
          >
            I agree to be contacted by Launch Bharat / The Event Wallah about
            college partnership opportunities.
          </Label>
          {errors.consent && (
            <p className="text-xs text-destructive">{errors.consent.message}</p>
          )}
        </div>
      </div>

      <motion.button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          "btn-primary h-12 w-full justify-center sm:w-auto sm:px-8",
          isSubmitting && "pointer-events-none opacity-80"
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={springSoft}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Sending…
          </>
        ) : (
          <>
            <Send className="size-4" />
            Request discovery call
          </>
        )}
      </motion.button>
      <p className="text-xs text-slate-500">
        Frontend MVP — validated in-browser; not stored on a server yet.
      </p>
    </form>
  );
}

function Field({
  label,
  error,
  htmlFor,
  children,
}: {
  label: string;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-[13px] font-medium text-slate-700">
        {label}
      </Label>
      {children}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-medium text-destructive"
          role="alert"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
