# Payr — Accounts Payable MVP

## What the product does

Payr is an internal finance tool for managing accounts payable workflows.
It enables finance teams to receive vendor invoices, route them through an
approval process, and track payments — replacing spreadsheet-based AP management
with a structured, auditable workflow.

## Workflows prioritized

1. **Bill lifecycle** (Draft → Approval → Payment → History): The core AP loop.
   Without this, nothing else matters.
2. **Vendor management**: Bills need vendors. Keeping vendor data clean enables
   filtering, reporting, and future payment routing.
3. **AP Aging dashboard**: The primary artifact a CFO looks at. Shows outstanding
   liabilities grouped by how overdue they are.
4. **Payment tracking**: Separating Payment objects from Bills reflects real AP
   architecture — the obligation (bill) and the transaction (payment) are distinct.

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

**State machine for bill status**: Transitions are validated server-side via a
`transitionMap` object. Invalid transitions return 400. This prevents the frontend
from corrupting bill state and makes the workflow explicit and auditable.

**Bills vs Payments as separate tables**: A Bill represents the obligation
(we owe vendor X money). A Payment represents the transaction (we sent money on date Y).
Separating them allows partial payment history, failed payment retries, and clean
accounting records.

**Prisma + SQLite for MVP**: Removes the need for a separate DB container,
making `docker compose up` simpler. Schema is portable to PostgreSQL with one
config change.

**JWT authentication**: Stateless auth with a single Admin user.
Role-based access control is the natural next layer.

**AI invoice extraction**: Uses OpenAI Vision API to parse PDF invoices and
pre-fill bill fields. Falls back to manual entry if no API key is configured.

**Multi-company workspaces**: Users can create multiple companies and switch between them via the sidebar selector. Designed for finance teams managing more than one legal entity.
