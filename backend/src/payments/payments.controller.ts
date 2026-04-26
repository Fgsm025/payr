import { Controller, Get, Headers, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { requireEntityId } from '../common/require-entity-id';

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  findAll(@Headers('x-entity-id') entityIdHeader: string) {
    return this.paymentsService.findAll(requireEntityId(entityIdHeader));
  }
}
