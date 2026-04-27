# Payr — Accounts Payable MVP

## The Problem & Solution

Managing vendor invoices via spreadsheets is error prone and lacks auditability. Payr solves this by providing a structured workflow from invoice ingestion to payment confirmation, giving finance teams a single source of truth for their liabilities.

## Product Focus

For this MVP, I prioritized the "Golden Path" of accounts payable:

- **Dynamic Bill Lifecycle:** A strict state machine (Draft → Approval → Payment) to ensure data integrity.
- **CFO-Ready Reporting:** A real-time AP Aging Report and Cash Out trends for immediate financial visibility.
- **Entity Scalability:** Built-in support for multi-company workspaces, recognizing that modern finance teams often manage multiple legal entities.

## What was left out and why

| Feature                            | Reason                                                      |
| ---------------------------------- | ----------------------------------------------------------- |
| Real payment processing (ACH/wire) | Requires banking integrations and compliance — v2           |
| ERP sync (QuickBooks/NetSuite)     | Integration complexity out of scope                         |
| Bulk actions                       | Core single-bill flow validated first                       |
| Role-based permissions             | Assumed Admin user; role model is straightforward extension |
| Recurring bills                    | Natural extension of bill model, not core to MVP            |

## Setup

Requirements: Docker + Docker Compose

```bash
git clone <repo>
cd payr
docker compose up
```

Open http://localhost:3000

Demo credentials:

- Email: admin@payr.co
- Password: admin123

## Demo walkthrough

1. Go to **Bills → Drafts** and click "New Bill" to create an invoice
2. Click "Submit for Approval" — bill moves to For Approval tab
3. Click "Approve" — bill moves to For Payment tab
4. Click "Mark as Paid" — bill moves to History, payment record created
5. Check **Payments** page to see the payment record
6. Check **Dashboard** for updated KPIs and AP Aging table

## Architecture decisions

**AI-assisted ingestion:** Integrated OpenAI's `gpt-4o-mini` to automate data entry. I implemented a graceful fallback: if no API key is provided, the system enters a "Simulation Mode" so the UI/UX flow can still be evaluated without external dependencies.

**Server-side state machine:** Persisted bill status is updated only through the NestJS API, which validates every action against a central `transitionMap` (same rules as in `bills.service.ts`). Invalid transitions return `400` and never reach the database. The SPA mirrors that map for which buttons to show and for unauthenticated local demo data only; once authenticated, a failed PATCH is not applied locally, so the server stays the source of truth.

**Bills vs Payments as separate tables:** A Bill represents the obligation (we owe vendor X money). A Payment represents the transaction (we sent money on date Y). Separating them allows partial payment history, failed payment retries, and clean accounting records.

**Prisma + SQLite for MVP:** Removes the need for a separate DB container, making `docker compose up` simpler. Schema is portable to PostgreSQL with one config change.

**JWT authentication:** Stateless auth with a single Admin user. Role-based access control is the natural next layer.

**Multi-company workspaces:** Users can create multiple companies and switch between them via the sidebar selector — aligned with the entity-scalability goal above.

## Future Roadmap

- **Real payment rails:** Integration with Stripe Connect or Finix for actual fund movement.
- **Audit log:** A detailed history of who approved what and when for compliance.
- **Advanced permissions:** Granular roles (Approver, Payer, Submitter).
