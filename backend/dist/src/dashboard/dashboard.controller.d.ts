import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getSummary(): Promise<{
        totalPayable: number;
        pendingApproval: number;
        overdue: number;
    }>;
    getApAging(): {
        message: string;
    };
}
