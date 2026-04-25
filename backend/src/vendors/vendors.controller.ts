import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  findAll() {
    return this.vendorsService.findAll();
  }

  @Post()
  create(@Body() body: { name: string; email: string; paymentTerms: number; bankAccount?: string }) {
    return this.vendorsService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Partial<{ name: string; email: string; paymentTerms: number; bankAccount?: string }>) {
    return this.vendorsService.update(id, body);
  }
}
