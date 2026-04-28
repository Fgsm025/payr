import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BillsService } from './bills.service';
import { PaymentsService } from '../payments/payments.service';
import { VendorsService } from '../vendors/vendors.service';

describe('BillsService state machine', () => {
  it('rejects invalid transition from paid using approve action', async () => {
    const findFirstMock = jest.fn().mockResolvedValue({
      id: 'bill-1',
      entityId: 'entity-1',
      status: 'paid',
    });
    const updateMock = jest.fn();
    const prisma = {
      bill: {
        findFirst: findFirstMock,
        update: updateMock,
      },
    } as unknown as PrismaService;

    const createPaymentForBillMock = jest.fn();
    const paymentsService = {
      createPaymentForBill: createPaymentForBillMock,
    } as unknown as PaymentsService;

    const vendorsService = {} as VendorsService;

    const service = new BillsService(prisma, paymentsService, vendorsService);

    await expect(
      service.transitionStatus('entity-1', 'bill-1', { action: 'approve' }),
    ).rejects.toThrow(BadRequestException);

    expect(updateMock).not.toHaveBeenCalled();
    expect(createPaymentForBillMock).not.toHaveBeenCalled();
  });
});
