import { Module } from '@nestjs/common';
import { BillsController } from './bills.controller';
import { BillsService } from './bills.service';
import { PaymentsModule } from '../payments/payments.module';
import { VendorsModule } from '../vendors/vendors.module';
import { DatabaseModule } from '../database/database.module';
import { OcrService } from './ocr.service';

@Module({
  imports: [DatabaseModule, PaymentsModule, VendorsModule],
  controllers: [BillsController],
  providers: [BillsService, OcrService],
  exports: [BillsService],
})
export class BillsModule {}
