import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VendorsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(entityId: string) {
    return this.prisma.vendor.findMany({
      where: { entityId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(
    entityId: string,
    input: {
      name: string;
      email: string;
      paymentTerms: number;
      bankAccount?: string;
    },
  ) {
    return this.prisma.vendor.create({
      data: { ...input, entityId },
    });
  }

  async update(
    entityId: string,
    id: string,
    input: Partial<{
      name: string;
      email: string;
      paymentTerms: number;
      bankAccount?: string;
    }>,
  ) {
    const existing = await this.prisma.vendor.findFirst({ where: { id, entityId } });
    if (!existing) throw new NotFoundException('Vendor not found');
    return this.prisma.vendor.update({ where: { id }, data: input });
  }

  async remove(entityId: string, id: string) {
    const existing = await this.prisma.vendor.findFirst({ where: { id, entityId } });
    if (!existing) throw new NotFoundException('Vendor not found');
    const billCount = await this.prisma.bill.count({ where: { vendorId: id, entityId } });
    if (billCount > 0) {
      throw new BadRequestException('Cannot delete vendor with existing bills');
    }
    await this.prisma.vendor.delete({ where: { id } });
  }

  async findOrCreateByName(name: string, entityId: string) {
    const normalized = name.trim();
    const all = await this.prisma.vendor.findMany({
      where: { entityId },
      select: { id: true, name: true, email: true, paymentTerms: true, bankAccount: true, createdAt: true, updatedAt: true },
    });
    const existing = all.find((vendor) => vendor.name.toLowerCase() === normalized.toLowerCase());

    if (existing) return existing;

    return this.prisma.vendor.create({
      data: {
        entityId,
        name: normalized,
        email: `ap@${normalized.toLowerCase().replace(/\s+/g, '')}.com`,
        paymentTerms: 30,
      },
    });
  }
}
