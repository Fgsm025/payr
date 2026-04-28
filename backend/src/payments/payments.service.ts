import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(entityId: string) {
    return this.prisma.payment.findMany({
      where: { bill: { entityId } },
      include: { bill: { include: { vendor: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  createPaymentForBill(input: {
    billId: string;
    amount: number;
    reference?: string;
    status?: 'INITIATED' | 'SUCCESS' | 'FAILED';
  }) {
    return this.prisma.payment.create({
      data: {
        billId: input.billId,
        amount: input.amount,
        paymentDate: new Date(),
        method: 'ach',
        reference: input.reference,
        status: input.status ?? 'SUCCESS',
      },
    });
  }

  async failLatestPaymentForBill(billId: string) {
    const latest = await this.prisma.payment.findFirst({
      where: { billId },
      orderBy: { createdAt: 'desc' },
    });
    if (!latest) return null;
    return this.prisma.payment.update({
      where: { id: latest.id },
      data: { status: 'FAILED' },
    });
  }

  async markLatestPaymentSuccessOrCreate(input: {
    billId: string;
    amount: number;
    reference?: string;
  }) {
    const latest = await this.prisma.payment.findFirst({
      where: { billId: input.billId },
      orderBy: { createdAt: 'desc' },
    });
    if (!latest) {
      return this.createPaymentForBill({
        billId: input.billId,
        amount: input.amount,
        reference: input.reference,
        status: 'SUCCESS',
      });
    }
    return this.prisma.payment.update({
      where: { id: latest.id },
      data: {
        status: 'SUCCESS',
        paymentDate: new Date(),
        amount: input.amount,
        reference: input.reference,
      },
    });
  }
}
