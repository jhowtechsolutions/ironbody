/**
 * Estado de assinatura e billing (requer `SubscriptionProvider` no `_app`).
 *
 * Retorno inclui:
 * - `plan` / `planType` / `subscription` — derivados de `GET /users/me` + `GET /billing/subscription/me`
 * - `profile`, `billing` — payloads brutos
 * - `refresh()` — recarrega ambos os endpoints
 * - `startCheckout({ plan, returnBasePath })` — Stripe Checkout
 * - `openCustomerPortal({ returnPath })` — Stripe Customer Portal (só faz sentido para PREMIUM com cliente Stripe)
 */
export { useSubscription } from '@/contexts/SubscriptionContext';
