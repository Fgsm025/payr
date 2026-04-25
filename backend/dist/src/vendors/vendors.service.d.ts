import { PrismaService } from '../prisma/prisma.service';
export declare class VendorsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        name: string;
        email: string;
        paymentTerms: number;
        bankAccount: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    create(input: {
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
    update(id: string, input: Partial<{
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
    findOrCreateByName(name: string): Promise<{
        id: string;
        name: string;
        email: string;
        paymentTerms: number;
        bankAccount: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
