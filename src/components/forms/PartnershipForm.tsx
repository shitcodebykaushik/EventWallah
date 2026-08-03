"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import { apiFetch } from "@/lib/api";

export function PartnershipForm() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PartnershipLead>({
    resolver: zodResolver(partnershipSchema),
    defaultValues: {
      collegeType: "",
      message: "",
    },
  });

  const consent = useWatch({ control, name: "consent" });
  const role = useWatch({ control, name: "role" });
  const interest = useWatch({ control, name: "interest" });
  const collegeType = useWatch({ control, name: "collegeType" });

  async function onSubmit(data: PartnershipLead) {
    await apiFetch("/api/v1/launch-bharat/partnership-inquiries", { method: "POST", body: JSON.stringify({ institutionName:data.institutionName, institutionType:data.collegeType || "other", cityState:data.cityState, contactName:data.fullName, contactEmail:data.email, contactPhone:data.phone, contactRole:data.role, interest:data.interest, message:data.message || "", consent:data.consent }) });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="relative overflow-hidden rounded-md border border-emerald-300 bg-emerald-50 p-10 text-center">
        <div className="relative mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50">
          <CheckCircle2 className="size-8" />
        </div>
        <h3 className="relative mt-5 text-2xl font-bold text-ink">
          Inquiry received
        </h3>
        <p className="relative mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-500">
          Your inquiry has been securely recorded for the Launch Bharat partnerships team. We will use the official contact details provided to follow up.
        </p>
        <motion.button
          type="button"
          className="btn-secondary-light relative mt-7 h-10 px-5"
          onClick={() => setSubmitted(false)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={springSoft}
        >
          Review another inquiry
        </motion.button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 rounded-md border border-navy-900/15 bg-[#fffdf8] p-6 md:p-8"
      noValidate
    >
      <div className="border-b border-navy-900/8 pb-6">
        <p className="text-[11px] font-semibold tracking-wide text-brand-orange uppercase">
          Partnership inquiry
        </p>
        <h3 className="mt-1 text-lg font-bold text-ink">
          Request a 30-minute planning call
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
          Share enough context for the partnerships team to prepare.
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
          className="h-12 rounded-xl border-navy-900/10 bg-white"
            {...register("fullName")}
          />
        </Field>
        <Field label="Work email" error={errors.email?.message} htmlFor="email">
          <Input
            id="email"
            type="email"
            placeholder="dean@university.edu.in"
          className="h-12 rounded-xl border-navy-900/10 bg-white"
            {...register("email")}
          />
        </Field>
        <Field label="Phone" error={errors.phone?.message} htmlFor="phone">
          <Input
            id="phone"
            type="tel"
            placeholder="+91 98XXX XXXXX"
          className="h-12 rounded-xl border-navy-900/10 bg-white"
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
          className="h-12 rounded-xl border-navy-900/10 bg-white"
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
            <SelectTrigger className="h-12 w-full rounded-xl border-navy-900/10 bg-white">
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
          className="h-12 rounded-xl border-navy-900/10 bg-white"
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
            <SelectTrigger className="h-12 w-full rounded-xl border-navy-900/10 bg-white">
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
            <SelectTrigger className="h-12 w-full rounded-xl border-navy-900/10 bg-white">
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
          className="rounded-xl border-navy-900/10 bg-white"
          {...register("message")}
        />
      </Field>

      <div className="flex items-start gap-3 rounded-sm border border-navy-900/10 bg-[#f2efe7] p-4">
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
            Submit partnership inquiry
          </>
        )}
      </motion.button>
      <p className="text-xs text-slate-500">
        Your details are used only to review and respond to this institutional inquiry.
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
