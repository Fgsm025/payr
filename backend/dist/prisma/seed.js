"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_better_sqlite3_1 = require("@prisma/adapter-better-sqlite3");
const adapter = new adapter_better_sqlite3_1.PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? 'file:./dev.db',
});
const prisma = new client_1.PrismaClient({ adapter });
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
    const states = [
        'draft',
        'pending_approval',
        'approved',
        'scheduled',
        'paid',
        'rejected',
        'archived',
        'pending_approval',
        'approved',
        'paid',
    ];
    for (let i = 0; i < 10; i++) {
        const status = states[i];
        const vendor = vendors[i % vendors.length];
        const amount = 800 + i * 350;
        const bill = await prisma.bill.create({
            data: {
                vendorId: vendor.id,
                invoiceNumber: `INV-2026-${String(i + 1).padStart(3, '0')}`,
                status,
                invoiceDate: new Date(`2026-04-${String(5 + i).padStart(2, '0')}`),
                dueDate: new Date(`2026-05-${String(8 + i).padStart(2, '0')}`),
                totalAmount: amount,
                currency: 'USD',
                notes: `Seed bill ${i + 1}`,
            },
        });
        await prisma.billLineItem.createMany({
            data: [
                {
                    billId: bill.id,
                    description: 'Monthly subscription',
                    quantity: 1,
                    unitPrice: amount * 0.7,
                    amount: amount * 0.7,
                    category: 'Software',
                },
                {
                    billId: bill.id,
                    description: 'Usage charges',
                    quantity: 1,
                    unitPrice: amount * 0.3,
                    amount: amount * 0.3,
                    category: 'Infrastructure',
                },
            ],
        });
        await prisma.billStatusHistory.create({
            data: { billId: bill.id, status: 'draft', comment: 'Created from seed' },
        });
        if (status !== 'draft') {
            await prisma.billStatusHistory.create({
                data: { billId: bill.id, status, comment: 'Moved from seed state machine' },
            });
        }
        if (status === 'paid') {
            await prisma.payment.create({
                data: {
                    billId: bill.id,
                    amount,
                    paymentDate: new Date(),
                    method: 'ach',
                    reference: bill.invoiceNumber,
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
//# sourceMappingURL=seed.js.map