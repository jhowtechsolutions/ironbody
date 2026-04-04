# 💰 Monetização — Checklist completo

Roadmap geral do projeto: [`docs/PROJECT-ROADMAP.md`](PROJECT-ROADMAP.md).

Documentação técnica detalhada da API: [`services/api/docs/BILLING-PREMIUM.md`](../services/api/docs/BILLING-PREMIUM.md).

---

## ✅ Fase 1 — Proteção premium (concluída)

- [x] Criar guards:
  - [x] `JwtAuthGuard`
  - [x] `RolesGuard`
  - [x] `PremiumGuard`
  - [x] `PlanTypeGuard`
- [x] Aplicar guards nas rotas (ex.: `AiController`)
- [x] Validar fluxo no Swagger
- [x] Criar usuários de teste:
  - [x] aluno.free
  - [x] aluno.premium
  - [x] personal.free
  - [x] personal.premium
- [x] Validar matriz de acesso (`POST /v1/ai/workout/generate`)
- [x] Integração Stripe funcional (checkout, webhooks, sync)
- [x] Webhook funcionando (local com Stripe CLI + `STRIPE_WEBHOOK_SECRET`)

---

## ✅ Fase 2 — UI premium (concluída funcionalmente)

Checklist detalhado: [`apps/web/docs/SUBSCRIPTION-UI.md`](../apps/web/docs/SUBSCRIPTION-UI.md).

- [x] `SubscriptionContext` + `useSubscription` + `billingApi`
- [x] `PlanBadge`, `UpgradeCard`, `PremiumGate`, `SubscriptionStatusCard`, `DashboardPlanSection`
- [x] Checkout (`POST /v1/billing/checkout-session`) e retorno `upgrade/success`
- [x] Customer Portal na UI (`POST /v1/billing/customer-portal`)
- [x] Páginas conta aluno/personal + gates (IA / nutrição)
- [x] Documentação `SUBSCRIPTION-UI.md`

**Pendência técnica (estabilização / Fase 5 no cronograma):** `next build` / prerender (`styled-jsx` / `useContext`). Não invalida a entrega funcional da UI.

---

## ✅ Fase 3 — Stripe ciclo completo (**concluída no código v2**)

Implementação: handlers completos, logs `[StripeWebhook]`, idempotência, sync de utilizador, docs operacionais. **Stripe LIVE** e revalidação periódica ficam para a Fase 6 / operação.

**Guia operacional:** [`docs/STRIPE-EVENTS-VALIDATION.md`](STRIPE-EVENTS-VALIDATION.md)

- [x] Eventos: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`
- [x] Idempotência (`StripeWebhookEvent`) + upsert por `stripeSubscriptionId`
- [x] Matriz e testes manuais documentados
- [ ] (Contínuo / Fase 6) Validar E2E com **Stripe LIVE** e webhook HTTPS

---

## 🔄 Deploy produção (alinhado à **Fase 6** do `CRONOGRAMA-DASHBOARD.html`)

- [ ] Domínio:
  - [ ] `ironbody.app`
  - [ ] `api.ironbody.app`
- [ ] HTTPS configurado
- [ ] Variáveis de ambiente:
  - [ ] `STRIPE_SECRET_KEY` (live)
  - [ ] `STRIPE_WEBHOOK_SECRET` (live)
  - [ ] `DATABASE_URL`
  - [ ] `JWT_SECRET`
- [ ] `prisma migrate deploy`
- [ ] Docker rodando (se aplicável)
- [ ] Healthcheck OK (`GET /v1/health`)

---

## 📊 Métricas futuras

- Conversão FREE → PREMIUM
- Churn rate
- Tempo médio de retenção
- Uso de features premium

---

## 🧠 Observações

- Sempre validar `plan` + `planType` no backend.
- Nunca confiar só no frontend.
- Webhook + estado na Stripe são fonte de verdade para assinatura; o sync alinha o DB.

---

## 🚀 Próximo movimento sugerido

1. Corrigir **`next build`** do frontend (bloqueador — Fase 5).  
2. **AWS S3** (Fase 4).  
3. Hardening → **Produção** + Stripe LIVE.

Ver também: [`docs/PROJECT-ROADMAP.md`](PROJECT-ROADMAP.md) (v2) e [`CRONOGRAMA-DASHBOARD.html`](../CRONOGRAMA-DASHBOARD.html).
