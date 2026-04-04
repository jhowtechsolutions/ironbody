# IronBody - Configuração de Serviços Externos

Preencha as credenciais nos arquivos `.env` de cada app. **Nunca commite `.env` com chaves reais.**

## 1. Stripe
- Dashboard: https://dashboard.stripe.com | Modo: TEST
- Planos: PERSONAL (ex. R$ 49,90/mês), ALUNO (ex. R$ 19,90/mês)
- **Checkout:** `POST /v1/billing/checkout-session` (auth JWT). Body: `{ "plan": "PERSONAL" | "ALUNO", "successUrl?", "cancelUrl?" }`. Resposta: `{ id, url }` → redirecionar o usuário para `url`.
- **Assinatura atual:** `GET /v1/billing/subscription/me` (JWT) — plano, `planType` e dados da assinatura Stripe sincronizados.
- **Webhook:** `POST /v1/stripe/webhook` (body raw). Eventos: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_succeeded` / `payment_failed`. Idempotência via tabela `StripeWebhookEvent`.
- **Docs:** `services/api/docs/BILLING-PREMIUM.md`
- **Produção / env:** `services/api/docs/ENVIRONMENTS.md`, `DEPLOY-CHECKLIST.md`, `STRIPE-LIVE-CHECKLIST.md`
- **Health:** `GET /v1/health`
- **Re-sync:** `POST /v1/billing/subscription/sync` (JWT)
- **Customer Portal:** `POST /v1/billing/customer-portal` (JWT, body opcional `{ "returnUrl" }`)
- **Observabilidade:** `services/api/docs/OBSERVABILITY.md`
- Variáveis: `STRIPE_SECRET_KEY`, `STRIPE_PUBLIC_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PERSONAL_PRICE_ID`, `STRIPE_ALUNO_PRICE_ID`, `WEB_URL`, `MOBILE_SCHEME`
- **Reiniciar backend** após alterar `.env`: na pasta `services/api` rode `npm run dev` ou `npm run start:dev`.
- **Testar webhook localmente:** (1) Em um terminal: `stripe listen --forward-to localhost:3001/v1/stripe/webhook` e use o `whsec_...` que aparecer no `STRIPE_WEBHOOK_SECRET` do `.env`. (2) Em outro terminal: `stripe trigger checkout.session.completed` — o backend deve receber o evento.

## 2. AWS S3 (região sa-east-1)
- Buckets: IronBody-media, IronBody-videos, IronBody-photos
- Variáveis: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET_*`

## 3. Agora (videochamada)
- Dashboard: https://console.agora.io
- Variáveis: `AGORA_APP_ID`, `AGORA_APP_CERTIFICATE`

## 4. SendGrid (e-mail)
- Variáveis: `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME`

## 5. OpenAI
- Modelo: gpt-4.1-mini ou gpt-4o-mini
- Variáveis: `OPENAI_API_KEY`, `OPENAI_MODEL`

## 6. Banco
- Supabase ou PostgreSQL. Variável: `DATABASE_URL`

## 7. App
- `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `APP_URL_WEB`, `APP_URL_API`
