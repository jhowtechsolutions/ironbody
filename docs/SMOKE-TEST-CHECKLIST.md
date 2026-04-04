# Smoke test — checklist operacional (IronBody)

Use antes de homologação ou deploy. Marque cada item. **Ambiente:** API + Postgres + web + Stripe test + S3 (quando testar mídia).

## Pré-requisitos

- [ ] `DATABASE_URL` válido; `npx prisma migrate deploy` aplicado na base.
- [ ] API sobe sem erro; JWT/Stripe/AWS conforme `.env`.
- [ ] Frontend: `NEXT_PUBLIC_API_URL` aponta para a API correta.
- [ ] Stripe: webhook `whsec_` alinhado ao `stripe listen` ou endpoint de deploy.

---

## 1. Auth e cadastro

- [ ] **Cadastro** (`/register`): criar usuário ALUNO e PERSONAL; mensagem clara em erro (e-mail duplicado, etc.).
- [ ] **Login** (`/login`): entrar com cada papel; loading visível; erro amigável se credenciais inválidas.

## 2. Dashboards

- [ ] **Dashboard aluno** (`/dashboard/aluno`): carrega; lista de treinos ou mensagem de erro se API falhar.
- [ ] **Dashboard personal** (`/dashboard/personal`): idem.

## 3. Conta e assinatura

- [ ] **Conta aluno** (`/dashboard/aluno/conta`): perfil, card de assinatura; se falhar `users/me` ou `billing/subscription/me`, aparece bloco de erro com “Tentar novamente”.
- [ ] **Conta personal** (`/dashboard/personal/conta`): idem.

## 4. Premium e checkout

- [ ] **Upgrade Premium** (via `UpgradeCard`): botão inicia checkout ou exibe erro claro se Stripe indisponível (HTTP 503 + mensagem).
- [ ] **Checkout Stripe**: concluir pagamento teste; retorno success/cancel coerente com URLs configuradas.
- [ ] **Webhook**: após checkout, `users.plan` / `subscription` atualizam (logs `[StripeWebhook]` sem segredos).

## 5. Customer portal e sync

- [ ] **Customer portal**: usuário PREMIUM com `stripeCustomerId` abre portal; erro claro se ainda não houver cliente Stripe.
- [ ] **Sync manual** (`POST /v1/billing/subscription/sync`): retorno coerente; se sem `stripeSubscriptionId`, 404 esperado com mensagem clara.
- [ ] **Cancelamento**: `cancel_at_period_end` e/ou imediato conforme política; sem estado incoerente após webhook.

## 6. Mídia (S3)

- [ ] **Upload foto evolução** (`/dashboard/aluno/evolucao`): fluxo completo; mensagem de sucesso após confirm.
- [ ] **Upload foto avaliação** (`/dashboard/aluno/avaliacao`): criar avaliação + anexar foto.
- [ ] **Upload mídia exercício** (`/dashboard/personal/exercicio-midia`): vídeo ou GIF; `Exercise.videoUrl`/`gifUrl` atualizados.
- [ ] **Listagem** (`GET /v1/media`): filtros respeitam papel (aluno só o próprio).
- [ ] **Delete** (`DELETE /v1/media/:id`): remove registro; S3 com log de warning se objeto já ausente (delete idempotente no DB).

## 7. Premium gate (rotas)

- [ ] **Rota premium ALUNO** (ex.: `/dashboard/aluno/nutricao` com `PremiumGate`): sem plano correto mostra upgrade; com plano acessa conteúdo.
- [ ] **Rota premium PERSONAL** (ex.: IA treino com gate, se houver): idem para plano Personal.

## 8. API e builds

- [ ] **Health liveness**: `GET /v1/health` → `ok`, `timestamp`, `env`.
- [ ] **Health readiness**: `GET /v1/health/ready` → `database: up` com Postgres OK; sem DB → 503 com corpo JSON estruturado.
- [ ] **Build frontend**: `npm run build -w ironbody-web` sem erros.
- [ ] **Build backend**: `npm run build -w ironbody-api` (ou `nest build` em `services/api`) sem erros.

## 9. Erros da API (amostra)

- [ ] Resposta JSON inclui `statusCode`, `message`, `path`, `timestamp` em erro tratado (filtro global).
- [ ] Validação (`class-validator`) retorna 400 com mensagens legíveis.

---

**Tempo estimado:** 45–90 min (com Stripe test e S3 reais).
