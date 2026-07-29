# Launch Bharat — Frontend MVP

Industry-grade public marketing site and college partnership funnel for **Launch Bharat**, powered by **The Event Wallah**.

Built from the college partnership proposal (`Launch Bharat.pptx.pdf` in the repo root).

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui
- react-hook-form + zod (partnership form, client-only)
- lucide-react icons

## Getting started

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm run start   # serve production build
```

## Routes

| Path | Purpose |
|------|---------|
| `/` | Home narrative + conversion |
| `/about` | Vision, mission, 2030 roadmap |
| `/program` | 5 phases, 2-day agenda, founder journey |
| `/for-colleges` | Rankings, ROI, logistics, comparison |
| `/for-students` | Student benefits + journey |
| `/impact` | Year-1 targets, KPIs, media, operator stats |
| `/partners` | Portfolio + illustrative testimonials |
| `/partner` | 60-day timeline + partnership form |
| `/contact` | Dual contact cards + form |
| `/privacy`, `/terms` | Legal placeholders |

## Content

Copy and stats live in `src/content/*` so marketing can edit without hunting JSX.

## Forms

`PartnershipForm` validates with Zod and simulates submit (success UI). Payload type: `PartnershipLead` in `src/lib/validations/partnership.ts` — ready for a future `POST /api/leads`.

## Out of scope (MVP)

Auth, student registration, college admin, investor portal, CMS, real email/CRM.

## Brand

Navy `#0b1b3a` · Orange `#f97316` · Plus Jakarta Sans (headings) + Geist (body).
