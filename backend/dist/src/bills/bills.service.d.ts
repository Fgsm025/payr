import { BillStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { VendorsService } from '../vendors/vendors.service';
type BillAction = 'submit' | 'approve' | 'reject' | 'pay' | 'archive';
export declare class BillsService {
    private readonly prisma;
    private readonly paymentsService;
    private readonly vendorsService;
    constructor(prisma: PrismaService, paymentsService: PaymentsService, vendorsService: VendorsService);
    private transitionMap;
    findAll(): import("@prisma/client").Prisma.PrismaPromise<({
        vendor: {
            id: string;
            name: string;
            email: string;
            paymentTerms: number;
            bankAccount: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        lineItems: {
            id: string;
            billId: string;
            amount: number;
            description: string;
            quantity: number;
            unitPrice: number;
            category: string;
        }[];
        history: {
            id: string;
            createdAt: Date;
            status: import("@prisma/client").$Enums.BillStatus;
            comment: string | null;
            billId: string;
        }[];
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
    })[]>;
    create(input: {
        vendorId?: string;
        vendorName?: string;
        invoiceNumber: string;
        invoiceDate: string;
        dueDate: string;
        amount: number;
        currency?: string;
        notes?: string;
        line_items?: Array<{
            description: string;
            amount: number;
            category: string;
        }>;
    }): Promise<{
        vendor: {
            id: string;
            name: string;
            email: string;
            paymentTerms: number;
            bankAccount: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        lineItems: {
            id: string;
            billId: string;
            amount: number;
            description: string;
            quantity: number;
            unitPrice: number;
            category: string;
        }[];
        history: {
            id: string;
            createdAt: Date;
            status: import("@prisma/client").$Enums.BillStatus;
            comment: string | null;
            billId: string;
        }[];
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
    }>;
    transitionStatus(id: string, input: {
        action: BillAction;
        comment?: string;
    }): Promise<{
        vendor: {
            id: string;
            name: string;
            email: string;
            paymentTerms: number;
            bankAccount: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        lineItems: {
            id: string;
            billId: string;
            amount: number;
            description: string;
            quantity: number;
            unitPrice: number;
            category: string;
        }[];
        history: {
            id: string;
            createdAt: Date;
            status: import("@prisma/client").$Enums.BillStatus;
            comment: string | null;
            billId: string;
        }[];
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
    }>;
    transitionFromPatch(id: string, status: BillStatus): Promise<{
        vendor: {
            id: string;
            name: string;
            email: string;
            paymentTerms: number;
            bankAccount: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        lineItems: {
            id: string;
            billId: string;
            amount: number;
            description: string;
            quantity: number;
            unitPrice: number;
            category: string;
        }[];
        history: {
            id: string;
            createdAt: Date;
            status: import("@prisma/client").$Enums.BillStatus;
            comment: string | null;
            billId: string;
        }[];
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
    }>;
}
export {};
