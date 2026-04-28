import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { BillStatus, PrismaClient, SyncStatus } from '@prisma/client';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function calendarToday() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

/** Payment date in the month that is `monthsBefore` months before `anchor`'s month. */
function payInMonth(anchor: Date, monthsBefore: number, day: number) {
  return new Date(anchor.getFullYear(), anchor.getMonth() - monthsBefore, day);
}

/** Default workspace (matches UI “Company X”, US / 12-3456789 / USD). */
const COMPANY_X = 'company-x';

type SeedBillDef = {
  invoiceNumber: string;
  vendorIdx: number;
  status: BillStatus;
  invoiceDate: Date;
  dueDate: Date;
  totalAmount: number;
  notes: string;
  rejectionComment?: string;
  withPayment?: boolean;
  paymentMethod?: 'ach' | 'wire' | 'check';
  paymentDate?: Date;
  /** Simulated ERP issues (red cloud in UI). */
  missingInfo?: boolean;
  /** Override default sync for demo. */
  syncStatus?: SyncStatus;
  erpSyncRef?: string | null;
};

type VendorSeed = { name: string; email: string; paymentTerms: number };

async function addHistory(
  billId: string,
  chain: BillStatus[],
  options?: { rejectionComment?: string },
) {
  for (const status of chain) {
    const comment =
      status === 'rejected' && options?.rejectionComment
        ? options.rejectionComment
        : `Status: ${status}`;
    await prisma.billStatusHistory.create({
      data: { billId, status, comment },
    });
  }
}

function defaultErpForStatus(def: SeedBillDef): { syncStatus: SyncStatus; erpSyncRef: string | null } {
  if (def.syncStatus !== undefined) {
    return { syncStatus: def.syncStatus, erpSyncRef: def.erpSyncRef ?? null };
  }
  const refFromInv = String(
    1_000 +
      (def.invoiceNumber
        .split('')
        .reduce((acc, ch) => acc + ch.charCodeAt(0), 0) %
        9_000),
  );
  switch (def.status) {
    case 'approved':
    case 'scheduled':
    case 'paid':
      return { syncStatus: 'SUCCESS', erpSyncRef: refFromInv };
    case 'rejected':
      return { syncStatus: 'FAILED', erpSyncRef: null };
    default:
      return { syncStatus: 'PENDING', erpSyncRef: null };
  }
}

function historyChainFor(status: BillStatus): BillStatus[] {
  switch (status) {
    case 'draft':
      return ['draft'];
    case 'pending_approval':
      return ['draft', 'pending_approval'];
    case 'approved':
      return ['draft', 'pending_approval', 'approved'];
    case 'scheduled':
      return ['draft', 'pending_approval', 'approved', 'scheduled'];
    case 'paid':
      return ['draft', 'pending_approval', 'approved', 'paid'];
    case 'rejected':
      return ['draft', 'pending_approval', 'rejected'];
    case 'archived':
      return ['draft', 'archived'];
    default:
      return ['draft'];
  }
}

async function seedEntity(entityId: string, vendorSeeds: VendorSeed[], defs: SeedBillDef[]) {
  const vendors = await Promise.all(
    vendorSeeds.map((v) => prisma.vendor.create({ data: { ...v, entityId } })),
  );

  for (const def of defs) {
    const vendor = vendors[def.vendorIdx];
    const amount = def.totalAmount;

    const erp = defaultErpForStatus(def);
    const bill = await prisma.bill.create({
      data: {
        entityId,
        vendorId: vendor.id,
        invoiceNumber: def.invoiceNumber,
        status: def.status,
        invoiceDate: def.invoiceDate,
        dueDate: def.dueDate,
        totalAmount: amount,
        currency: 'USD',
        notes: def.notes,
        missingInfo: def.missingInfo ?? false,
        syncStatus: erp.syncStatus,
        erpSyncRef: erp.erpSyncRef,
      },
    });

    await prisma.billLineItem.createMany({
      data: [
        {
          billId: bill.id,
          description: 'Primary line — service charges',
          quantity: 1,
          unitPrice: amount * 0.65,
          amount: amount * 0.65,
          category: 'Services',
        },
        {
          billId: bill.id,
          description: 'Secondary line — usage / add-ons',
          quantity: 1,
          unitPrice: amount * 0.35,
          amount: amount * 0.35,
          category: 'Usage',
        },
      ],
    });

    await addHistory(bill.id, historyChainFor(def.status), {
      rejectionComment: def.rejectionComment,
    });

    if (def.withPayment) {
      await prisma.payment.create({
        data: {
          billId: bill.id,
          amount,
          paymentDate: def.paymentDate ?? calendarToday(),
          method: def.paymentMethod ?? 'ach',
          reference: def.invoiceNumber,
        },
      });
    }
  }
}

async function main() {
  await prisma.user.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.billLineItem.deleteMany();
  await prisma.billStatusHistory.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.vendor.deleteMany();

  await prisma.user.create({
    data: {
      email: 'admin@payr.co',
      password: 'admin123',
      name: 'Admin User',
      role: 'admin',
    },
  });

  const TODAY = calendarToday();
  const NOTION_INV = new Date(TODAY);
  NOTION_INV.setDate(NOTION_INV.getDate() - 35);
  const FIGMA_DUE = new Date(TODAY);
  FIGMA_DUE.setDate(FIGMA_DUE.getDate() + 18);
  const FIGMA_INV = new Date(FIGMA_DUE);
  FIGMA_INV.setDate(FIGMA_INV.getDate() - 40);

  const arVendors: VendorSeed[] = [
    { name: 'Amazon Web Services', email: 'billing@aws.com', paymentTerms: 15 },
    { name: 'Google Cloud', email: 'invoices@google.com', paymentTerms: 30 },
    { name: 'Stripe', email: 'billing@stripe.com', paymentTerms: 30 },
    { name: 'Notion', email: 'finance@notion.so', paymentTerms: 30 },
    { name: 'Figma', email: 'billing@figma.com', paymentTerms: 45 },
  ];

  const arDefs: SeedBillDef[] = [
    {
      invoiceNumber: 'INV-2026-001',
      vendorIdx: 0,
      status: 'draft',
      invoiceDate: new Date('2026-04-01'),
      dueDate: new Date('2026-05-15'),
      totalAmount: 12500,
      notes: 'Cloud infrastructure services — Q1 2026 capacity and support (AWS).',
    },
    {
      invoiceNumber: 'INV-2026-002',
      vendorIdx: 1,
      status: 'draft',
      invoiceDate: new Date('2026-04-02'),
      dueDate: new Date('2026-05-20'),
      totalAmount: 3400,
      notes: 'API usage charges — April 2026 (Google Cloud).',
      missingInfo: true,
    },
    {
      invoiceNumber: 'INV-2026-003',
      vendorIdx: 2,
      status: 'draft',
      invoiceDate: new Date('2026-04-05'),
      dueDate: new Date('2026-06-01'),
      totalAmount: 2100,
      notes: 'Payment processing fees — March 2026 (Stripe).',
    },
    {
      invoiceNumber: 'INV-2026-004',
      vendorIdx: 0,
      status: 'pending_approval',
      invoiceDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-15'),
      totalAmount: 45000,
      notes: 'Enterprise cloud infrastructure — January–February 2026 (AWS).',
    },
    {
      invoiceNumber: 'INV-2026-005',
      vendorIdx: 1,
      status: 'pending_approval',
      invoiceDate: new Date('2026-02-10'),
      dueDate: new Date('2026-03-01'),
      totalAmount: 8750,
      notes: 'Compute and networking — February billing cycle (Google Cloud).',
    },
    {
      invoiceNumber: 'INV-2026-006',
      vendorIdx: 2,
      status: 'pending_approval',
      invoiceDate: new Date('2026-04-01'),
      dueDate: new Date('2026-05-25'),
      totalAmount: 5200,
      notes: 'Transaction and payout fees — April 2026 (Stripe).',
    },
    {
      invoiceNumber: 'INV-2026-007',
      vendorIdx: 3,
      status: 'approved',
      invoiceDate: NOTION_INV,
      dueDate: TODAY,
      totalAmount: 28000,
      notes: 'SaaS platform license renewal — team plan (Notion).',
    },
    {
      invoiceNumber: 'INV-2026-008',
      vendorIdx: 4,
      status: 'approved',
      invoiceDate: FIGMA_INV,
      dueDate: FIGMA_DUE,
      totalAmount: 12500,
      notes: 'Design tool annual subscription — org seats (Figma).',
    },
    {
      invoiceNumber: 'INV-2026-009',
      vendorIdx: 0,
      status: 'paid',
      invoiceDate: new Date('2026-03-01'),
      dueDate: new Date('2026-03-28'),
      totalAmount: 11800,
      notes: 'Reserved instances and support — March 2026 (AWS).',
      withPayment: true,
      paymentMethod: 'ach',
      paymentDate: payInMonth(TODAY, 4, 10),
    },
    {
      invoiceNumber: 'INV-2026-010',
      vendorIdx: 1,
      status: 'paid',
      invoiceDate: new Date('2026-03-10'),
      dueDate: new Date('2026-04-05'),
      totalAmount: 9200,
      notes: 'Data analytics and storage — March 2026 (Google Cloud).',
      withPayment: true,
      paymentMethod: 'wire',
      paymentDate: payInMonth(TODAY, 3, 12),
    },
    {
      invoiceNumber: 'INV-2026-011',
      vendorIdx: 2,
      status: 'paid',
      invoiceDate: new Date('2026-03-15'),
      dueDate: new Date('2026-04-12'),
      totalAmount: 15600,
      notes: 'Platform fees and Radar — Q1 2026 (Stripe).',
      withPayment: true,
      paymentMethod: 'ach',
      paymentDate: payInMonth(TODAY, 2, 8),
    },
    {
      invoiceNumber: 'INV-2026-015',
      vendorIdx: 1,
      status: 'paid',
      invoiceDate: new Date(TODAY.getFullYear(), TODAY.getMonth() - 2, 1),
      dueDate: new Date(TODAY.getFullYear(), TODAY.getMonth() - 1, 15),
      totalAmount: 2800,
      notes: 'API and network egress — supplemental close (Google Cloud).',
      withPayment: true,
      paymentMethod: 'ach',
      paymentDate: payInMonth(TODAY, 1, 7),
    },
    {
      invoiceNumber: 'INV-2026-016',
      vendorIdx: 0,
      status: 'paid',
      invoiceDate: new Date(TODAY.getFullYear(), TODAY.getMonth() - 1, 5),
      dueDate: new Date(TODAY.getFullYear(), TODAY.getMonth(), 8),
      totalAmount: 3400,
      notes: 'Support and snapshots — early month run (AWS).',
      withPayment: true,
      paymentMethod: 'wire',
      paymentDate: payInMonth(TODAY, 0, 6),
    },
    {
      invoiceNumber: 'INV-2026-012',
      vendorIdx: 3,
      status: 'rejected',
      invoiceDate: new Date('2026-03-01'),
      dueDate: new Date('2026-04-01'),
      totalAmount: 3200,
      notes: 'Workspace add-on invoice for monthly team usage (Notion).',
      rejectionComment: 'Missing PO (Notion).',
    },
    {
      invoiceNumber: 'INV-2026-013',
      vendorIdx: 4,
      status: 'rejected',
      invoiceDate: new Date('2026-03-18'),
      dueDate: new Date('2026-04-18'),
      totalAmount: 4100,
      notes: 'Plugin marketplace charges for design tools (Figma).',
      rejectionComment: 'Wrong cost center (Figma).',
    },
    {
      invoiceNumber: 'INV-2026-014',
      vendorIdx: 0,
      status: 'archived',
      invoiceDate: new Date('2025-11-01'),
      dueDate: new Date('2025-12-01'),
      totalAmount: 6700,
      notes: 'Legacy project close-out — archived for audit trail (AWS).',
    },
  ];

  await seedEntity(COMPANY_X, arVendors, arDefs);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
