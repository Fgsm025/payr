import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    findAll(): import("@prisma/client").Prisma.PrismaPromise<({
        bill: {
            vendor: {
                id: string;
                name: string;
                email: string;
                paymentTerms: number;
                bankAccount: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            invoiceNumber: string;
            status: import("@prisma/client").$Enums.BillStatus;
            invoiceDate: Date;
            dueDate: Date;
            totalAmount: number;
            currency: string;
            notes: string | null;
            vendorId: string;
        };
    } & {
        id: string;
        createdAt: Date;
        billId: string;
        amount: number;
        paymentDate: Date;
        method: import("@prisma/client").$Enums.PaymentMethod;
        reference: string | null;
    })[]>;
}
