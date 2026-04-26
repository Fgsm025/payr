import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BillsService } from '../bills/bills.service';

export type ApAgingRowDto = {
  vendor: string;
  current: number;
  bucket_0_30: number;
  bucket_31_60: number;
  bucket_61_90: number;
  bucket_90_plus: number;
  total: number;
};

@Injectable()
export class DashboardService {
  constructor(
    private readonly billsService: BillsService,
    private readonly prisma: PrismaService,
  ) {}

  async getSummary() {
    const bills = await this.billsService.findAll();
    const closed = new Set(['paid', 'rejected', 'archived']);

    const totalPayable = bills
      .filter((bill) => !closed.has(bill.status))
      .reduce((sum, bill) => sum + bill.totalAmount, 0);

    const now = new Date();
    const overdue = bills.filter(
      (bill) => !closed.has(bill.status) && new Date(bill.dueDate) < now,
    ).length;

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const paidAgg = await this.prisma.payment.aggregate({
      where: {
        paymentDate: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    });

    return {
      totalPayable,
      pendingApproval: bills.filter((bill) => bill.status === 'pending_approval').length,
      overdue,
      paidThisMonth: paidAgg._sum.amount ?? 0,
    };
  }

  async getApAging(): Promise<ApAgingRowDto[]> {
    const bills = await this.billsService.findAll();
    const excluded = ['paid', 'archived', 'rejected'];
    const unpaid = bills.filter((b) => !excluded.includes(b.status));

    const startOfDay = (d: Date) => {
      const x = new Date(d);
      x.setHours(0, 0, 0, 0);
      return x;
    };
    const today = startOfDay(new Date());

    const map = new Map<string, ApAgingRowDto>();

    for (const bill of unpaid) {
      const vendorName = bill.vendor?.name ?? 'Unknown';
      const due = startOfDay(new Date(bill.dueDate));
      const diffMs = today.getTime() - due.getTime();
      const daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (!map.has(vendorName)) {
        map.set(vendorName, {
          vendor: vendorName,
          current: 0,
          bucket_0_30: 0,
          bucket_31_60: 0,
          bucket_61_90: 0,
          bucket_90_plus: 0,
          total: 0,
        });
      }
      const row = map.get(vendorName)!;
      const amt = bill.totalAmount;
      if (daysOverdue <= 0) {
        row.current += amt;
      } else if (daysOverdue <= 30) {
        row.bucket_0_30 += amt;
      } else if (daysOverdue <= 60) {
        row.bucket_31_60 += amt;
      } else if (daysOverdue <= 90) {
        row.bucket_61_90 += amt;
      } else {
        row.bucket_90_plus += amt;
      }
      row.total += amt;
    }

    return Array.from(map.values()).sort((a, b) => a.vendor.localeCompare(b.vendor));
  }
}
