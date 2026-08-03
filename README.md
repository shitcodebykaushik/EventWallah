# EventWallah

EventWallah is a multi-organization college-event discovery and operations platform for India, operated by The Event Wallah. Its top-priority flagship programme is **Launch Bharat**, a national student-startup pathway for college cohorts, problem statements, founder teams, evaluated pitch stages and incubation follow-through. Regular college events continue to use EventWallah for discovery, registration, QR passes and ERP operations.

The complete product goal, business rules, current scope, and delivery roadmap are maintained in [`docs/PROJECT_VISION.md`](docs/PROJECT_VISION.md). Read that document before beginning substantial product work.

## Monorepo layout

```text
.
├── src/                       Next.js 16 web application
│   ├── app/                   Public and admin routes
│   ├── components/product/    Discovery, registration and pass UI
│   └── components/admin/      Admin operations UI
├── apps/api/                  Go API service
│   ├── cmd/server/            API entry point
│   ├── cmd/import-colleges/   Bulk institution CSV importer
│   └── internal/              HTTP handlers, SQLite schema and store
└── go.work                    Go workspace
```

The Next.js application remains at the repository root to preserve the existing design system and history. The Go service is isolated under `apps/api`; both applications are versioned and operated together.

## Included workflows

- Search and filter colleges and universities
- Public Launch Bharat flagship experience, versioned consent and secure student team applications
- Applicant portal with protected documents, status, pitch schedule, referrals and milestones
- Launch Bharat college lifecycle, eligibility review, expert roster, live programme operations and outcome reporting
- Organization access controls, platform tenancy controls and authenticator-based administrator MFA
- Institution pages with published event listings
- Event discovery and detail pages
- Event-specific ticket types with independent prices, inventory and sales windows
- Free checkout with capacity, deadline, coupon and duplicate checks
- Random, unguessable pass tokens and server-generated QR images
- Public pass page with current check-in status
- Password-protected, HttpOnly-cookie admin sessions with origin enforcement and rate limiting
- Admin dashboard, event creation/editing, and attendee lists
- Organization tenancy and role-based controls for event, ticketing, sponsorship, finance and check-in teams
- Ticket inventory, order ledger and event-scoped coupon management
- Sponsor directory, sponsorship pipeline and deliverable tracking
- Expense ledger, commercial finance summary and organization audit trail
- One-time QR/pass check-in with duplicate-scan protection
- CSV bulk import for the nationwide institution directory
- Seed institutions and 2026 events for local development

## Run locally

Requirements: Node.js 20+, npm, and Go 1.26+.

1. Copy the example configuration:

   ```bash
   cp .env.example .env.local
   cp apps/api/.env.example apps/api/.env
   ```

2. Start both the Go API and Next.js website with one command:

   ```bash
   npm run dev
   ```

   The API has safe local defaults. Environment variables from `apps/api/.env.example`
   can be exported when different values are needed.

3. To run the services separately instead, use two terminals:

   ```bash
   npm run dev:api
   npm run dev:web
   ```

4. Open `http://localhost:3000`. The API listens on `http://localhost:8080`.

   Browser API requests use the website's same-origin `/api/v1/*` path and are
   forwarded to the Go service by Next.js. Set the server-side
   `EVENTWALLAH_API_URL` only when the API is not available at
   `http://localhost:8080`; do not expose the local API address to browser code.

The development admin account is `admin@eventwallah.local`. Its password is the value of `EVENTWALLAH_ADMIN_PASSWORD`; when the variable is absent, the local-only default is `change-me-now`. Set `EVENTWALLAH_SECURITY_KEY` to a long random secret to encrypt MFA seeds. HTTPS deployments refuse to start with either development default.

## Institution import

EventWallah does not claim a static seed list is the complete national directory. Import a reviewed AISHE/UGC-derived CSV into SQLite before production launch:

```bash
npm run import:colleges -- -file data/india-institutions.csv
```

Required columns are `name`, `institution_type`, `ownership`, `city`, and `state`. Optional columns are `slug`, `short_name`, `website`, and `logo_url`. Valid types are `college` or `university`; valid ownership values are `government`, `private`, or `deemed`. See `apps/api/data/colleges.sample.csv`.

## Validation

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run test:api
```

The API test suite covers Launch Bharat programme discovery, team applications, duplicate prevention, founder-stage changes and scored evaluations alongside regular-event ticket checkout, pass retrieval, QR generation, authentication, one-time check-in, coupons, sponsorship, finance, audit records, and protected admin routes.

## Production notes

- Serve the API and web app over HTTPS.
- Replace the development admin password before first startup.
- Back up the SQLite database and WAL files together using a SQLite-aware backup procedure.
- Keep the API behind a reverse proxy with request throttling and access logs.
- Use a verified AISHE/UGC data export for the national institution import.
- Paid checkout fails closed and does not create an order until a verified payment provider is connected. Use signed webhook verification and never confirm a paid order from a browser redirect alone.
- SQLite is appropriate for the current single-service deployment. Keep one application writer, monitor lock contention, and plan a managed PostgreSQL migration before high-volume multi-region operation.
- Put secrets in a managed secret store, apply rate limiting at the edge, and ship structured logs and database backups to monitored infrastructure.
