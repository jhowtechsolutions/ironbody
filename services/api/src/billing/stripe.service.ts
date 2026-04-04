import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';
import { Plan, BillingPlanType } from '@prisma/client';
import { CheckoutPlan } from './dto/create-checkout-session.dto';
import {
  mapStripeSubscriptionStatus,
  resolveSubscriptionPlanType,
  stripeStatusKeepsPremium,
  stripeStatusShouldRevokePremium,
} from './utils/stripe-maps';
import { formatStripeWebhookSummary } from './utils/stripe-webhook-log';

/** Resultado da sincronização `users.plan` / `planType` a partir do objeto Stripe Subscription. */
export type StripeUserSyncOutcome =
  | { kind: 'skipped_incomplete' }
  | { kind: 'no_local_subscription' }
  | {
      kind: 'user_updated';
      userId: string;
      plan: Plan;
      planType: BillingPlanType | null;
    }
  | {
      kind: 'user_unchanged';
      userId: string;
      plan: Plan;
      planType: BillingPlanType | null;
      reason: string;
    };

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe | null = null;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    const secret = this.config.get('STRIPE_SECRET_KEY');
    if (secret) {
      this.stripe = new Stripe(secret, { apiVersion: '2025-02-24.acacia' });
    }
    this.logStripeEnvironment();
  }

  /** Detecta test/live pelo prefixo da chave — nunca logar a chave completa. */
  getStripeMode(): 'test' | 'live' | 'off' {
    const secret = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!secret) return 'off';
    if (secret.startsWith('sk_live_')) return 'live';
    if (secret.startsWith('sk_test_')) return 'test';
    return 'off';
  }

  private logStripeEnvironment() {
    const mode = this.getStripeMode();
    if (mode === 'off') {
      this.logger.warn('[Stripe] STRIPE_SECRET_KEY ausente — billing/checkout/webhook Stripe desativados');
      return;
    }
    this.logger.log(
      `[Stripe] Integração ativa · modo=${mode.toUpperCase()} (prefixo sk_test_ / sk_live_)`,
    );
  }

  getClient(): Stripe | null {
    return this.stripe;
  }

  getWebhookSecret(): string | undefined {
    return this.config.get('STRIPE_WEBHOOK_SECRET');
  }

  /** Erros da API Stripe: log seguro (sem payload sensível) e resposta genérica ao cliente. */
  private rethrowStripeAsServiceUnavailable(context: string, e: unknown): never {
    if (
      e &&
      typeof e === 'object' &&
      'type' in e &&
      String((e as { type: unknown }).type).includes('Stripe')
    ) {
      const se = e as { code?: string; type?: string };
      this.logger.warn(`[Stripe] ${context} type=${se.type} code=${se.code ?? 'n/a'}`);
      throw new ServiceUnavailableException(
        'Serviço de pagamento temporariamente indisponível. Tente novamente em alguns minutos.',
      );
    }
    throw e;
  }

  private getPriceId(plan: CheckoutPlan): string {
    if (plan === CheckoutPlan.PERSONAL) {
      const id = this.config.get('STRIPE_PERSONAL_PRICE_ID');
      if (!id) throw new BadRequestException('STRIPE_PERSONAL_PRICE_ID não configurada');
      return id;
    }
    if (plan === CheckoutPlan.ALUNO) {
      const id = this.config.get('STRIPE_ALUNO_PRICE_ID');
      if (!id) throw new BadRequestException('STRIPE_ALUNO_PRICE_ID não configurada');
      return id;
    }
    throw new BadRequestException('Plano inválido');
  }

  async createCheckoutSession(params: {
    userId: string;
    email: string;
    plan: CheckoutPlan;
    successUrl?: string;
    cancelUrl?: string;
  }) {
    const stripe = this.getClient();
    if (!stripe) throw new BadRequestException('Stripe não configurado');

    const priceId = this.getPriceId(params.plan);
    const webUrl = this.config.get('WEB_URL') ?? this.config.get('APP_URL_WEB') ?? 'http://localhost:3000';
    const successUrl =
      params.successUrl ?? `${webUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = params.cancelUrl ?? `${webUrl}/billing/cancel`;

    let session: Stripe.Response<Stripe.Checkout.Session>;
    try {
      session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        customer_email: params.email,
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: params.userId,
        metadata: {
          userId: params.userId,
          plan: params.plan,
        },
        subscription_data: {
          trial_period_days: 7,
          metadata: {
            userId: params.userId,
            plan: params.plan,
          },
        },
      });
    } catch (e: unknown) {
      this.rethrowStripeAsServiceUnavailable('checkout.sessions.create', e);
    }

    return { id: session.id, url: session.url };
  }

  async wasWebhookHandled(eventId: string): Promise<boolean> {
    const row = await this.prisma.stripeWebhookEvent.findUnique({ where: { id: eventId } });
    return !!row;
  }

  async recordWebhookHandled(eventId: string, type: string): Promise<void> {
    try {
      await this.prisma.stripeWebhookEvent.create({
        data: { id: eventId, type },
      });
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === 'P2002') return;
      throw e;
    }
  }

  private personalPriceId() {
    return this.config.get<string>('STRIPE_PERSONAL_PRICE_ID');
  }

  private alunoPriceId() {
    return this.config.get<string>('STRIPE_ALUNO_PRICE_ID');
  }

  private extractPriceId(sub: Stripe.Subscription): string | null {
    return sub.items.data[0]?.price?.id ?? null;
  }

  private resolvePlanTypeForSubscription(sub: Stripe.Subscription): BillingPlanType {
    const priceId = this.extractPriceId(sub);
    const { planType, source } = resolveSubscriptionPlanType(
      priceId,
      this.personalPriceId(),
      this.alunoPriceId(),
      sub.metadata,
    );
    if (source === 'default') {
      this.logger.warn(
        `planType não identificado por price nem metadata (sub=${sub.id}, priceId=${priceId}) — fallback PERSONAL`,
      );
    }
    return planType;
  }

  /** Log único pós-processamento de webhook (assinatura já persistida pelo handler). */
  private logStripeWebhookOutcome(
    eventType: string,
    sub: Stripe.Subscription,
    customerId: string | null | undefined,
    sync: StripeUserSyncOutcome,
    action: string,
  ) {
    const internal = mapStripeSubscriptionStatus(sub.status);
    const cid =
      customerId ??
      (typeof sub.customer === 'string'
        ? sub.customer
        : sub.customer && !sub.customer.deleted
          ? sub.customer.id
          : undefined);

    if (sync.kind === 'skipped_incomplete') {
      this.logger.log(
        formatStripeWebhookSummary({
          eventType,
          stripeSubscriptionId: sub.id,
          stripeCustomerId: cid ?? null,
          internalSubStatus: internal,
          action: 'no-op',
          detail: 'user_sync_skipped_incomplete',
        }),
      );
      return;
    }
    if (sync.kind === 'no_local_subscription') {
      this.logger.warn(
        formatStripeWebhookSummary({
          eventType,
          stripeSubscriptionId: sub.id,
          stripeCustomerId: cid ?? null,
          action: 'skipped',
          detail: 'no_local_subscription_row',
        }),
      );
      return;
    }

    this.logger.log(
      formatStripeWebhookSummary({
        eventType,
        stripeSubscriptionId: sub.id,
        stripeCustomerId: cid ?? null,
        userId: sync.userId,
        internalSubStatus: internal,
        userPlan: sync.plan,
        userPlanType: sync.planType ?? undefined,
        action,
        detail:
          sync.kind === 'user_unchanged' ? sync.reason : undefined,
      }),
    );
  }

  private resolveStripeCustomerId(
    sub: Stripe.Subscription,
    fallbackCustomerId: string | null,
  ): string | undefined {
    const cid =
      typeof sub.customer === 'string'
        ? sub.customer
        : sub.customer && !sub.customer.deleted
          ? sub.customer.id
          : fallbackCustomerId;
    return cid ?? undefined;
  }

  private buildSubscriptionPayload(
    sub: Stripe.Subscription,
    userId: string,
    customerId: string | null,
  ) {
    const priceId = this.extractPriceId(sub);
    const planType = this.resolvePlanTypeForSubscription(sub);
    const cid = this.resolveStripeCustomerId(sub, customerId);

    return {
      userId,
      stripeCustomerId: cid,
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId ?? undefined,
      planType,
      status: mapStripeSubscriptionStatus(sub.status),
      currentPeriodStart: sub.current_period_start
        ? new Date(sub.current_period_start * 1000)
        : null,
      currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
      trialStart: sub.trial_start ? new Date(sub.trial_start * 1000) : null,
      trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
    };
  }

  async upsertSubscriptionFromStripe(
    sub: Stripe.Subscription,
    userId: string,
    customerId: string | null,
  ) {
    const payload = this.buildSubscriptionPayload(sub, userId, customerId);
    const { userId: uid, ...updateFields } = payload;

    await this.prisma.subscription.upsert({
      where: { stripeSubscriptionId: sub.id },
      create: payload,
      update: updateFields,
    });
  }

  /**
   * Alinha `users.plan` / `planType` com o status Stripe atual.
   * `incomplete` não promove a PREMIUM (checkout ainda não concluído).
   */
  async syncUserFromStripeSubscription(
    sub: Stripe.Subscription,
  ): Promise<StripeUserSyncOutcome> {
    if (sub.status === 'incomplete') {
      return { kind: 'skipped_incomplete' };
    }

    const row = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: sub.id },
      select: { userId: true },
    });
    if (!row) {
      return { kind: 'no_local_subscription' };
    }

    const planType = this.resolvePlanTypeForSubscription(sub);

    if (stripeStatusKeepsPremium(sub.status)) {
      await this.prisma.user.update({
        where: { id: row.userId },
        data: {
          plan: Plan.PREMIUM,
          planType,
        },
      });
      const user = await this.prisma.user.findUnique({
        where: { id: row.userId },
        select: { plan: true, planType: true },
      });
      return {
        kind: 'user_updated',
        userId: row.userId,
        plan: user?.plan ?? Plan.PREMIUM,
        planType: user?.planType ?? planType,
      };
    }

    if (stripeStatusShouldRevokePremium(sub.status)) {
      await this.prisma.user.update({
        where: { id: row.userId },
        data: { plan: Plan.FREE, planType: null },
      });
      return {
        kind: 'user_updated',
        userId: row.userId,
        plan: Plan.FREE,
        planType: null,
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: row.userId },
      select: { plan: true, planType: true },
    });
    this.logger.warn(
      formatStripeWebhookSummary({
        eventType: 'syncUserFromStripeSubscription',
        stripeSubscriptionId: sub.id,
        userId: row.userId,
        userPlan: user?.plan ?? undefined,
        userPlanType: user?.planType ?? undefined,
        internalSubStatus: mapStripeSubscriptionStatus(sub.status),
        action: 'no_rule',
        detail: `stripe_status=${sub.status}`,
      }),
    );
    return {
      kind: 'user_unchanged',
      userId: row.userId,
      plan: user?.plan ?? Plan.FREE,
      planType: user?.planType ?? null,
      reason: `stripe_status=${sub.status}`,
    };
  }

  /**
   * Correlação segura: client_reference_id (usuário) → metadata da session → metadata da subscription.
   */
  private resolveUserIdFromCheckout(
    session: Stripe.Checkout.Session,
    fullSub: Stripe.Subscription,
  ): string | null {
    const fromSessionRef = session.client_reference_id as string | null | undefined;
    if (fromSessionRef) return fromSessionRef;
    const fromSessionMeta = session.metadata?.userId;
    if (fromSessionMeta) return fromSessionMeta;
    const fromSubMeta = fullSub.metadata?.userId;
    if (fromSubMeta) {
      this.logger.log(
        `checkout.session.completed: userId obtido via subscription.metadata (${session.id})`,
      );
      return fromSubMeta;
    }
    return null;
  }

  async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const subscriptionId = session.subscription as string | null;
    const customerId = (session.customer as string | null) ?? null;

    if (!subscriptionId) {
      this.logger.warn(
        formatStripeWebhookSummary({
          eventType: 'checkout.session.completed',
          action: 'skipped',
          detail: `session=${session.id}_no_subscription`,
        }),
      );
      return;
    }

    const stripe = this.getClient();
    if (!stripe) return;

    const fullSub = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['customer'],
    });

    const userId = this.resolveUserIdFromCheckout(session, fullSub);
    if (!userId) {
      this.logger.warn(
        formatStripeWebhookSummary({
          eventType: 'checkout.session.completed',
          stripeSubscriptionId: subscriptionId,
          stripeCustomerId: customerId,
          action: 'skipped',
          detail: `session=${session.id}_missing_userId`,
        }),
      );
      return;
    }

    await this.upsertSubscriptionFromStripe(fullSub, userId, customerId);
    const sync = await this.syncUserFromStripeSubscription(fullSub);
    this.logStripeWebhookOutcome(
      'checkout.session.completed',
      fullSub,
      customerId,
      sync,
      'upserted',
    );
  }

  async handleSubscriptionCreated(sub: Stripe.Subscription) {
    let userId = sub.metadata?.userId ?? undefined;
    const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id ?? null;

    if (!userId && customerId) {
      const byCustomer = await this.prisma.subscription.findFirst({
        where: { stripeCustomerId: customerId },
        orderBy: { updatedAt: 'desc' },
        select: { userId: true },
      });
      if (byCustomer) {
        userId = byCustomer.userId;
        this.logger.warn(
          formatStripeWebhookSummary({
            eventType: 'customer.subscription.created',
            stripeSubscriptionId: sub.id,
            stripeCustomerId: customerId,
            userId,
            action: 'correlation_fallback',
            detail: 'userId_from_stripeCustomerId',
          }),
        );
      }
    }

    if (!userId) {
      this.logger.warn(
        formatStripeWebhookSummary({
          eventType: 'customer.subscription.created',
          stripeSubscriptionId: sub.id,
          stripeCustomerId: customerId,
          action: 'skipped',
          detail: 'missing_userId',
        }),
      );
      return;
    }

    await this.upsertSubscriptionFromStripe(sub, userId, customerId);
    const sync = await this.syncUserFromStripeSubscription(sub);
    this.logStripeWebhookOutcome(
      'customer.subscription.created',
      sub,
      customerId,
      sync,
      'created',
    );
  }

  async handleSubscriptionUpdated(sub: Stripe.Subscription) {
    let userId: string | undefined = sub.metadata?.userId;
    if (!userId) {
      const existing = await this.prisma.subscription.findUnique({
        where: { stripeSubscriptionId: sub.id },
        select: { userId: true },
      });
      userId = existing?.userId ?? undefined;
    }
    if (!userId) {
      this.logger.warn(
        formatStripeWebhookSummary({
          eventType: 'customer.subscription.updated',
          stripeSubscriptionId: sub.id,
          action: 'skipped',
          detail: 'unresolvable_userId',
        }),
      );
      return;
    }
    const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id ?? null;
    await this.upsertSubscriptionFromStripe(sub, userId, customerId);
    const sync = await this.syncUserFromStripeSubscription(sub);
    this.logStripeWebhookOutcome(
      'customer.subscription.updated',
      sub,
      customerId,
      sync,
      'updated',
    );
  }

  async handleSubscriptionDeleted(sub: Stripe.Subscription) {
    const existing = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: sub.id },
    });
    if (!existing) {
      this.logger.warn(
        formatStripeWebhookSummary({
          eventType: 'customer.subscription.deleted',
          stripeSubscriptionId: sub.id,
          action: 'skipped',
          detail: 'no_local_row',
        }),
      );
      return;
    }

    const canceledAt = sub.canceled_at
      ? new Date(sub.canceled_at * 1000)
      : sub.ended_at
        ? new Date(sub.ended_at * 1000)
        : new Date();

    await this.prisma.subscription.update({
      where: { id: existing.id },
      data: {
        status: 'CANCELED',
        canceledAt,
        cancelAtPeriodEnd: false,
      },
    });

    await this.prisma.user.update({
      where: { id: existing.userId },
      data: { plan: Plan.FREE, planType: null },
    });
    this.logger.log(
      formatStripeWebhookSummary({
        eventType: 'customer.subscription.deleted',
        stripeSubscriptionId: sub.id,
        stripeCustomerId: existing.stripeCustomerId,
        userId: existing.userId,
        internalSubStatus: 'CANCELED',
        userPlan: 'FREE',
        userPlanType: null,
        action: 'deleted',
      }),
    );
  }

  async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    const subscriptionId =
      typeof invoice.subscription === 'string'
        ? invoice.subscription
        : invoice.subscription && typeof invoice.subscription !== 'string'
          ? invoice.subscription.id
          : null;
    const customerId =
      typeof invoice.customer === 'string'
        ? invoice.customer
        : invoice.customer && typeof invoice.customer !== 'string'
          ? invoice.customer.id
          : null;

    if (!subscriptionId) {
      this.logger.warn(
        formatStripeWebhookSummary({
          eventType: 'invoice.payment_succeeded',
          action: 'skipped',
          detail: `invoice=${invoice.id}_no_subscription`,
        }),
      );
      return;
    }

    const stripe = this.getClient();
    if (!stripe) return;

    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    const row =
      (await this.prisma.subscription.findUnique({
        where: { stripeSubscriptionId: subscriptionId },
      })) ??
      (customerId
        ? await this.prisma.subscription.findFirst({
            where: { stripeCustomerId: customerId },
            orderBy: { updatedAt: 'desc' },
          })
        : null);

    if (!row) {
      this.logger.warn(
        formatStripeWebhookSummary({
          eventType: 'invoice.payment_succeeded',
          stripeSubscriptionId: subscriptionId,
          stripeCustomerId: customerId,
          action: 'skipped',
          detail: `invoice=${invoice.id}_no_local_subscription`,
        }),
      );
      return;
    }

    await this.upsertSubscriptionFromStripe(sub, row.userId, customerId);
    const sync = await this.syncUserFromStripeSubscription(sub);
    this.logStripeWebhookOutcome(
      'invoice.payment_succeeded',
      sub,
      customerId,
      sync,
      'invoice_sync',
    );
  }

  async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    const subscriptionId =
      typeof invoice.subscription === 'string'
        ? invoice.subscription
        : invoice.subscription && typeof invoice.subscription !== 'string'
          ? invoice.subscription.id
          : null;

    if (!subscriptionId) {
      this.logger.warn(
        formatStripeWebhookSummary({
          eventType: 'invoice.payment_failed',
          action: 'skipped',
          detail: `invoice=${invoice.id}_no_subscription`,
        }),
      );
      return;
    }

    const stripe = this.getClient();
    if (!stripe) return;

    let sub: Stripe.Subscription;
    try {
      sub = await stripe.subscriptions.retrieve(subscriptionId);
    } catch (e: unknown) {
      this.logger.error(
        formatStripeWebhookSummary({
          eventType: 'invoice.payment_failed',
          stripeSubscriptionId: subscriptionId,
          action: 'error',
          detail: 'stripe_retrieve_failed',
        }) + ` err=${e instanceof Error ? e.message : String(e)}`,
      );
      return;
    }

    const row = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscriptionId },
    });
    if (!row) {
      this.logger.warn(
        formatStripeWebhookSummary({
          eventType: 'invoice.payment_failed',
          stripeSubscriptionId: subscriptionId,
          action: 'skipped',
          detail: `invoice=${invoice.id}_no_local_subscription`,
        }),
      );
      return;
    }

    const customerId =
      typeof sub.customer === 'string'
        ? sub.customer
        : sub.customer && !sub.customer.deleted
          ? sub.customer.id
          : row.stripeCustomerId;

    await this.upsertSubscriptionFromStripe(sub, row.userId, customerId);

    if (stripeStatusShouldRevokePremium(sub.status)) {
      const sync = await this.syncUserFromStripeSubscription(sub);
      this.logStripeWebhookOutcome(
        'invoice.payment_failed',
        sub,
        customerId,
        sync,
        'invoice_sync_revoked',
      );
      return;
    }

    if (sub.status === 'active') {
      await this.prisma.subscription.update({
        where: { id: row.id },
        data: { status: 'PAST_DUE' },
      });
      const sync = await this.syncUserFromStripeSubscription(sub);
      this.logger.warn(
        formatStripeWebhookSummary({
          eventType: 'invoice.payment_failed',
          stripeSubscriptionId: sub.id,
          stripeCustomerId: customerId ?? undefined,
          userId: row.userId,
          internalSubStatus: 'PAST_DUE',
          userPlan: sync.kind === 'user_updated' || sync.kind === 'user_unchanged' ? sync.plan : undefined,
          userPlanType:
            sync.kind === 'user_updated' || sync.kind === 'user_unchanged'
              ? sync.planType ?? undefined
              : undefined,
          action: 'invoice_sync_past_due_keeps_premium',
          detail: `invoice=${invoice.id}`,
        }),
      );
      return;
    }

    const sync = await this.syncUserFromStripeSubscription(sub);
    this.logStripeWebhookOutcome(
      'invoice.payment_failed',
      sub,
      customerId,
      sync,
      'invoice_sync',
    );
  }

  /**
   * Cancela na Stripe: padrão `cancel_at_period_end=true` (recomendado).
   * Atualiza o banco após resposta da API; webhooks refinam o estado.
   */
  async cancelSubscriptionForUser(userId: string, immediately = false) {
    const stripe = this.getClient();
    if (!stripe) throw new BadRequestException('Stripe não configurado');

    const row = await this.prisma.subscription.findFirst({
      where: {
        userId,
        stripeSubscriptionId: { not: null },
        status: { notIn: ['CANCELED'] },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!row?.stripeSubscriptionId) {
      throw new NotFoundException('Nenhuma assinatura ativa encontrada para cancelar');
    }

    const subId = row.stripeSubscriptionId;
    const stripeMode = this.getStripeMode();

    if (immediately) {
      try {
        await stripe.subscriptions.cancel(subId);
      } catch (e: unknown) {
        this.logger.error(`cancel imediato Stripe sub=${subId}: ${e}`);
        throw new BadRequestException(
          'Não foi possível cancelar a assinatura na Stripe. Tente novamente.',
        );
      }
      try {
        const fresh = await stripe.subscriptions.retrieve(subId, {
          expand: ['items.data.price'],
        });
        await this.upsertSubscriptionFromStripe(fresh, userId, row.stripeCustomerId ?? null);
        const syncCancel = await this.syncUserFromStripeSubscription(fresh);
        this.logStripeWebhookOutcome(
          'cancel.immediate_api',
          fresh,
          row.stripeCustomerId,
          syncCancel,
          'upserted',
        );
      } catch {
        this.logger.warn(
          `cancel imediato sub=${subId}: objeto removido na Stripe; aguardando webhook customer.subscription.deleted`,
        );
      }
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true, planType: true },
      });
      return {
        ok: true as const,
        strategy: 'immediate' as const,
        stripeMode,
        message:
          'Cancelamento imediato enviado à Stripe. O usuário pode voltar a FREE assim que a assinatura for encerrada (webhook `customer.subscription.deleted` confirma).',
        subscription: {
          stripeSubscriptionId: subId,
        },
        user: { plan: user?.plan ?? null, planType: user?.planType ?? null },
        nextSteps: [
          'Aguarde webhooks `customer.subscription.updated` / `deleted`.',
          'Confira `GET /v1/billing/subscription/me` ou `POST /v1/billing/subscription/sync`.',
        ],
      };
    }

    await stripe.subscriptions.update(subId, { cancel_at_period_end: true });
    const fresh = await stripe.subscriptions.retrieve(subId);
    await this.upsertSubscriptionFromStripe(fresh, userId, row.stripeCustomerId ?? null);
    const syncEnd = await this.syncUserFromStripeSubscription(fresh);
    this.logStripeWebhookOutcome(
      'cancel.at_period_end_api',
      fresh,
      row.stripeCustomerId,
      syncEnd,
      'updated',
    );

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, planType: true },
    });

    const currentPeriodEnd = fresh.current_period_end
      ? new Date(fresh.current_period_end * 1000).toISOString()
      : null;

    return {
      ok: true as const,
      strategy: 'cancel_at_period_end' as const,
      stripeMode,
      message:
        'Cancelamento agendado: a assinatura permanece ativa até o fim do período pago. O acesso premium segue até lá.',
      subscription: {
        stripeSubscriptionId: fresh.id,
        status: mapStripeSubscriptionStatus(fresh.status),
        cancelAtPeriodEnd: fresh.cancel_at_period_end,
        currentPeriodEnd,
      },
      user: { plan: user?.plan ?? null, planType: user?.planType ?? null },
      nextSteps: [
        'Webhooks `customer.subscription.updated` podem refinar `cancelAtPeriodEnd` em segundos.',
        'Após o período, `customer.subscription.deleted` define usuário FREE.',
        'Use `GET /v1/billing/subscription/me` para o estado atual.',
      ],
    };
  }

  /**
   * Re-sincroniza assinatura local com `stripe.subscriptions.retrieve`.
   */
  async syncSubscriptionFromStripeForUser(userId: string) {
    const stripe = this.getClient();
    if (!stripe) throw new BadRequestException('Stripe não configurado');

    const row = await this.prisma.subscription.findFirst({
      where: { userId, stripeSubscriptionId: { not: null } },
      orderBy: { updatedAt: 'desc' },
    });
    if (!row?.stripeSubscriptionId) {
      throw new NotFoundException(
        'Nenhuma assinatura com stripeSubscriptionId vinculada a este usuário.',
      );
    }

    const before = {
      status: row.status,
      cancelAtPeriodEnd: row.cancelAtPeriodEnd,
      currentPeriodEnd: row.currentPeriodEnd?.toISOString() ?? null,
    };

    let fresh: Stripe.Subscription;
    try {
      fresh = await stripe.subscriptions.retrieve(row.stripeSubscriptionId);
    } catch (e: unknown) {
      this.logger.error(`sync: retrieve falhou sub=${row.stripeSubscriptionId}: ${e}`);
      throw new BadRequestException('Não foi possível consultar a assinatura na Stripe.');
    }

    await this.upsertSubscriptionFromStripe(fresh, userId, row.stripeCustomerId ?? null);
    const syncManual = await this.syncUserFromStripeSubscription(fresh);
    this.logStripeWebhookOutcome(
      'manual.subscription_sync',
      fresh,
      row.stripeCustomerId,
      syncManual,
      'synced',
    );

    const after = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: row.stripeSubscriptionId },
    });
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, planType: true },
    });

    return {
      ok: true as const,
      stripeMode: this.getStripeMode(),
      message: 'Registro local alinhado com a Stripe.',
      stripeSubscriptionId: fresh.id,
      stripeStatus: fresh.status,
      before,
      after: {
        status: after?.status,
        cancelAtPeriodEnd: after?.cancelAtPeriodEnd,
        currentPeriodEnd: after?.currentPeriodEnd?.toISOString() ?? null,
      },
      user: { plan: user?.plan ?? null, planType: user?.planType ?? null },
      note: 'Webhooks seguem sendo a fonte contínua de verdade; use sync para correções pontuais.',
    };
  }

  /**
   * Sessão do Stripe Customer Portal (gerenciar assinatura, método de pagamento, etc.).
   * Requer portal ativado no Dashboard Stripe e `stripeCustomerId` local.
   */
  async createBillingPortalSession(userId: string, returnUrl?: string) {
    const stripe = this.getClient();
    if (!stripe) throw new BadRequestException('Stripe não configurado');

    const row = await this.prisma.subscription.findFirst({
      where: { userId, stripeCustomerId: { not: null } },
      orderBy: { updatedAt: 'desc' },
    });
    if (!row?.stripeCustomerId) {
      throw new NotFoundException(
        'Cliente Stripe não encontrado. Conclua um checkout de assinatura antes de abrir o portal.',
      );
    }

    const return_url =
      returnUrl?.trim() ||
      this.config.get<string>('WEB_URL')?.trim() ||
      this.config.get<string>('APP_URL_WEB')?.trim() ||
      'http://localhost:3000';

    let session: Stripe.Response<Stripe.BillingPortal.Session>;
    try {
      session = await stripe.billingPortal.sessions.create({
        customer: row.stripeCustomerId,
        return_url,
      });
    } catch (e: unknown) {
      this.rethrowStripeAsServiceUnavailable('billingPortal.sessions.create', e);
    }

    if (!session.url) {
      throw new BadRequestException('Stripe não retornou URL do Billing Portal.');
    }

    this.logger.log(
      `Customer Portal: userId=${userId} customer=${row.stripeCustomerId} mode=${this.getStripeMode()}`,
    );

    return {
      ok: true as const,
      stripeMode: this.getStripeMode(),
      url: session.url,
      message:
        'Redirecione o usuário autenticado para `url` no navegador. O retorno usa `return_url`.',
    };
  }
}
