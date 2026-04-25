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
exports.BillsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const payments_service_1 = require("../payments/payments.service");
const vendors_service_1 = require("../vendors/vendors.service");
let BillsService = class BillsService {
    prisma;
    paymentsService;
    vendorsService;
    constructor(prisma, paymentsService, vendorsService) {
        this.prisma = prisma;
        this.paymentsService = paymentsService;
        this.vendorsService = vendorsService;
    }
    transitionMap = {
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
    async create(input) {
        let vendorId = input.vendorId;
        if (!vendorId && input.vendorName) {
            const vendor = await this.vendorsService.findOrCreateByName(input.vendorName);
            vendorId = vendor.id;
        }
        if (!vendorId) {
            throw new common_1.BadRequestException('vendorId or vendorName is required');
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
                    create: input.line_items?.map((item) => ({
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
    async transitionStatus(id, input) {
        const bill = await this.prisma.bill.findUnique({ where: { id } });
        if (!bill)
            throw new common_1.BadRequestException('Bill not found');
        const nextStatus = this.transitionMap[bill.status]?.[input.action];
        if (!nextStatus) {
            throw new common_1.BadRequestException(`Invalid transition: ${bill.status} -> ${input.action}`);
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
    transitionFromPatch(id, status) {
        if (status !== 'pending_approval') {
            throw new common_1.BadRequestException('Only pending_approval patch is supported');
        }
        return this.transitionStatus(id, { action: 'submit' });
    }
};
exports.BillsService = BillsService;
exports.BillsService = BillsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        payments_service_1.PaymentsService,
        vendors_service_1.VendorsService])
], BillsService);
//# sourceMappingURL=bills.service.js.map