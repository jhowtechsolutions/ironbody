import type Stripe from 'stripe';
import { SubscriptionStatus, BillingPlanType } from '@prisma/client';

/**
 * Regras centrais (Fase 3 — ciclo de vida):
 *
 * - **mapStripeSubscriptionStatus** — persiste o status Stripe na linha `subscriptions`.
 * - **resolveSubscriptionPlanType** — `planType` (PERSONAL | ALUNO) via `STRIPE_*_PRICE_ID` ou metadata.
 * - **stripeStatusKeepsPremium** — usuário permanece PREMIUM (trialing, active, past_due, paused).
 * - **stripeStatusShouldRevokePremium** — usuário vai para FREE (canceled, incomplete_expired, unpaid).
 *
 * Ver também: `docs/STRIPE-EVENTS-VALIDATION.md` (raiz do repo).
 */

/**
 * Mapeia status da assinatura Stripe → enum Prisma `SubscriptionStatus`.
 */
export function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status,
): SubscriptionStatus {
  const map: Partial<Record<Stripe.Subscription.Status, SubscriptionStatus>> = {
    trialing: 'TRIALING',
    active: 'ACTIVE',
    past_due: 'PAST_DUE',
    canceled: 'CANCELED',
    incomplete: 'INCOMPLETE',
    incomplete_expired: 'CANCELED',
    unpaid: 'UNPAID',
    paused: 'PAST_DUE',
  };
  return map[status] ?? 'INCOMPLETE';
}

/**
 * Mapeia `price.id` conhecido → `BillingPlanType` (PERSONAL / ALUNO).
 */
export function resolveBillingPlanTypeFromPriceId(
  priceId: string | null | undefined,
  personalPriceId: string | undefined,
  alunoPriceId: string | undefined,
): BillingPlanType | null {
  if (!priceId) return null;
  if (personalPriceId && priceId === personalPriceId) return 'PERSONAL';
  if (alunoPriceId && priceId === alunoPriceId) return 'ALUNO';
  return null;
}

/** Plano enviado no metadata da subscription (checkout). */
export function billingPlanTypeFromSubscriptionMetadata(
  metadata: Stripe.Metadata | null | undefined,
): BillingPlanType | null {
  const p = metadata?.plan;
  if (p === 'PERSONAL' || p === 'ALUNO') return p;
  return null;
}

export type PlanTypeResolutionSource = 'price' | 'metadata' | 'default';

/**
 * Resolve `planType` com prioridade: price configurado → metadata Stripe → fallback.
 */
export function resolveSubscriptionPlanType(
  priceId: string | null | undefined,
  personalPriceId: string | undefined,
  alunoPriceId: string | undefined,
  metadata: Stripe.Metadata | null | undefined,
): { planType: BillingPlanType; source: PlanTypeResolutionSource } {
  const fromPrice = resolveBillingPlanTypeFromPriceId(
    priceId,
    personalPriceId,
    alunoPriceId,
  );
  if (fromPrice) return { planType: fromPrice, source: 'price' };
  const fromMeta = billingPlanTypeFromSubscriptionMetadata(metadata);
  if (fromMeta) return { planType: fromMeta, source: 'metadata' };
  return { planType: 'PERSONAL', source: 'default' };
}

/** Usuário permanece premium com estes status de assinatura Stripe. */
export function stripeStatusKeepsPremium(status: Stripe.Subscription.Status): boolean {
  return (
    status === 'trialing' ||
    status === 'active' ||
    status === 'past_due' ||
    status === 'paused'
  );
}

/** Remover premium do usuário (cancelado, expirado, não pago). */
export function stripeStatusShouldRevokePremium(
  status: Stripe.Subscription.Status,
): boolean {
  return (
    status === 'canceled' ||
    status === 'incomplete_expired' ||
    status === 'unpaid'
  );
}
