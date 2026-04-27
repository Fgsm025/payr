import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { requireEntityId } from '../common/require-entity-id';

@UseGuards(JwtAuthGuard)
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  findAll(@Headers('x-entity-id') entityIdHeader: string) {
    return this.vendorsService.findAll(requireEntityId(entityIdHeader));
  }

  @Post()
  create(
    @Headers('x-entity-id') entityIdHeader: string,
    @Body()
    body: {
      name: string;
      email: string;
      taxId?: string;
      paymentTerms: number;
      defaultCurrency?: string;
      category?: string;
      bankAccount?: string;
    },
  ) {
    return this.vendorsService.create(requireEntityId(entityIdHeader), body);
  }

  @Patch(':id')
  update(
    @Headers('x-entity-id') entityIdHeader: string,
    @Param('id') id: string,
    @Body()
    body: Partial<{
      name: string;
      email: string;
      taxId?: string;
      paymentTerms: number;
      defaultCurrency?: string;
      category?: string;
      bankAccount?: string;
    }>,
  ) {
    return this.vendorsService.update(
      requireEntityId(entityIdHeader),
      id,
      body,
    );
  }

  @Delete(':id')
  remove(
    @Headers('x-entity-id') entityIdHeader: string,
    @Param('id') id: string,
  ) {
    return this.vendorsService.remove(requireEntityId(entityIdHeader), id);
  }
}
