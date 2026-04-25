import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { BillsModule } from '../bills/bills.module';

@Module({
  imports: [BillsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
