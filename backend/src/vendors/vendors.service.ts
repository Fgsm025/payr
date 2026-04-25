import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VendorsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.vendor.findMany({ orderBy: { createdAt: 'desc' } });
  }

  create(input: {
    name: string;
    email: string;
    paymentTerms: number;
    bankAccount?: string;
  }) {
    return this.prisma.vendor.create({ data: input });
  }

  update(
    id: string,
    input: Partial<{
      name: string;
      email: string;
      paymentTerms: number;
      bankAccount?: string;
    }>,
  ) {
    return this.prisma.vendor.update({ where: { id }, data: input });
  }

  async findOrCreateByName(name: string) {
    const all = await this.prisma.vendor.findMany({ select: { id: true, name: true, email: true, paymentTerms: true, bankAccount: true, createdAt: true, updatedAt: true } });
    const existing = all.find((vendor) => vendor.name.toLowerCase() === name.toLowerCase());

    if (existing) return existing;

    return this.prisma.vendor.create({
      data: {
        name,
        email: `ap@${name.toLowerCase().replace(/\s+/g, '')}.com`,
        paymentTerms: 30,
      },
    });
  }
}
