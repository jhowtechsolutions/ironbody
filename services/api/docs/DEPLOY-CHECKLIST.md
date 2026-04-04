# Checklist de deploy — IronBody API

## Pré-requisitos

- [ ] Conta PostgreSQL (managed ou self-hosted) com SSL em produção.
- [ ] Domínio e certificados HTTPS para `api.*` e app web.
- [ ] Conta Stripe **Live** com produtos/preços e **Customer Portal** habilitado (para `POST /v1/billing/customer-portal`).
- [ ] Segredos fora do Git (GitHub Actions secrets, Vault, painel do PaaS, etc.).

## Banco (Prisma)

- [ ] Definir `DATABASE_URL` no ambiente de deploy.
- [ ] **Nunca** rodar `prisma migrate dev` em produção.
- [ ] Rodar **`npx prisma migrate deploy`** em cada release (CI/CD ou container entrypoint).
- [ ] Opcional: `npx prisma db seed` só em ambientes não-prod ou com critério explícito.

## API

- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` e `JWT_REFRESH_SECRET` fortes e únicos.
- [ ] `CORS_ORIGINS` com origens exatas do frontend (ex.: `https://ironbody.app`).
- [ ] `APP_URL_API` = URL pública da API (ex.: `https://api.ironbody.app`).
- [ ] `WEB_URL` / `APP_URL_WEB` alinhados ao frontend.
- [ ] Stripe **live** keys + **webhook** live apontando para `POST /v1/stripe/webhook` com body **raw**.
- [ ] Healthcheck: `GET /v1/health`.

## Docker (opcional)

```bash
cd services/api
docker compose build
# Primeira vez / após migrações:
docker compose run --rm api npx prisma migrate deploy
docker compose up -d
```

Ajuste variáveis em `docker-compose.yml` ou use `env_file`.

## Pós-deploy

- [ ] `GET https://api.ironbody.app/v1/health` → `{ "ok": true }`
- [ ] Swagger só se desejado exposto (considere proteger em prod).
- [ ] Teste checkout test em staging; smoke test live com valor mínimo após go-live.

## Observabilidade

- [ ] Logs de aplicação centralizados (sem imprimir segredos ou bodies completos de webhook).
- [ ] Alertas para taxa de erro 5xx e falhas repetidas de webhook (Stripe Dashboard → Webhooks → entregas).

## Divergência Stripe × banco

- Usuário pode chamar `POST /v1/billing/subscription/sync` (autenticado).
- Operacional: comparar eventos recentes no Stripe com tabela `StripeWebhookEvent` e `Subscription`.
