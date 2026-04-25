"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const bills_service_1 = require("../bills/bills.service");
let DashboardService = class DashboardService {
    billsService;
    constructor(billsService) {
        this.billsService = billsService;
    }
    async getSummary() {
        const bills = await this.billsService.findAll();
        const totalPayable = bills
            .filter((bill) => !['paid', 'rejected', 'archived'].includes(bill.status))
            .reduce((sum, bill) => sum + bill.totalAmount, 0);
        return {
            totalPayable,
            pendingApproval: bills.filter((bill) => bill.status === 'pending_approval').length,
            overdue: bills.filter((bill) => new Date(bill.dueDate) < new Date() && bill.status !== 'paid').length,
        };
    }
    getApAging() {
        return { message: 'AP aging endpoint scaffold ready' };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [bills_service_1.BillsService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map