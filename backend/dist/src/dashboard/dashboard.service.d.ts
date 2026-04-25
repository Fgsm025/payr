import { BillsService } from '../bills/bills.service';
export declare class DashboardService {
    private readonly billsService;
    constructor(billsService: BillsService);
    getSummary(): Promise<{
        totalPayable: number;
        pendingApproval: number;
        overdue: number;
    }>;
    getApAging(): {
        message: string;
    };
}
