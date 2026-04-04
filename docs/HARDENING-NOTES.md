# Fase 5 — Hardening (notas operacionais)

## O que foi endurecido

### Backend

- **`AllExceptionsFilter` global:** respostas JSON padronizadas com `statusCode`, `error`, `message`, `path`, `timestamp`. Erros não tratados em produção não expõem stack ao cliente.
- **Health:** `GET /v1/health` — liveness leve (sem I/O externo). `GET /v1/health/ready` — `SELECT 1` no Postgres; falha → 503 com payload descritivo (`database: down`; detalhe técnico só fora de produção).
- **Stripe:** `checkout.sessions.create` e `billingPortal.sessions.create` envolvidos em tratamento de erro da API Stripe → **503** + mensagem genérica ao usuário; log com `type`/`code` Stripe, sem segredos.
- **Mídia:** log em falha de `HeadObject` na confirmação (prefixo de key apenas). **Delete:** se remoção no S3 falhar, registra warning e ainda remove a linha no banco (evita órfão lógico preso à UI; objeto pode ficar no bucket — limpeza operacional separada).

### Frontend

- **Componentes:** `PageLoadingState`, `PageErrorState`, `InlineErrorMessage`, `EmptyState` para padrão de UX.
- **`readErrorMessageFromResponse`:** interpreta JSON de erro da API (campo `message` string ou array).
- **Billing API** e **media API:** erros propagados com mensagem derivada do corpo da resposta.
- **Telas:** login, register, dashboards (aluno/personal), contas (erro de assinatura + retry), evolução/avaliação/mídia exercício usam loading consistente; treinos com erro explícito; `PremiumGate`, `UpgradeCard`, `SubscriptionStatusCard`, `FileUploadField`, `MediaGallery` melhorados (sucesso no upload, lista vazia, retry na galeria).
- **Upload S3 (XHR):** mensagens específicas para 401/403 (URL expirada) vs outros códigos.

### Documentação

- `docs/SMOKE-TEST-CHECKLIST.md` — checklist manual para homologação.
- Este arquivo — decisões e riscos.

## Decisões

- **Readiness depende do Postgres:** adequado para orquestradores que precisam saber se a app aceita tráfego; não inclui Stripe/S3 para manter resposta rápida e evitar flapping por terceiros.
- **Stripe indisponível → 503:** distingue de 400 de configuração (`Stripe não configurado`, price ID faltando).
- **Delete mídia:** prioridade em liberar o usuário no app; inconsistência eventual no bucket é aceita no MVP com log.

## Riscos remanescentes (revisar antes de produção)

- CORS em produção: definir `CORS_ORIGINS` explicitamente (evitar só fallback).
- Next 14.2.0: há aviso de vulnerabilidade conhecida — planejar upgrade de versão patcheado na Fase 6.
- Webhook Stripe: falha no handler retorna 500 → Stripe reenvia; monitorar logs `[StripeWebhook] … handler_error`.
- Buckets S3 públicos vs privados: política de acesso e CORS devem ser revisados por ambiente.
- Rate limiting / WAF: não implementados nesta fase.

## Sanity rápido pós-deploy

1. `GET /v1/health` e `/v1/health/ready`
2. Login + uma rota premium + um fluxo de billing test
3. Um upload e um delete de mídia (se feature ativa)

## Pronto para Fase 6 (produção)?

**Quase:** código e documentação de hardening estão alinhados para deploy **após** checklist de smoke, secrets em secrets manager / CI, HTTPS, e validação em ambiente de staging com Stripe live (ou política de rollout definida).
