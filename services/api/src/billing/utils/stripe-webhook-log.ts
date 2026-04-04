/**
 * Formato único de log para webhooks Stripe (Fase 3 — observabilidade).
 * Nunca incluir segredos, tokens ou corpos completos de evento.
 */
export type StripeWebhookSummary = {
  /** Tipo do evento Stripe, ex. customer.subscription.updated */
  eventType: string;
  /** id do evento evt_... (opcional; o controller já loga duplicatas) */
  eventId?: string;
  stripeSubscriptionId?: string | null;
  stripeCustomerId?: string | null;
  userId?: string | null;
  /** Status persistido em `Subscription.status` (Prisma) após o handler */
  internalSubStatus?: string | null;
  userPlan?: string | null;
  userPlanType?: string | null;
  /**
   * created | updated | upserted | deleted | invoice_sync | skipped | no-op
   */
  action: string;
  /** Detalhe curto (sem PII sensível) */
  detail?: string;
};

/**
 * Uma linha grep-friendly para dashboards e suporte.
 *
 * Ex.:
 * `[StripeWebhook] event=customer.subscription.updated subscription=sub_xxx user=usr_xxx plan=PREMIUM planType=PERSONAL subStatus=ACTIVE action=updated`
 */
export function formatStripeWebhookSummary(s: StripeWebhookSummary): string {
  const parts: string[] = ['[StripeWebhook]', `event=${s.eventType}`];
  if (s.eventId) parts.push(`evt=${s.eventId}`);
  if (s.stripeSubscriptionId) parts.push(`subscription=${s.stripeSubscriptionId}`);
  if (s.stripeCustomerId) parts.push(`customer=${s.stripeCustomerId}`);
  if (s.userId) parts.push(`user=${s.userId}`);
  if (s.internalSubStatus) parts.push(`subStatus=${s.internalSubStatus}`);
  if (s.userPlan) parts.push(`plan=${s.userPlan}`);
  if (s.userPlan === 'FREE') {
    parts.push('planType=null');
  } else if (s.userPlanType != null && s.userPlanType !== '') {
    parts.push(`planType=${s.userPlanType}`);
  }
  parts.push(`action=${s.action}`);
  if (s.detail) parts.push(`detail=${s.detail}`);
  return parts.join(' ');
}
