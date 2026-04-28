# Payr — Accounts Payable MVP

## What it does

Payr is an internal tool for finance teams to manage vendor invoices end-to-end:
receive a bill, get it approved, mark it paid, and keep a clean audit trail.
It replaces the typical spreadsheet workflow with a structured, auditable process.

## Workflows I prioritized

**Bill lifecycle** — The core loop: Draft → Approval → Payment → History.
A bill can't skip steps; the state machine enforces valid transitions server-side.

**AP Aging dashboard** — The first thing a finance manager checks.
Shows outstanding liabilities bucketed by how overdue they are, grouped by vendor.

**Vendor management** — Bills need vendors. Keeping vendor data clean
enables filtering, reporting, and future payment routing.

**Multi-company workspaces** — Users can create multiple companies and switch
between them from the sidebar. Every API request scopes data to the active
entity via the `X-Entity-Id` header, so bills and vendors are fully isolated
between companies.

**AI invoice extraction** — Upload a PDF or image and GPT-4o-mini pre-fills
the bill form. Falls back to manual entry if no API key is configured.

**QuickBooks sync simulation** — Bills auto-sync on approval. Includes sync
status badges (synced / failed / pending) and manual retry from bill detail.
Toggle the integration on/off from Settings → Integrations.

## What I left out and why

| Feature                            | Reason                                                                |
| ---------------------------------- | --------------------------------------------------------------------- |
| Real payment processing (ACH/wire) | Requires banking integrations and compliance — v2                     |
| Real QuickBooks OAuth              | Simulated sync covers the UX; real integration needs OAuth + webhooks |
| Role-based permissions             | Single Admin user assumed; RBAC is a straightforward next layer       |
| Recurring bills                    | Natural extension of the bill model, not core to the loop             |

## Setup

Requires Docker + Docker Compose.

```bash
git clone <repo>
cd payr
docker compose up
```

Open http://localhost:3000

**Demo credentials**

- Email: `admin@payr.co`
- Password: `admin123`

## Environment variables

**Backend** (`backend/.env`)

```env
JWT_SECRET=your-secret
OPENAI_API_KEY=sk-...        # optional — falls back to simulation mode
```

**Frontend** (`frontend/.env`)

```env
VITE_API_URL=http://localhost:3001
VITE_POSTHOG_KEY=phc_...     # optional — analytics disabled if not set
```

> Never commit real keys. If a key was accidentally exposed, rotate it immediately.

## How to test the main flow

1. **Dashboard** — check KPIs and AP Aging table (pre-loaded with seed data)
2. **Bills → New Bill** — create a bill manually or upload a PDF/image invoice
3. **Drafts tab** — click "Submit for Approval"
4. **For Approval tab** — click "Approve" (or "Reject" with a comment)
5. **For Payment tab** — click "Mark as Paid"
6. **Payments page** — confirm the payment record was created
7. **Dashboard** — KPIs and AP Aging update to reflect the new state

**Reset demo data**

```bash
docker compose exec backend npx prisma db push --force-reset
docker compose exec backend npx prisma db seed
```

## API surface

| Module    | Endpoints                                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------------------------ |
| Auth      | `POST /auth/register` `POST /auth/login` `GET /auth/me`                                                            |
| Bills     | `GET /bills` `POST /bills` `GET /bills/:id` `PATCH /bills/:id/status` `POST /bills/:id/sync` `POST /bills/extract` |
| Vendors   | `GET /vendors` `POST /vendors` `PATCH /vendors/:id` `DELETE /vendors/:id`                                          |
| Payments  | `GET /payments`                                                                                                    |
| Dashboard | `GET /dashboard/summary` `GET /dashboard/ap-aging`                                                                 |

All business endpoints require `Authorization: Bearer <token>` and `X-Entity-Id: <companyId>`.

## Analytics

PostHog is integrated in the frontend. The following events are tracked:

| Event            | Trigger               |
| ---------------- | --------------------- |
| `bill_created`   | New bill saved        |
| `bill_submitted` | Sent for approval     |
| `bill_approved`  | Approved by admin     |
| `bill_rejected`  | Rejected with comment |
| `bill_paid`      | Marked as paid        |

Set `VITE_POSTHOG_KEY` to enable. If not set, events are silently skipped.

## Architecture decisions

**Server-side state machine:** Bill status only changes through the API.
The backend validates every action against a `transitionMap` and returns 400
on invalid transitions. The frontend mirrors the map to show the right buttons,
but the server is always the source of truth.

**Bills and Payments as separate tables:** A Bill is an obligation (we owe money).
A Payment is a transaction (we sent money). Keeping them separate makes it easier
to model failed payments, retries, and partial records cleanly.

**Multi-tenant via header:** The active company is sent as `X-Entity-Id` on
every request. This keeps the auth token user-scoped while allowing workspace
switching without re-login.

**Prisma + PostgreSQL:** A real relational engine for local dev and production-like
behavior. `docker compose up` starts the API and database together.

**JWT auth:** Stateless, single Admin user for the MVP.

**AI fallback:** If `OPENAI_API_KEY` is not set, the extraction endpoint
returns a simulated payload so the upload flow can be evaluated without
external dependencies. Backend supports both PDF (text extraction via
pdf-parse) and images (multimodal prompt).

## Troubleshooting

**Port already in use:** `docker compose down` then `docker compose up` again.
Or change ports in `docker-compose.yml`.

**401 Unauthorized:** Token may have expired. Log out and log in again.

**OCR returns empty fields:** The uploaded PDF may be image-based with no
embedded text. The backend will attempt the multimodal image path as fallback.
If `OPENAI_API_KEY` is not set, simulation mode returns mock data regardless.

**Seed data not loading:** Run the reset commands above.

## Current limitations

- Single admin user — no multi-user or approval delegation
- No real payments — "Mark as Paid" records the intent, no funds move
- No RBAC — all authenticated users have full access
- QuickBooks sync is simulated — no real OAuth connection

## What I'd build next

- Real payment rails (Stripe Connect or similar)
- Granular roles: Submitter, Approver, Payer
- Audit log: who approved what and when
- PostgreSQL for production readiness
- Real QuickBooks OAuth integration
