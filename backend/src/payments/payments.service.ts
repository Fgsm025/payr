import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.payment.findMany({
      include: { bill: { include: { vendor: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  createPaymentForBill(input: { billId: string; amount: number; reference?: string }) {
    return this.prisma.payment.create({
      data: {
        billId: input.billId,
        amount: input.amount,
        paymentDate: new Date(),
        method: 'ach',
        reference: input.reference,
      },
    });
  }
}
