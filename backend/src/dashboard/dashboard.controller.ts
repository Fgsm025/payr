import { Controller, Get, Headers, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { requireEntityId } from '../common/require-entity-id';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary(@Headers('x-entity-id') entityIdHeader: string) {
    return this.dashboardService.getSummary(requireEntityId(entityIdHeader));
  }

  @Get('ap-aging')
  getApAging(@Headers('x-entity-id') entityIdHeader: string) {
    return this.dashboardService.getApAging(requireEntityId(entityIdHeader));
  }
}
