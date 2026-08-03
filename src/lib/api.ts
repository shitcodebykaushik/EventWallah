export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

export type College = {
  id: number;
  slug: string;
  name: string;
  shortName: string;
  institutionType: "college" | "university";
  ownership: "government" | "private" | "deemed";
  city: string;
  state: string;
  website: string;
  logoUrl: string;
  eventCount: number;
};

export type Event = {
  id: number;
  collegeId: number;
  collegeSlug: string;
  collegeName: string;
  collegeCity: string;
  slug: string;
  title: string;
  category: string;
  summary: string;
  description: string;
  venue: string;
  startsAt: string;
  endsAt: string;
  registrationDeadline: string;
  capacity: number;
  status: "draft" | "published" | "cancelled" | "completed";
  bannerUrl: string;
  organizerName: string;
  contactEmail: string;
  registrationCount: number;
};

export type Registration = {
  id: number;
  publicId: string;
  eventId: number;
  eventSlug?: string;
  eventTitle: string;
  fullName: string;
  email: string;
  phone: string;
  collegeName: string;
  course: string;
  yearOfStudy: string;
  passToken: string;
  status: "confirmed" | "cancelled" | "checked_in";
  checkedInAt: string | null;
  createdAt: string;
  qrUrl: string;
  passUrl: string;
};

export type Pass = {
  publicId: string;
  fullName: string;
  studentCollege: string;
  course: string;
  yearOfStudy: string;
  status: "confirmed" | "cancelled" | "checked_in";
  checkedInAt: string | null;
  eventSlug: string;
  eventTitle: string;
  startsAt: string;
  venue: string;
  hostCollege: string;
  qrUrl: string;
};

export type TicketType = {
  id: number;
  eventId: number;
  eventTitle?: string;
  name: string;
  description: string;
  pricePaise: number;
  capacity: number;
  soldQuantity: number;
  minPerOrder: number;
  maxPerOrder: number;
  salesStart: string;
  salesEnd: string;
  benefits: string;
  status: "draft" | "active" | "paused" | "sold_out" | "archived";
};

export type Order = {
  id: number;
  publicId: string;
  eventTitle: string;
  buyerName: string;
  buyerEmail: string;
  subtotalPaise: number;
  discountPaise: number;
  totalPaise: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
};

export type Coupon = {
  id: number;
  eventId: number | null;
  eventTitle: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxDiscountPaise: number | null;
  minimumOrderPaise: number;
  usageLimit: number | null;
  usedCount: number;
  startsAt: string;
  endsAt: string;
  status: string;
};

export type Sponsor = {
  id: number;
  name: string;
  industry: string;
  website: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  notes: string;
  status: string;
  dealCount: number;
  contractedPaise: number;
};

export type SponsorshipDeliverable = {
  id: number;
  dealId: number;
  title: string;
  ownerName: string;
  dueAt: string | null;
  status: string;
  evidenceUrl: string;
  completedAt: string | null;
};

export type SponsorshipDeal = {
  id: number;
  eventId: number;
  eventTitle: string;
  sponsorId: number;
  sponsorName: string;
  packageId: number | null;
  packageName: string | null;
  stage: string;
  contractedValuePaise: number;
  cashValuePaise: number;
  inKindValuePaise: number;
  receivedPaise: number;
  ownerName: string;
  nextAction: string;
  nextActionAt: string | null;
  notes: string;
  deliverables: SponsorshipDeliverable[];
};

export type FinanceSummary = {
  ticketGrossPaise: number;
  ticketDiscountPaise: number;
  ticketCollectedPaise: number;
  sponsorContractedPaise: number;
  sponsorReceivedPaise: number;
  sponsorOutstandingPaise: number;
  expensesPaise: number;
  netPositionPaise: number;
};

export type AuditLog = {
  id: number;
  action: string;
  entityType: string;
  entityId: string;
  metadata: string;
  createdAt: string;
  actorName: string;
};

export type LaunchProgram = {
  id: number;
  slug: string;
  name: string;
  edition: string;
  tagline: string;
  summary: string;
  vision: string;
  applicationsOpenAt: string;
  applicationsCloseAt: string;
  status: "draft" | "published" | "paused" | "completed" | "archived";
};

export type LaunchProblem = {
  id: number;
  title: string;
  brief: string;
  category: string;
  sponsorName: string;
  status: "draft" | "open" | "closed" | "archived";
};

export type LaunchTeam = {
  id: number;
  publicId: string;
  collegeId: number;
  collegeName: string;
  problemStatementId: number | null;
  problemTitle: string;
  teamName: string;
  ventureName: string;
  summary: string;
  pitchDeckUrl: string;
  prototypeUrl: string;
  leadEmail: string;
  stage: "applied" | "eligible" | "shortlisted" | "finalist" | "incubating" | "launched" | "rejected" | "withdrawn";
  memberCount: number;
  averageScore: number;
  createdAt: string;
};

export type LaunchPartnership = {
  id: number;
  publicId: string;
  collegeId: number;
  collegeName: string;
  status: string;
  phase: string;
  leadName: string;
  leadEmail: string;
  mouSignedAt: string | null;
  notes: string;
};

export function formatMoney(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: paise % 100 === 0 ? 0 : 2,
  }).format(paise / 100);
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    const headers = new Headers(init?.headers);
    if (!(init?.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      credentials: "include",
      headers,
    });
  } catch {
    throw new ApiError(
      "EventWallah service is unavailable. Start the app with `npm run dev` and try again.",
      0,
    );
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(body?.error ?? "Something went wrong", response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function authHeaders(): HeadersInit {
  return {};
}

export function formatEventDate(value: string, includeYear = false) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(includeYear ? { year: "numeric" } : {}),
  }).format(new Date(value));
}

export function formatEventTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
