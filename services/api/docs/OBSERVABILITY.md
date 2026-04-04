# Observabilidade mínima — billing / Stripe

## Logs úteis (já existentes no código)

- Subida: `[Stripe] Integração ativa · modo=TEST|LIVE` — confirma ambiente sem expor segredos.
- Webhook: `StripeController` + `console` de diagnóstico + idempotência gravada.
- Cancel / sync / portal: logs com `userId`, `stripeSubscriptionId`, `customer` (IDs Stripe são aceitáveis).

## O que não logar

- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, JWT secrets.
- Corpo bruto completo de webhooks em produção (já há raw só na rota de assinatura).

## Falhas de billing

1. **Stripe Dashboard → Webhooks** — filtrar por endpoint; inspecionar respostas HTTP da API.
2. **Tabela `StripeWebhookEvent`** — evento gravado só após handler OK; ausência pode indicar erro antes do `recordWebhookHandled`.
3. **`POST /v1/billing/subscription/sync`** — correção pontual usuário × Stripe.

## Divergência Stripe × banco

- Comparar status da subscription no Dashboard com `Subscription.status` e `User.plan`.
- Reprocessar: sync manual ou reenviar evento de teste (somente não-prod).
