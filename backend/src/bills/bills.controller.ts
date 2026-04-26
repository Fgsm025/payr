import { Body, Controller, Get, Param, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BillsService } from './bills.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OcrService } from './ocr.service';

@UseGuards(JwtAuthGuard)
@Controller('bills')
export class BillsController {
  constructor(
    private readonly billsService: BillsService,
    private readonly ocrService: OcrService,
  ) {}

  @Get()
  findAll() {
    return this.billsService.findAll();
  }

  @Post()
  create(
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
    return this.billsService.create(body);
  }

  @Post('extract')
  @UseInterceptors(FileInterceptor('file'))
  extract(@UploadedFile() file: { buffer: Buffer; mimetype: string }) {
    return this.ocrService.extractInvoiceFromFile(file);
  }

  @Patch(':id')
  patchStatus(@Param('id') id: string, @Body() body: { status: 'pending_approval' }) {
    return this.billsService.transitionFromPatch(id, body.status);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body()
    body: {
      action: 'submit' | 'approve' | 'reject' | 'pay' | 'archive';
      comment?: string;
    },
  ) {
    return this.billsService.transitionStatus(id, body);
  }
}
