import 'dotenv/config';
import { BillStatus, PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? 'file:./dev.db',
});
const prisma = new PrismaClient({ adapter });

type SeedBillDef = {
  invoiceNumber: string;
  vendorIdx: number;
  status: BillStatus;
  invoiceDate: Date;
  dueDate: Date;
  totalAmount: number;
  notes: string;
  withPayment?: boolean;
  paymentMethod?: 'ach' | 'wire' | 'check';
};

async function addHistory(billId: string, chain: BillStatus[]) {
  for (const status of chain) {
    await prisma.billStatusHistory.create({
      data: { billId, status, comment: `Status: ${status}` },
    });
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

async function main() {
  await prisma.user.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.billLineItem.deleteMany();
  await prisma.billStatusHistory.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.vendor.deleteMany();

  const vendors = await Promise.all([
    prisma.vendor.create({ data: { name: 'Amazon Web Services', email: 'billing@aws.com', paymentTerms: 15 } }),
    prisma.vendor.create({ data: { name: 'Google Cloud', email: 'invoices@google.com', paymentTerms: 30 } }),
    prisma.vendor.create({ data: { name: 'Stripe', email: 'billing@stripe.com', paymentTerms: 30 } }),
    prisma.vendor.create({ data: { name: 'Notion', email: 'finance@notion.so', paymentTerms: 30 } }),
    prisma.vendor.create({ data: { name: 'Figma', email: 'billing@figma.com', paymentTerms: 45 } }),
  ]);

  await prisma.user.create({
    data: {
      email: 'admin@payr.co',
      password: 'admin123',
      name: 'Admin User',
      role: 'admin',
    },
  });

  const defs: SeedBillDef[] = [
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
      invoiceDate: new Date('2026-02-15'),
      dueDate: new Date('2026-03-20'),
      totalAmount: 28000,
      notes: 'SaaS platform license renewal — team plan (Notion).',
    },
    {
      invoiceNumber: 'INV-2026-008',
      vendorIdx: 4,
      status: 'approved',
      invoiceDate: new Date('2026-03-20'),
      dueDate: new Date('2026-04-10'),
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
    },
    {
      invoiceNumber: 'INV-2026-012',
      vendorIdx: 3,
      status: 'rejected',
      invoiceDate: new Date('2026-03-01'),
      dueDate: new Date('2026-04-01'),
      totalAmount: 3200,
      notes: 'Workspace add-on invoice — rejected: missing PO (Notion).',
    },
    {
      invoiceNumber: 'INV-2026-013',
      vendorIdx: 4,
      status: 'rejected',
      invoiceDate: new Date('2026-03-18'),
      dueDate: new Date('2026-04-18'),
      totalAmount: 4100,
      notes: 'Plugin marketplace charges — rejected: wrong cost center (Figma).',
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

  for (const def of defs) {
    const vendor = vendors[def.vendorIdx];
    const amount = def.totalAmount;

    const bill = await prisma.bill.create({
      data: {
        vendorId: vendor.id,
        invoiceNumber: def.invoiceNumber,
        status: def.status,
        invoiceDate: def.invoiceDate,
        dueDate: def.dueDate,
        totalAmount: amount,
        currency: 'USD',
        notes: def.notes,
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

    await addHistory(bill.id, historyChainFor(def.status));

    if (def.withPayment) {
      await prisma.payment.create({
        data: {
          billId: bill.id,
          amount,
          paymentDate: new Date('2026-04-18'),
          method: def.paymentMethod ?? 'ach',
          reference: def.invoiceNumber,
        },
      });
    }
  }
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
