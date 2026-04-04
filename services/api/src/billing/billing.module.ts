import { Module } from '@nestjs/common';
import { StripeController } from './stripe.controller';
import { BillingController } from './billing.controller';
import { StripeService } from './stripe.service';
import { BillingService } from './billing.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StripeController, BillingController],
  providers: [StripeService, BillingService],
  exports: [StripeService, BillingService],
})
export class BillingModule {}
