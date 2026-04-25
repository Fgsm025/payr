import { PrismaService } from '../prisma/prisma.service';
export declare class PaymentsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
    createPaymentForBill(input: {
        billId: string;
        amount: number;
        reference?: string;
    }): import("@prisma/client").Prisma.Prisma__PaymentClient<{
        id: string;
        createdAt: Date;
        billId: string;
        amount: number;
        paymentDate: Date;
        method: import("@prisma/client").$Enums.PaymentMethod;
        reference: string | null;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
