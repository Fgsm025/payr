import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { BillsModule } from '../bills/bills.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [BillsModule, DatabaseModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
