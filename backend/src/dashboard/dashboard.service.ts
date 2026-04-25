import { Injectable } from '@nestjs/common';
import { BillsService } from '../bills/bills.service';

@Injectable()
export class DashboardService {
  constructor(private readonly billsService: BillsService) {}

  async getSummary() {
    const bills = await this.billsService.findAll();
    const totalPayable = bills
      .filter((bill) => !['paid', 'rejected', 'archived'].includes(bill.status))
      .reduce((sum, bill) => sum + bill.totalAmount, 0);

    return {
      totalPayable,
      pendingApproval: bills.filter((bill) => bill.status === 'pending_approval').length,
      overdue: bills.filter(
        (bill) => new Date(bill.dueDate) < new Date() && bill.status !== 'paid',
      ).length,
    };
  }

  getApAging() {
    return { message: 'AP aging endpoint scaffold ready' };
  }
}
