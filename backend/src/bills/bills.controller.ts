import {
  Body,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BillsService } from './bills.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OcrService } from './ocr.service';
import { requireEntityId } from '../common/require-entity-id';

@UseGuards(JwtAuthGuard)
@Controller('bills')
export class BillsController {
  constructor(
    private readonly billsService: BillsService,
    private readonly ocrService: OcrService,
  ) {}

  @Get()
  findAll(@Headers('x-entity-id') entityIdHeader: string) {
    return this.billsService.findAll(requireEntityId(entityIdHeader));
  }

  @Get(':id')
  async findOne(@Headers('x-entity-id') entityIdHeader: string, @Param('id') id: string) {
    const bill = await this.billsService.findOne(requireEntityId(entityIdHeader), id);
    if (!bill) throw new NotFoundException('Bill not found');
    return bill;
  }

  @Post()
  create(
    @Headers('x-entity-id') entityIdHeader: string,
    @Body()
    body: {
      vendorId?: string;
      vendorName?: string;
      invoiceNumber: string;
      invoiceDate: string;
      dueDate: string;
      amount: number;
      currency?: string;
      notes?: string;
      line_items?: Array<{ description: string; amount: number; category: string }>;
    },
  ) {
    return this.billsService.create(requireEntityId(entityIdHeader), body);
  }

  @Post('extract')
  @UseInterceptors(FileInterceptor('file'))
  extract(@UploadedFile() file: { buffer: Buffer; mimetype: string }) {
    return this.ocrService.extractInvoiceFromFile(file);
  }

  @Patch(':id')
  patchStatus(
    @Headers('x-entity-id') entityIdHeader: string,
    @Param('id') id: string,
    @Body() body: { status: 'pending_approval' },
  ) {
    return this.billsService.transitionFromPatch(requireEntityId(entityIdHeader), id, body.status);
  }

  @Patch(':id/status')
  updateStatus(
    @Headers('x-entity-id') entityIdHeader: string,
    @Param('id') id: string,
    @Body()
    body: {
      action: 'submit' | 'approve' | 'reject' | 'pay' | 'archive';
      comment?: string;
    },
  ) {
    return this.billsService.transitionStatus(requireEntityId(entityIdHeader), id, body);
  }
}
