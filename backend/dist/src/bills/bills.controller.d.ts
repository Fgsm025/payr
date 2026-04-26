import { BillsService } from './bills.service';
import { OcrService } from './ocr.service';
export declare class BillsController {
    private readonly billsService;
    private readonly ocrService;
    constructor(billsService: BillsService, ocrService: OcrService);
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
    create(body: {
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
    extract(file: {
        buffer: Buffer;
        mimetype: string;
    }): Promise<{
        vendorName: string | null;
        totalAmount: number | null;
        invoiceDate: string | null;
        dueDate: string | null;
        currency: string | null;
    }>;
    patchStatus(id: string, body: {
        status: 'pending_approval';
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
    updateStatus(id: string, body: {
        action: 'submit' | 'approve' | 'reject' | 'pay' | 'archive';
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
}
