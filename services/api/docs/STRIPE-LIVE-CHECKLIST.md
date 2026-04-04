# Stripe Live — checklist IronBody

## Conta e modo

- [ ] Ativar modo **Live** no Dashboard Stripe (toggle).
- [ ] Criar produtos/preços **live** equivalentes aos de teste.
- [ ] Anotar `price_…` live para `STRIPE_PERSONAL_PRICE_ID` e `STRIPE_ALUNO_PRICE_ID`.

## Chaves de API

- [ ] `STRIPE_SECRET_KEY` = `sk_live_…` na API (variável de ambiente segura).
- [ ] `STRIPE_PUBLIC_KEY` = `pk_live_…` no frontend / apps mobile.
- [ ] Reiniciar serviços após trocar chaves.

## Webhook de produção

1. Developers → Webhooks → **Add endpoint**.
2. URL: `https://api.ironbody.app/v1/stripe/webhook` (HTTPS obrigatório).
3. Eventos recomendados (mínimo alinhado ao código):
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copiar **Signing secret** (`whsec_…`) → `STRIPE_WEBHOOK_SECRET` **live**.
5. **Não** usar o `whsec` do `stripe listen` em produção.

## Raw body

A API já aplica `express.raw` apenas em `/v1/stripe/webhook`. Proxies (nginx, load balancer) não devem alterar o body nem remover o header `Stripe-Signature`.

## Customer Portal

1. Settings → **Billing** → **Customer portal** → ativar e configurar (cancelamento, atualização de método de pagamento, etc.).
2. Rota: `POST /v1/billing/customer-portal` (JWT) — retorna `url` para redirecionar o usuário.
3. `return_url` no body ou fallback `WEB_URL` / `APP_URL_WEB`.

## Logs

Na subida da API, verificar:

```text
[Stripe] Integração ativa · modo=LIVE (prefixo sk_test_ / sk_live_)
```

Se aparecer `TEST` com chave que deveria ser live, a variável está incorreta.

## Teste controlado pós go-live

- [ ] Checkout real com cartão de teste **não** funciona em live — usar cartão real ou fluxo de valor mínimo conforme política do produto.
- [ ] Confirmar evento entregue no Dashboard → Webhooks.
- [ ] `GET /v1/billing/subscription/me` reflete `PREMIUM` após pagamento.

## Rollback Test

Para voltar a teste: reverter **todas** as env Stripe para `sk_test_`, `whsec_` de teste e price IDs de teste; webhook de produção pode ser desativado ou apontar para staging.
