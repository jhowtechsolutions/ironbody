# Stripe — Validação de eventos e ciclo de assinatura (Fase 3)

Documento operacional para **IronBody API** (`services/api`). Código principal: `src/billing/stripe.service.ts`, `src/billing/stripe.controller.ts`, `src/billing/utils/stripe-maps.ts`, `src/billing/utils/stripe-webhook-log.ts`.

---

## 1. Idempotência

- Cada evento Stripe tem `id` único (`evt_...`).
- Após o handler concluir **sem erro**, o controller grava em `StripeWebhookEvent` (`recordWebhookHandled`).
- Se o mesmo `evt_` chegar de novo → resposta `{ received: true, duplicate: true }` e **não reprocessa**.
- Se o handler **falhar**, a linha **não** é gravada → a Stripe pode retentar (comportamento desejado).
- `subscription` no banco: **upsert** por `stripeSubscriptionId` (único) — evita duplicar assinatura para o mesmo `sub_`.

**Nunca** colocar `STRIPE_WEBHOOK_SECRET`, `STRIPE_SECRET_KEY` ou payloads completos em logs.

---

## 2. Eventos tratados e efeito esperado

| Evento Stripe | Handler | Linha `Subscription` | `users.plan` / `planType` |
|---------------|---------|----------------------|---------------------------|
| `checkout.session.completed` | `handleCheckoutSessionCompleted` | Upsert a partir da subscription recuperada na API | PREMIUM se status Stripe ∈ elegíveis* |
| `customer.subscription.created` | `handleSubscriptionCreated` | Upsert | Idem |
| `customer.subscription.updated` | `handleSubscriptionUpdated` | Upsert (status, períodos, trial, cancel…) | PREMIUM ou FREE conforme regras* |
| `customer.subscription.deleted` | `handleSubscriptionDeleted` | `status=CANCELED`, `canceledAt` | `FREE`, `planType=null` |
| `invoice.payment_succeeded` | `handleInvoicePaymentSucceeded` | Upsert após `retrieve` subscription | Reforça PREMIUM quando aplicável |
| `invoice.payment_failed` | `handleInvoicePaymentFailed` | Upsert; se Stripe ainda `active` → DB pode ir a `PAST_DUE` | Se status revoga premium** → FREE; se `active` → mantém PREMIUM até próximo evento |

\* **Elegível para PREMIUM** (`stripeStatusKeepsPremium`): `trialing`, `active`, `past_due`, `paused`.  
\** **Revoga premium** (`stripeStatusShouldRevokePremium`): `canceled`, `incomplete_expired`, `unpaid`.

- Status Stripe `incomplete` (checkout em andamento): **não** promove usuário a PREMIUM (`syncUserFromStripeSubscription` retorna `skipped_incomplete`).

### Correlation de usuário

- **Checkout:** `client_reference_id` = `userId`; fallback `metadata.userId` na session ou na subscription.
- **Subscription created:** `metadata.userId`; fallback assinatura anterior com mesmo `stripeCustomerId`.

---

## 3. Mapeamentos centrais (`stripe-maps.ts`)

- **Stripe → `SubscriptionStatus` (Prisma):** `mapStripeSubscriptionStatus` (ex.: `past_due` → `PAST_DUE`, `incomplete_expired` → `CANCELED`).
- **`planType` (PERSONAL | ALUNO):** `resolveSubscriptionPlanType` — prioridade `price.id` vs `STRIPE_PERSONAL_PRICE_ID` / `STRIPE_ALUNO_PRICE_ID`, depois `metadata.plan`.

---

## 4. Formato de log padronizado

Linhas úteis para grep:

```text
[StripeWebhook] event=<tipo> subscription=sub_xxx customer=cus_xxx user=<userId> subStatus=<Prisma enum> plan=PREMIUM|FREE planType=PERSONAL|ALUNO|null action=<created|updated|upserted|deleted|invoice_sync|...>
```

- **Controller (entrada):** `[StripeWebhook] evt=<id> event=<tipo> action=processing` → após sucesso `action=recorded_idempotency`.
- **Duplicado:** `action=duplicate_ignored`.
- **Erro no handler:** `action=handler_error detail=<mensagem curta>` — sem corpo do evento nem segredos.

Rotas **API** (não webhook) usam o mesmo prefixo para correlacionar, ex.: `manual.subscription_sync`, `cancel.at_period_end_api`.

---

## 5. Como testar com Stripe CLI

Terminal API (ex. porta 3001):

```bash
cd services/api && npm run start:dev
```

Outro terminal:

```bash
stripe listen --forward-to localhost:3001/v1/stripe/webhook
```

Copie o **Signing secret** (`whsec_...`) para `STRIPE_WEBHOOK_SECRET` e reinicie a API.

Disparar eventos de teste (exemplos):

```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed
stripe trigger customer.subscription.deleted
```

Para cenários **com assinatura real** do seu usuário de teste, use Checkout no app ou Dashboard Stripe e observe os logs e o banco.

---

## 6. O que verificar no banco

No **Prisma Studio** (`npx prisma studio`):

| Tabela | Campos |
|--------|--------|
| `User` | `plan`, `planType` |
| `Subscription` | `stripeSubscriptionId`, `stripeCustomerId`, `status`, períodos, `trialEnd`, `cancelAtPeriodEnd`, `canceledAt` |
| `StripeWebhookEvent` | `id` (= `evt_...`), `type`, `createdAt` |

Após cada teste, conferir também:

- `GET /v1/users/me` (JWT)
- `GET /v1/billing/subscription/me`

---

## 7. Troubleshooting

| Sintoma | Verificar |
|---------|-----------|
| 400 no webhook | `STRIPE_WEBHOOK_SECRET` bate com o `stripe listen` atual; rota usa `express.raw` em `main.ts` |
| Usuário não vira PREMIUM | Logs `skipped` / `missing_userId`; metadata `userId` na subscription; `checkout` com `client_reference_id` |
| Duas assinaturas lógicas | Upsert é por `stripeSubscriptionId`; conferir se há dois `sub_` diferentes no Stripe para o mesmo cliente |
| `invoice.*` sem efeito | Invoice sem `subscription` vinculada é ignorado (log `skipped`) |
| Portal não abre | `stripeCustomerId` preenchido após checkout; ver `POST /v1/billing/customer-portal` |

---

## 8. Checklist de testes manuais

### Teste A — Pagamento inicial

1. Login (JWT).
2. `POST /v1/billing/checkout-session` com plano PERSONAL ou ALUNO.
3. Pagar no Checkout (cartão de teste Stripe).
4. Validar: logs `[StripeWebhook]` em sequência; `User.plan=PREMIUM`; `Subscription` preenchida; `GET /v1/users/me` e `/billing/subscription/me`.

### Teste B — Cancelamento (`cancel_at_period_end`)

1. `POST /v1/billing/subscription/cancel` (body vazio ou `{ "immediately": false }`).
2. Validar: `cancelAtPeriodEnd=true` na Stripe e no DB; usuário ainda PREMIUM até fim do período; logs `cancel.at_period_end_api` e webhooks `customer.subscription.updated`.

### Teste C — Sync manual

1. Anotar `Subscription` + `User` antes.
2. `POST /v1/billing/subscription/sync`.
3. Comparar resposta JSON `before` / `after` e estado no banco; log `manual.subscription_sync`.

### Teste D — `invoice.payment_failed`

1. Simular: Stripe CLI `stripe trigger invoice.payment_failed` **ou** no Dashboard (test clock / assinatura de teste com falha).
2. Esperado: conforme status da subscription após `retrieve` — se ainda `active`, DB pode marcar `PAST_DUE` e **manter** PREMIUM; se `unpaid`/etc., revogar premium. Conferir log `invoice_sync_past_due_keeps_premium` vs `invoice_sync_revoked`.

### Teste E — `customer.subscription.deleted`

1. Cancelamento imediato na API **ou** encerrar assinatura no Dashboard / `stripe trigger customer.subscription.deleted` com contexto coerente.
2. Esperado: `Subscription.status=CANCELED`; `User` FREE; log `action=deleted`.

### Teste F — Trial → Active

1. Checkout com trial (configurado em `createCheckoutSession`: `trial_period_days`).
2. Validar `TRIALING` no DB e, após avanço de tempo (test clock) ou ciclo, `ACTIVE` e renovação via `invoice.payment_succeeded`.

---

## 9. Critérios de aceite (Fase 3)

- [ ] Todos os eventos da tabela §2 têm handler explícito no `switch` do controller.
- [ ] Logs permitem correlacionar `subscription` + `user` + `plan` sem vazar segredos.
- [ ] Idempotência por `evt_` + upsert por `stripeSubscriptionId`.
- [ ] Downgrade em `customer.subscription.deleted` e em status que revogam premium.
- [ ] Este documento + checklist executados em ambiente local ou staging.

---

## Referências no repositório

- [`services/api/docs/BILLING-PREMIUM.md`](../services/api/docs/BILLING-PREMIUM.md) — guards e matriz de acesso.
- [`services/api/docs/STRIPE-WEBHOOK-CHECKLIST.md`](../services/api/docs/STRIPE-WEBHOOK-CHECKLIST.md) — porta, `stripe listen`, erro 400.
- [`docs/PROJECT-ROADMAP.md`](PROJECT-ROADMAP.md) — Fase 3 no roadmap.
- [`docs/MONETIZATION-CHECKLIST.md`](MONETIZATION-CHECKLIST.md) — checklist de monetização.
