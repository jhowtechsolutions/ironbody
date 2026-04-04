import { Controller, Post, Req, BadRequestException, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import Stripe from 'stripe';
import { StripeService } from './stripe.service';

@ApiTags('stripe')
@Controller('stripe')
export class StripeController {
  private readonly logger = new Logger(StripeController.name);

  constructor(private stripeService: StripeService) {}

  @Post('webhook')
  async handleWebhook(@Req() req: Request) {
    const client = this.stripeService.getClient();
    const endpointSecret = this.stripeService.getWebhookSecret();
    if (!client || !endpointSecret) {
      throw new BadRequestException('Stripe não configurado');
    }

    const rawBody = req.body;
    if (!rawBody || !(rawBody instanceof Buffer)) {
      this.logger.error(
        'Webhook: body não é Buffer — confira express.raw em main.ts para /v1/stripe/webhook',
      );
      throw new BadRequestException('Body inválido para webhook');
    }

    this.logger.debug(`Webhook: POST recebido, raw bytes=${rawBody.length}`);

    const sig = req.headers['stripe-signature'];
    if (!sig || typeof sig !== 'string') {
      this.logger.error('Webhook: header stripe-signature ausente');
      throw new BadRequestException('Cabeçalho stripe-signature ausente ou inválido');
    }

    let event: Stripe.Event;
    try {
      event = client.webhooks.constructEvent(rawBody, sig, endpointSecret);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Webhook signature verification failed';
      this.logger.error(
        `Webhook: assinatura inválida — STRIPE_WEBHOOK_SECRET deve ser o whsec_ do stripe listen desta sessão: ${message}`,
      );
      throw new BadRequestException(message);
    }

    if (await this.stripeService.wasWebhookHandled(event.id)) {
      this.logger.warn(
        `[StripeWebhook] evt=${event.id} event=${event.type} action=duplicate_ignored`,
      );
      return { received: true, duplicate: true };
    }

    this.logger.log(`[StripeWebhook] evt=${event.id} event=${event.type} action=processing`);

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.stripeService.handleCheckoutSessionCompleted(
            event.data.object as Stripe.Checkout.Session,
          );
          break;
        case 'customer.subscription.created':
          await this.stripeService.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.updated':
          await this.stripeService.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          await this.stripeService.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        case 'invoice.payment_succeeded':
          await this.stripeService.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.payment_failed':
          await this.stripeService.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        default:
          this.logger.debug(`Evento não tratado: ${event.type}`);
      }
      await this.stripeService.recordWebhookHandled(event.id, event.type);
      this.logger.log(
        `[StripeWebhook] evt=${event.id} event=${event.type} action=recorded_idempotency`,
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.error(
        `[StripeWebhook] evt=${event.id} event=${event.type} action=handler_error detail=${msg}`,
      );
      throw e;
    }

    return { received: true };
  }
}
