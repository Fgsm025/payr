import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BillStatus, SyncStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { VendorsService } from '../vendors/vendors.service';

type BillAction =
  | 'submit'
  | 'approve'
  | 'reject'
  | 'pay'
  | 'archive'
  | 'restore';

@Injectable()
export class BillsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
    private readonly vendorsService: VendorsService,
  ) {}

  private withActor(comment: string | undefined, actorEmail?: string) {
    if (!actorEmail) return comment;
    const clean = comment?.trim();
    return clean ? `[by:${actorEmail}] ${clean}` : `[by:${actorEmail}]`;
  }

  /** Simulated QBO document id for tooltips. */
  private nextErpSyncRef(): string {
    return String(1_000 + Math.floor(Math.random() * 9_000));
  }

  private erpSyncFieldsForTransition(
    bill: { status: BillStatus; erpSyncRef: string | null },
    action: BillAction,
  ): { syncStatus?: SyncStatus; erpSyncRef?: string | null } {
    if (action === 'reject') {
      return { syncStatus: 'FAILED', erpSyncRef: null };
    }
    if (action === 'approve') {
      return { syncStatus: 'SUCCESS', erpSyncRef: this.nextErpSyncRef() };
    }
    if (action === 'pay') {
      return {
        syncStatus: 'SUCCESS',
        erpSyncRef: bill.erpSyncRef ?? this.nextErpSyncRef(),
      };
    }
    if (action === 'submit' && bill.status === 'rejected') {
      return { syncStatus: 'PENDING', erpSyncRef: null };
    }
    return {};
  }

  private readonly transitionMap: Record<
    BillStatus,
    Partial<Record<BillAction, BillStatus>>
  > = {
    draft: { submit: 'pending_approval', archive: 'archived' },
    pending_approval: {
      approve: 'approved',
      reject: 'rejected',
      archive: 'archived',
    },
    approved: { pay: 'paid', archive: 'archived' },
    scheduled: { pay: 'paid', archive: 'archived' },
    paid: {},
    rejected: { submit: 'pending_approval', archive: 'archived' },
    archived: { restore: 'draft' },
  };

  findAll(entityId: string) {
    return this.prisma.bill.findMany({
      where: { entityId },
      include: {
        vendor: true,
        lineItems: true,
        history: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(entityId: string, id: string) {
    return this.prisma.bill.findFirst({
      where: { id, entityId },
      include: {
        vendor: true,
        lineItems: true,
        history: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  async create(
    entityId: string,
    input: {
      vendorId?: string;
      vendorName?: string;
      invoiceNumber: string;
      invoiceDate: string;
      dueDate: string;
      amount: number;
      currency?: string;
      notes?: string;
      missingInfo?: boolean;
      line_items?: Array<{
        description: string;
        amount: number;
        category: string;
      }>;
    },
    actorEmail?: string,
  ) {
    let vendorId = input.vendorId;

    if (vendorId) {
      const v = await this.prisma.vendor.findFirst({
        where: { id: vendorId, entityId },
      });
      if (!v) throw new BadRequestException('Vendor not found for this entity');
    }

    if (!vendorId && input.vendorName) {
      const vendor = await this.vendorsService.findOrCreateByName(
        input.vendorName,
        entityId,
      );
      vendorId = vendor.id;
    }

    if (!vendorId) {
      throw new BadRequestException('vendorId or vendorName is required');
    }

    const bill = await this.prisma.bill.create({
      data: {
        entityId,
        vendorId,
        invoiceNumber: input.invoiceNumber,
        invoiceDate: new Date(input.invoiceDate),
        dueDate: new Date(input.dueDate),
        totalAmount: input.amount,
        currency: input.currency ?? 'USD',
        notes: input.notes,
        missingInfo: input.missingInfo ?? false,
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
          create: {
            status: 'draft',
            comment: this.withActor('Bill created', actorEmail),
          },
        },
      },
      include: { vendor: true, lineItems: true, history: true },
    });

    return bill;
  }

  async resubmitRejected(
    entityId: string,
    id: string,
    input: {
      vendorId?: string;
      invoiceNumber: string;
      invoiceDate: string;
      dueDate: string;
      amount: number;
      currency?: string;
      notes?: string;
      line_items?: Array<{
        description: string;
        amount: number;
        category: string;
      }>;
    },
    actorEmail?: string,
  ) {
    const bill = await this.prisma.bill.findFirst({ where: { id, entityId } });
    if (!bill) throw new NotFoundException('Bill not found');
    if (bill.status !== 'rejected') {
      throw new BadRequestException('Only rejected bills can be resubmitted');
    }

    if (input.vendorId) {
      const v = await this.prisma.vendor.findFirst({
        where: { id: input.vendorId, entityId },
      });
      if (!v) throw new BadRequestException('Vendor not found for this entity');
    }

    return this.prisma.bill.update({
      where: { id },
      data: {
        vendorId: input.vendorId ?? bill.vendorId,
        invoiceNumber: input.invoiceNumber,
        invoiceDate: new Date(input.invoiceDate),
        dueDate: new Date(input.dueDate),
        totalAmount: input.amount,
        currency: input.currency ?? bill.currency,
        notes: input.notes,
        missingInfo: false,
        syncStatus: 'PENDING',
        erpSyncRef: null,
        status: 'pending_approval',
        lineItems: {
          deleteMany: {},
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
          create: {
            status: 'pending_approval',
            comment: this.withActor('Resubmitted after rejection', actorEmail),
          },
        },
      },
      include: { vendor: true, lineItems: true, history: true },
    });
  }

  async updateDraft(
    entityId: string,
    id: string,
    input: {
      vendorId?: string;
      invoiceNumber: string;
      invoiceDate: string;
      dueDate: string;
      amount: number;
      currency?: string;
      notes?: string;
      line_items?: Array<{
        description: string;
        amount: number;
        category: string;
      }>;
    },
    actorEmail?: string,
  ) {
    const bill = await this.prisma.bill.findFirst({ where: { id, entityId } });
    if (!bill) throw new NotFoundException('Bill not found');
    if (bill.status !== 'draft') {
      throw new BadRequestException('Only draft bills can be edited');
    }

    if (input.vendorId) {
      const v = await this.prisma.vendor.findFirst({
        where: { id: input.vendorId, entityId },
      });
      if (!v) throw new BadRequestException('Vendor not found for this entity');
    }

    return this.prisma.bill.update({
      where: { id },
      data: {
        vendorId: input.vendorId ?? bill.vendorId,
        invoiceNumber: input.invoiceNumber,
        invoiceDate: new Date(input.invoiceDate),
        dueDate: new Date(input.dueDate),
        totalAmount: input.amount,
        currency: input.currency ?? bill.currency,
        notes: input.notes,
        missingInfo: false,
        lineItems: {
          deleteMany: {},
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
          create: {
            status: 'draft',
            comment: this.withActor('Draft edited', actorEmail),
          },
        },
      },
      include: { vendor: true, lineItems: true, history: true },
    });
  }

  async transitionStatus(
    entityId: string,
    id: string,
    input: { action: BillAction; comment?: string; actorEmail?: string },
  ) {
    const bill = await this.prisma.bill.findFirst({ where: { id, entityId } });
    if (!bill) throw new NotFoundException('Bill not found');

    const nextStatus = this.transitionMap[bill.status]?.[input.action];
    if (!nextStatus) {
      throw new BadRequestException(
        `Invalid transition: ${bill.status} -> ${input.action}`,
      );
    }

    let archiveState: boolean | undefined;
    if (input.action === 'archive') archiveState = true;
    if (input.action === 'restore') archiveState = false;

    const erp = this.erpSyncFieldsForTransition(
      { status: bill.status, erpSyncRef: bill.erpSyncRef },
      input.action,
    );

    const updated = await this.prisma.bill.update({
      where: { id },
      data: {
        status: nextStatus,
        isArchived: archiveState,
        ...erp,
        history: {
          create: {
            status: nextStatus,
            comment: this.withActor(input.comment, input.actorEmail),
          },
        },
      },
      include: { vendor: true, lineItems: true, history: true },
    });

    if (input.action === 'approve') {
      await this.paymentsService.createPaymentForBill({
        billId: updated.id,
        amount: updated.totalAmount,
        reference: updated.invoiceNumber,
        status: 'INITIATED',
      });
    }

    if (input.action === 'pay') {
      await this.paymentsService.markLatestPaymentSuccessOrCreate({
        billId: updated.id,
        amount: updated.totalAmount,
        reference: updated.invoiceNumber,
      });
    }

    return updated;
  }

  transitionFromPatch(entityId: string, id: string, status: BillStatus) {
    if (status !== 'pending_approval') {
      throw new BadRequestException('Only pending_approval patch is supported');
    }
    return this.transitionStatus(entityId, id, { action: 'submit' });
  }

  async removeDraft(entityId: string, id: string) {
    const bill = await this.prisma.bill.findFirst({ where: { id, entityId } });
    if (!bill) throw new NotFoundException('Bill not found');
    if (bill.status !== 'draft') {
      throw new BadRequestException('Only draft bills can be deleted');
    }
    await this.prisma.bill.delete({ where: { id } });
  }

  async cancelPayment(entityId: string, id: string, actorEmail?: string) {
    const bill = await this.prisma.bill.findFirst({ where: { id, entityId } });
    if (!bill) throw new NotFoundException('Bill not found');
    if (bill.status !== 'approved' && bill.status !== 'paid') {
      throw new BadRequestException(
        'Only approved or paid bills can cancel payment',
      );
    }

    await this.paymentsService.failLatestPaymentForBill(id);

    return this.prisma.bill.update({
      where: { id },
      data: {
        status: 'approved',
        history: {
          create: {
            status: 'approved',
            comment: this.withActor('Payment cancelled', actorEmail),
          },
        },
      },
      include: { vendor: true, lineItems: true, history: true },
    });
  }
}
