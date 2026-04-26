import 'dotenv/config';
import { BillStatus, PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? 'file:./dev.db',
});
const prisma = new PrismaClient({ adapter });

function calendarToday() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

/** Payment date in the month that is `monthsBefore` months before `anchor`'s month. */
function payInMonth(anchor: Date, monthsBefore: number, day: number) {
  return new Date(anchor.getFullYear(), anchor.getMonth() - monthsBefore, day);
}

const E_AR = 'xyz-ar';
const E_CL = 'xyz-cl';
const E_UY = 'xyz-uy';

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
  paymentDate?: Date;
};

type VendorSeed = { name: string; email: string; paymentTerms: number };

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

async function seedEntity(entityId: string, vendorSeeds: VendorSeed[], defs: SeedBillDef[]) {
  const vendors = await Promise.all(
    vendorSeeds.map((v) => prisma.vendor.create({ data: { ...v, entityId } })),
  );

  for (const def of defs) {
    const vendor = vendors[def.vendorIdx];
    const amount = def.totalAmount;

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

  await seedEntity(E_AR, arVendors, arDefs);

  const clVendors: VendorSeed[] = [
    { name: 'LATAM Logistics SA', email: 'ap@latamlogistics.cl', paymentTerms: 30 },
    { name: 'Santiago Office Supplies', email: 'facturacion@sos.cl', paymentTerms: 15 },
    { name: 'Chile Telecom', email: 'cobranza@chiletelecom.cl', paymentTerms: 45 },
    { name: 'Andes Mining Services', email: 'finance@andesmining.cl', paymentTerms: 30 },
  ];

  const clDefs: SeedBillDef[] = [
    {
      invoiceNumber: 'INV-CL-001',
      vendorIdx: 0,
      status: 'draft',
      invoiceDate: new Date('2026-04-01'),
      dueDate: new Date('2026-05-01'),
      totalAmount: 8900,
      notes: 'Freight consolidation — March 2026 (Chile entity).',
    },
    {
      invoiceNumber: 'INV-CL-002',
      vendorIdx: 1,
      status: 'pending_approval',
      invoiceDate: new Date('2026-03-10'),
      dueDate: new Date('2026-02-28'),
      totalAmount: 1200,
      notes: 'Office equipment lease — overdue for demo aging.',
    },
    {
      invoiceNumber: 'INV-CL-003',
      vendorIdx: 2,
      status: 'approved',
      invoiceDate: new Date('2026-02-01'),
      dueDate: new Date('2026-03-15'),
      totalAmount: 5600,
      notes: 'Fiber circuit — regional HQ.',
    },
    {
      invoiceNumber: 'INV-CL-004',
      vendorIdx: 3,
      status: 'paid',
      invoiceDate: new Date('2026-03-20'),
      dueDate: new Date('2026-04-10'),
      totalAmount: 24000,
      notes: 'Equipment rental — Q1 2026.',
      withPayment: true,
      paymentMethod: 'wire',
    },
    {
      invoiceNumber: 'INV-CL-005',
      vendorIdx: 0,
      status: 'paid',
      invoiceDate: new Date('2026-04-05'),
      dueDate: new Date('2026-04-25'),
      totalAmount: 3100,
      notes: 'Last-mile delivery — April.',
      withPayment: true,
      paymentMethod: 'ach',
    },
  ];

  await seedEntity(E_CL, clVendors, clDefs);

  const uyVendors: VendorSeed[] = [
    { name: 'Montevideo Hosting', email: 'billing@mvdhosting.uy', paymentTerms: 30 },
    { name: 'Río Plata Software', email: 'invoices@rioplatasoft.uy', paymentTerms: 30 },
    { name: 'UY Payroll Partners', email: 'ap@uypp.uy', paymentTerms: 15 },
  ];

  const uyDefs: SeedBillDef[] = [
    {
      invoiceNumber: 'INV-UY-001',
      vendorIdx: 0,
      status: 'draft',
      invoiceDate: new Date('2026-04-02'),
      dueDate: new Date('2026-05-10'),
      totalAmount: 4500,
      notes: 'Colocation renewal — Uruguay entity.',
    },
    {
      invoiceNumber: 'INV-UY-002',
      vendorIdx: 1,
      status: 'pending_approval',
      invoiceDate: new Date('2026-02-20'),
      dueDate: new Date('2026-03-10'),
      totalAmount: 18750,
      notes: 'ERP module license — overdue sample.',
    },
    {
      invoiceNumber: 'INV-UY-003',
      vendorIdx: 2,
      status: 'approved',
      invoiceDate: new Date('2026-03-01'),
      dueDate: new Date('2026-04-01'),
      totalAmount: 6200,
      notes: 'Payroll processing — March 2026.',
    },
    {
      invoiceNumber: 'INV-UY-004',
      vendorIdx: 0,
      status: 'paid',
      invoiceDate: new Date('2026-04-01'),
      dueDate: new Date('2026-04-20'),
      totalAmount: 990,
      notes: 'Bandwidth upgrade.',
      withPayment: true,
      paymentMethod: 'check',
    },
  ];

  await seedEntity(E_UY, uyVendors, uyDefs);
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
