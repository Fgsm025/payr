import { BadRequestException, Injectable } from '@nestjs/common';
import { BillStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { VendorsService } from '../vendors/vendors.service';

type BillAction = 'submit' | 'approve' | 'reject' | 'pay' | 'archive';

@Injectable()
export class BillsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
    private readonly vendorsService: VendorsService,
  ) {}

  private transitionMap: Record<BillStatus, Partial<Record<BillAction, BillStatus>>> = {
    draft: { submit: 'pending_approval', archive: 'archived' },
    pending_approval: { approve: 'approved', reject: 'rejected', archive: 'archived' },
    approved: { pay: 'paid', archive: 'archived' },
    scheduled: { pay: 'paid', archive: 'archived' },
    paid: {},
    rejected: {},
    archived: {},
  };

  findAll() {
    return this.prisma.bill.findMany({
      include: { vendor: true, lineItems: true, history: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(input: {
    vendorId?: string;
    vendorName?: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    amount: number;
    currency?: string;
    notes?: string;
    line_items?: Array<{ description: string; amount: number; category: string }>;
  }) {
    let vendorId = input.vendorId;

    if (!vendorId && input.vendorName) {
      const vendor = await this.vendorsService.findOrCreateByName(input.vendorName);
      vendorId = vendor.id;
    }

    if (!vendorId) {
      throw new BadRequestException('vendorId or vendorName is required');
    }

    const bill = await this.prisma.bill.create({
      data: {
        vendorId,
        invoiceNumber: input.invoiceNumber,
        invoiceDate: new Date(input.invoiceDate),
        dueDate: new Date(input.dueDate),
        totalAmount: input.amount,
        currency: input.currency ?? 'USD',
        notes: input.notes,
        status: 'draft',
        lineItems: {
          create:
            input.line_items?.map((item) => ({
              description: item.description,
              quantity: 1,
              unitPrice: item.amount,
              amount: item.amount,
              category: item.category,
            })) ?? [],
        },
        history: {
          create: { status: 'draft', comment: 'Created via POST /bills' },
        },
      },
      include: { vendor: true, lineItems: true, history: true },
    });

    return bill;
  }

  async transitionStatus(id: string, input: { action: BillAction; comment?: string }) {
    const bill = await this.prisma.bill.findUnique({ where: { id } });
    if (!bill) throw new BadRequestException('Bill not found');

    const nextStatus = this.transitionMap[bill.status]?.[input.action];
    if (!nextStatus) {
      throw new BadRequestException(
        `Invalid transition: ${bill.status} -> ${input.action}`,
      );
    }

    const updated = await this.prisma.bill.update({
      where: { id },
      data: {
        status: nextStatus,
        history: {
          create: { status: nextStatus, comment: input.comment },
        },
      },
      include: { vendor: true, lineItems: true, history: true },
    });

    if (input.action === 'pay') {
      await this.paymentsService.createPaymentForBill({
        billId: updated.id,
        amount: updated.totalAmount,
        reference: updated.invoiceNumber,
      });
    }

    return updated;
  }

  transitionFromPatch(id: string, status: BillStatus) {
    if (status !== 'pending_approval') {
      throw new BadRequestException('Only pending_approval patch is supported');
    }
    return this.transitionStatus(id, { action: 'submit' });
  }
}
