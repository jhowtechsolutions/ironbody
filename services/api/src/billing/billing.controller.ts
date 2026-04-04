import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { StripeService } from './stripe.service';
import { BillingService } from './billing.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { CustomerPortalDto } from './dto/customer-portal.dto';

@ApiTags('billing')
@ApiBearerAuth()
@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly billingService: BillingService,
  ) {}

  @Post('checkout-session')
  @ApiOperation({ summary: 'Cria sessão de Checkout Stripe para assinatura' })
  async createCheckoutSession(
    @CurrentUser() user: { id: string; email: string },
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    return this.stripeService.createCheckoutSession({
      userId: user.id,
      email: user.email,
      plan: dto.plan,
      successUrl: dto.successUrl,
      cancelUrl: dto.cancelUrl,
    });
  }

  @Get('subscription/me')
  @ApiOperation({ summary: 'Assinatura e plano atuais do usuário' })
  async getMySubscription(@CurrentUser() user: { id: string }) {
    return this.billingService.getSubscriptionForUser(user.id);
  }

  @Post('subscription/cancel')
  @ApiOperation({
    summary:
      'Cancela assinatura na Stripe (padrão: cancel_at_period_end; optional imediato)',
  })
  async cancelMySubscription(
    @CurrentUser() user: { id: string },
    @Body() dto: CancelSubscriptionDto,
  ) {
    return this.stripeService.cancelSubscriptionForUser(
      user.id,
      dto.immediately === true,
    );
  }

  @Post('subscription/sync')
  @ApiOperation({
    summary:
      'Re-sincroniza assinatura local com a Stripe (retrieve por stripeSubscriptionId)',
  })
  async syncMySubscription(@CurrentUser() user: { id: string }) {
    return this.stripeService.syncSubscriptionFromStripeForUser(user.id);
  }

  @Post('customer-portal')
  @ApiOperation({
    summary: 'URL do Stripe Customer Portal para o usuário gerenciar assinatura',
  })
  @ApiBody({ type: CustomerPortalDto, required: false })
  async customerPortal(
    @CurrentUser() user: { id: string },
    @Body() dto: CustomerPortalDto,
  ) {
    return this.stripeService.createBillingPortalSession(
      user.id,
      dto.returnUrl,
    );
  }
}
