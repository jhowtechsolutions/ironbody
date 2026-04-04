# Ambientes — IronBody API

## Variáveis principais

| Variável | Descrição |
|----------|-----------|
| `NODE_ENV` | `development` \| `production` |
| `PORT` | Porta HTTP (default 3001) |
| `DATABASE_URL` | PostgreSQL (Prisma) |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Assinatura dos tokens |
| `APP_URL_WEB` | Origem do frontend (CORS se `CORS_ORIGINS` vazio) |
| `APP_URL_API` | URL pública da API (logs / documentação) |
| `WEB_URL` | Base para URLs de checkout / portal quando não enviadas no body |
| `CORS_ORIGINS` | Lista separada por vírgula; sobrescreve uso único de `APP_URL_WEB` |
| `STRIPE_SECRET_KEY` | `sk_test_…` ou `sk_live_…` — o prefixo define o modo (log na subida) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` do endpoint de webhook **do mesmo modo** (test/live) |
| `STRIPE_*_PRICE_ID` | Price IDs do **mesmo** modo Stripe |

## Arquivos de exemplo no repositório

- **`.env.example`** — referência completa.
- **`.env.development`** — valores típicos de desenvolvimento local.
- **`.env.production`** — **placeholders apenas**; segredos vêm do provedor de deploy.

O Nest carrega `.env` na raiz de `services/api` (padrão `@nestjs/config`). Você pode copiar:

```bash
cp .env.example .env
# ou
cp .env.development .env
```

## Produção (URLs alvo)

- Frontend: `https://ironbody.app`
- API: `https://api.ironbody.app`

Configure `CORS_ORIGINS` e `APP_URL_*` / `WEB_URL` de acordo. Se `NODE_ENV=production` e não houver `CORS_ORIGINS` nem `APP_URL_WEB`, o código usa fallback `https://ironbody.app` para CORS (veja `src/config/cors.ts`) — **ajuste para o seu domínio real**.

## Alternância Test ↔ Live

1. Troque **todas** as variáveis Stripe (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_*_PRICE_ID`, e no frontend `STRIPE_PUBLIC_KEY` / chaves públicas).
2. Webhook no Dashboard Stripe deve apontar para `https://api.ironbody.app/v1/stripe/webhook` com o **signing secret** desse endpoint (não use o do Stripe CLI).
3. Reinicie a API e confira o log: `[Stripe] Integração ativa · modo=TEST` ou `LIVE`.

Detalhes: `STRIPE-LIVE-CHECKLIST.md`.

## Frontend (web)

Exemplo de variáveis de produção: `apps/web/.env.production.example` (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`).
