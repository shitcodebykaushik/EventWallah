# EventWallah — Product Vision and Delivery Blueprint

Last updated: 2 August 2026

This document is the source of truth for EventWallah. Read it before making product, design, architecture, or business-logic changes. It explains what we are building, why it exists, how it should work, what is already implemented, and what remains.

## 1. Product in one sentence

EventWallah is an India-focused college event discovery, ticketing, sponsorship, and operations platform where students find events at colleges and universities, register for event-specific passes, receive a secure QR code, and event teams manage the complete operation through a professional ERP-style admin system.

## 2. The problem we are solving

College events in India are fragmented across social media posts, messaging groups, forms, spreadsheets, and disconnected payment links. Students struggle to discover relevant events or verify whether registration is genuine. Organizers struggle to manage inventory, registrations, sponsors, money, communication, and entry operations in one place.

EventWallah should become the trusted system connecting these two sides:

- Students get one searchable destination for legitimate college events.
- Colleges and organizers get one operational system for planning, selling, promoting, and running events.
- Sponsors get structured brand partnerships with measurable deliverables.
- Event teams get reliable records for sales, finance, attendance, and accountability.

## 3. Long-term goal

Build the leading college-event infrastructure platform for India, covering private and government colleges, universities, student communities, festivals, competitions, workshops, conferences, cultural programmes, and campus entrepreneurship events.

The platform should eventually support the complete lifecycle:

1. Institution discovery and verification
2. Event creation and approval
3. Public event discovery
4. Free and paid ticketing
5. Offers and controlled discounts
6. Sponsorship sales and fulfilment
7. Marketing and attendee communication
8. Event finance and vendor expenses
9. QR-based venue entry
10. Post-event reporting and analytics

## 4. Product principles

Every future decision should follow these principles:

- Trust first: published events, passes, prices, payments, and organizer identities must be clear and verifiable.
- Institution-first discovery: students should be able to begin with their college or university and immediately see its events.
- Event-specific operations: tickets, prices, coupons, sponsors, sales, expenses, and reports belong to a specific event unless explicitly organization-wide.
- Professional, not decorative: the public UI should feel credible and polished; the admin UI should feel like a corporate ERP, not a generic AI-generated dashboard.
- Mobile-first for students: discovery, registration, QR access, and check-in must work exceptionally well on phones.
- Operational safety: paid access is issued only after verified payment; a QR pass cannot be reused; sensitive changes are authenticated and audited.
- Multi-organization by design: data belonging to one organizer must never be visible or editable by another organizer.
- Clear states: draft, published, paused, pending, confirmed, paid, checked in, cancelled, refunded, and completed must have precise meanings.
- Build for India: INR, Indian phone numbers, Indian institutions, local dates and time zones, and India-appropriate payment methods should be first-class.

## 5. Primary users

### Students and attendees

Students search for a college, discover events, review event details, select a ticket, register or pay, receive a QR pass, and present it at the venue.

### College and event administrators

Authorized staff or student organizers create and publish events, configure tickets, review orders, manage attendees, monitor capacity, and run check-in.

### Sponsorship and partnership teams

Teams maintain sponsor relationships, move opportunities through a pipeline, record contracted and received value, and track promised brand deliverables.

### Finance teams

Finance users review ticket collections, sponsorship collections, outstanding amounts, discounts, expenses, taxes, and the event's net financial position.

### Entry and check-in operators

Operators scan QR codes, see the minimum information needed to validate a pass, and perform a one-time check-in without accessing sensitive commercial data.

### Platform operators — future

EventWallah's internal team will verify institutions and organizers, moderate public content, resolve disputes, manage platform configuration, and monitor risk across all organizations.

## 6. Core student journey

1. A student opens EventWallah.
2. The student searches by institution, event, category, city, or state.
3. The student opens an institution page and sees its published events.
4. The student opens an event page and sees dates, venue, organizer, description, ticket types, prices, and remaining availability.
5. The student chooses one event-specific ticket.
6. The student enters attendee and college information and optionally applies a valid coupon.
7. For a free ticket, the order is confirmed immediately.
8. For a paid ticket, the order remains pending until a payment provider confirms payment through a signed server-to-server webhook.
9. A confirmed order creates a unique, unguessable QR pass.
10. The student opens the pass from the success page, account, email, or message.
11. At the venue, the QR is scanned and accepted only once.

## 7. Core organizer journey

1. An authorized organizer signs in through the separate admin URL.
2. The organizer works inside an organization-scoped ERP workspace.
3. The team creates an event and assigns its institution, schedule, venue, capacity, organizer, and publication state.
4. The ticketing team creates separate ticket types with their own price, inventory, order limits, and sales window.
5. The team creates event-specific coupons with controlled validity and usage limits.
6. The sponsorship team records brands, opportunities, contracted values, next actions, and deliverables.
7. The finance team records expenses and reviews collected and outstanding money.
8. During the event, check-in operators scan and validate passes.
9. Managers review attendance, sales, sponsor fulfilment, finances, and audit history.

## 8. Business model direction

The immediate product supports free registration while the commercial infrastructure is prepared for paid tickets. Potential long-term revenue streams include:

- A service or convenience fee on paid ticket orders
- Organizer subscriptions for advanced ERP features
- Premium event promotion and featured discovery
- Sponsorship marketplace or facilitation fees
- Enterprise plans for universities and event agencies
- Communication, analytics, and verification add-ons

The exact fee model is not final. It must be decided before paid production launch and reflected transparently in checkout, invoices, refunds, and organizer settlements.

## 9. Functional scope

### Public marketplace

- Search and filter Indian colleges and universities
- Search and browse published events
- Institution profiles with event listings
- Event pages with schedule, venue, organizer, ticket inventory, and pricing
- Mobile-first ticket selection and checkout
- Coupon application
- QR pass and current pass status
- Clear empty, loading, closed, sold-out, and error states

### Event operations

- Draft, published, cancelled, and completed events
- Independent ticket types per event
- Ticket price, capacity, sold count, order limits, and sales window
- Free and paid order states
- Registration and attendee records
- Duplicate-registration prevention
- One-time QR check-in
- Attendee lists and event-level operational reporting

### Sponsorship CRM

- Reusable sponsor directory and contacts
- Event-linked sponsorship opportunities
- Pipeline stages from prospect to completion or loss
- Contracted, cash, in-kind, received, and outstanding value
- Deal owner, notes, next action, and follow-up date
- Deliverables with owners, deadlines, status, and evidence
- Sponsorship packages and inventory — schema exists; management UI remains to be expanded

### Finance

- Ticket gross value, discounts, confirmed collections, and payment state
- Sponsorship contracted, received, and outstanding amounts
- Event or organization-level expenses
- Tax amounts and expense approval/payment states
- Net financial position
- Future settlement, refund, invoice, and reconciliation workflows

### Governance and security

- Separate, non-public admin entry point
- Password-protected sessions
- Organization membership and role-based permissions
- Tenant-isolated commercial data
- Audit trail for sensitive operational changes
- Secure random pass and session tokens
- Server-generated QR images
- Request size restrictions and structured API errors

## 10. Organization roles

The current data model supports:

- Owner: complete organization access
- Event manager: event setup and operations
- Ticketing manager: ticket inventory, orders, and coupons
- Sponsorship manager: sponsors, deals, and deliverables
- Finance manager: financial reporting and expenses
- Check-in operator: venue pass validation
- Viewer: read-only access where permitted

Future UI work should hide inaccessible navigation and actions based on the current user's role. Backend authorization remains the final security boundary.

## 11. Current technical architecture

EventWallah is a monorepo:

- Web: Next.js 16, React 19, TypeScript, and Tailwind CSS
- API: Go standard-library HTTP service
- Database: SQLite with WAL mode and foreign keys enabled
- Authentication: opaque admin session tokens stored as hashes
- QR generation: generated by the Go API
- Public web: repository root under `src/`
- Backend: `apps/api/`

Important source locations:

- `src/app/` — public and admin routes
- `src/components/product/` — event discovery, registration, and pass interfaces
- `src/components/admin/` — ERP workspaces
- `src/lib/api.ts` — shared frontend API client and types
- `apps/api/internal/httpapi/` — HTTP routes and business handlers
- `apps/api/internal/store/schema.sql` — SQLite data model
- `apps/api/internal/store/store.go` — database setup and local seed data
- `apps/api/internal/httpapi/server_test.go` — integration tests

## 12. What is implemented now

### Public experience

- College and university discovery
- Institution pages and published event listings
- Event discovery and detail pages
- Event-specific ticket display and availability
- Ticket selection and free checkout
- Optional coupon input
- Unique QR pass generation and pass page
- 2026 event content and current design system

### Admin ERP

- Separate `/admin/login` entry point with no public admin promotion
- Corporate ERP shell and command centre
- Event creation, editing, attendee lists, and dashboard
- Ticketing control room with ticket inventory, orders, and coupons
- Sponsorship CRM with brand directory, deal pipeline, and deliverables
- Finance workspace with income, expense, and net-position reporting
- QR check-in terminal
- Audit trail workspace

### Backend and data

- Colleges, events, registrations, passes, admins, and sessions
- Organizations, members, roles, and organization-event ownership
- Ticket types, coupons, orders, and order items
- Sponsors, packages, deals, and deliverables
- Expenses and audit logs
- Organization-scoped commercial queries
- Role checks for sensitive mutations
- SQLite-safe handling for its single application connection
- Seed data and institution CSV importer
- Integration tests covering the main free-ticket and commercial ERP flows

## 13. Known boundaries — not yet production-complete

These items are deliberately not considered finished:

- Paid gateway: paid orders can exist in a pending state, but checkout is disabled until a provider is chosen and signed webhook verification is implemented.
- Student accounts: passes currently work without a complete attendee account and login system.
- Notifications: transactional email, SMS, and WhatsApp delivery are not connected.
- Refunds and settlements: refund approval, gateway refunds, organizer payouts, invoices, and reconciliation are not implemented.
- Institution completeness: production requires a reviewed AISHE/UGC-derived national dataset and an ongoing verification process.
- Organizer onboarding: invitations, password setup, recovery, organization switching, and role-management screens need completion.
- Platform super-admin: organization approval, moderation, risk review, and platform-wide reporting require a separate internal console.
- Analytics: conversion funnels, traffic attribution, cohort reporting, ticket scans over time, and downloadable reports remain future work.
- Sponsor packages: database support exists, but complete package CRUD, availability, proposals, contracts, and invoicing need expansion.
- Production infrastructure: managed secrets, observability, rate limiting, monitored backups, deployment automation, and disaster recovery must be configured.
- Legal readiness: privacy consent, ticket terms, refund policy, tax treatment, invoicing, and data-retention rules require business and legal approval.

## 14. Recommended delivery roadmap

### Phase 1 — trustworthy free-event platform

- Import and verify the institution directory
- Complete organizer onboarding and team-role management
- Add transactional email for registration and pass delivery
- Improve attendee search, export, cancellation, and resend-pass tools
- Add platform moderation and institution verification
- Harden security, backups, logs, rate limiting, and deployment

### Phase 2 — paid ticketing

- Select the Indian payment provider and define platform fees
- Implement server-created payment orders
- Verify signed payment webhooks
- Confirm tickets only after successful webhook processing
- Add payment retries, expiry, idempotency, refunds, invoices, and reconciliation
- Add organizer settlements and payout reporting

### Phase 3 — complete event ERP

- Organizer invitations, multiple organizations, and granular permission UI
- Sponsor package builder, proposal generation, contracts, invoices, and evidence approval
- Budgets, vendors, purchase approvals, and finance exports
- Attendee segments, scheduled communication, and campaign analytics
- Event dashboards and post-event performance reports

### Phase 4 — national marketplace and scale

- Student accounts, saved colleges, followed categories, and event recommendations
- Verified organizer badges and trust signals
- Featured listings and sponsorship marketplace
- Mobile applications if web usage justifies them
- Move from SQLite to managed PostgreSQL when write volume, operational scale, or deployment topology requires it

## 15. Non-negotiable business rules

- Admin functionality must not be advertised in the public navigation.
- Every commercial record must be scoped to an organization and, where appropriate, an event.
- Every ticket type has independent price and inventory.
- Inventory must never become negative or exceed capacity.
- A paid order must never generate a valid pass before verified payment confirmation.
- Browser redirects are not proof of payment; only a verified provider webhook can confirm payment.
- Coupons must respect event scope, validity, minimum order, usage limits, and maximum discount.
- A pass token must be random, private, and accepted for check-in only once.
- Cancelled or refunded tickets must not allow entry.
- Financial history and audit records should be preserved rather than silently overwritten.
- Authorization must be enforced by the API, even when the UI hides an action.
- Public content must use clear human writing and avoid generic AI-style marketing language.
- Dates displayed to users must include the correct year and use Indian locale conventions.

## 16. Quality standards for future development

Before considering a feature complete:

- Define its data ownership and state transitions.
- Validate input at the API boundary.
- Enforce authorization and organization scope in the backend.
- Handle empty, loading, error, unavailable, and success states in the UI.
- Protect money and inventory changes with transactions and idempotency where necessary.
- Add integration tests for the successful path and important failures.
- Run Go tests, ESLint, TypeScript checking, and the Next.js production build.
- Review desktop and mobile screens in a browser.
- Update this document when the product scope or a major decision changes.

Standard validation commands:

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run test:api
```

## 17. Decisions required from the founder

These decisions should not be guessed during implementation:

- Which payment provider should be used?
- What convenience fee or commission will EventWallah charge?
- Who is the merchant of record: EventWallah or each organizer?
- What are the cancellation and refund rules?
- How will institutions and organizers be verified?
- Can student organizers publish directly, or must a college authority approve them?
- Which communication channels are required first: email, SMS, or WhatsApp?
- What information may be shared with sponsors and organizers?
- What legal entity, GST, invoicing, and payout model will operate the platform?
- Which reports and controls are required for the first real pilot event?

## 18. Definition of the first successful launch

The first real pilot is successful when:

- A verified organizer can create and publish an event without developer support.
- The organizer can configure multiple independent ticket types.
- Students can discover the event and complete registration on mobile.
- Every confirmed attendee receives a usable QR pass.
- Venue staff can scan passes quickly and cannot reuse one pass.
- The organizer can see accurate registrations, inventory, and attendance.
- Sponsor commitments and expenses can be recorded and reviewed.
- The system is backed up, monitored, rate-limited, and recoverable.
- No organization can access another organization's operational data.

## 19. Context for any future AI or developer

When resuming work, begin by reading this document, `README.md`, and the current code. Do not redesign the product around the old marketing-site concept. The current product is an India-wide college-event marketplace plus a multi-organization event ERP.

Preserve the existing professional public design and corporate admin design unless a change is explicitly requested. Prefer completing real workflows over adding decorative dashboard cards. Never claim a payment, message, refund, settlement, or verification integration is complete unless it has been implemented and tested end to end.

After completing meaningful product work, update the "What is implemented now," "Known boundaries," roadmap, and decision sections so this file remains accurate.
