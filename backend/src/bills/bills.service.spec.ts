import { BadRequestException } from '@nestjs/common';
import { BillsService } from './bills.service';

describe('BillsService state machine', () => {
  it('rejects invalid transition from paid using approve action', async () => {
    const prisma = {
      bill: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'bill-1',
          entityId: 'entity-1',
          status: 'paid',
        }),
        update: jest.fn(),
      },
    } as any;

    const paymentsService = {
      createPaymentForBill: jest.fn(),
    } as any;

    const vendorsService = {} as any;

    const service = new BillsService(prisma, paymentsService, vendorsService);

    await expect(
      service.transitionStatus('entity-1', 'bill-1', { action: 'approve' }),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.bill.update).not.toHaveBeenCalled();
    expect(paymentsService.createPaymentForBill).not.toHaveBeenCalled();
  });
});
