import { VendorsService } from './vendors.service';
export declare class VendorsController {
    private readonly vendorsService;
    constructor(vendorsService: VendorsService);
    findAll(): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        name: string;
        email: string;
        paymentTerms: number;
        bankAccount: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    create(body: {
        name: string;
        email: string;
        paymentTerms: number;
        bankAccount?: string;
    }): import("@prisma/client").Prisma.Prisma__VendorClient<{
        id: string;
        name: string;
        email: string;
        paymentTerms: number;
        bankAccount: string | null;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, body: Partial<{
        name: string;
        email: string;
        paymentTerms: number;
        bankAccount?: string;
    }>): import("@prisma/client").Prisma.Prisma__VendorClient<{
        id: string;
        name: string;
        email: string;
        paymentTerms: number;
        bankAccount: string | null;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
