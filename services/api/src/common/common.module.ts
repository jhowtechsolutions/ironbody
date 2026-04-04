import { Module } from '@nestjs/common';
import { PremiumGuard } from './guards/premium.guard';
import { PlanTypeGuard } from './guards/plan-type.guard';

@Module({
  providers: [PremiumGuard, PlanTypeGuard],
  exports: [PremiumGuard, PlanTypeGuard],
})
export class CommonModule {}
