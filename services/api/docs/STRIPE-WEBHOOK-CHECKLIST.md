# Checklist — webhook Stripe (ordem)

## PASSO 1 — Porta 3001 ocupada (PowerShell)

```powershell
netstat -ano | findstr :3001
```

Anote o **PID** na última coluna. Depois:

```powershell
taskkill /PID SEU_PID /F
```

Subir a API (`services/api`):

```powershell
npm run start:dev
```

## PASSO 2 — Stripe CLI (obrigatório em local)

Em outro terminal:

```bash
stripe listen --forward-to localhost:3001/v1/stripe/webhook
```

Copie o **Signing secret** (`whsec_...`) para `STRIPE_WEBHOOK_SECRET` no `.env` e **reinicie a API**.

Ao pagar (ou ao testar), no terminal do `stripe listen` devem aparecer eventos, por exemplo:

- `checkout.session.completed`
- `customer.subscription.created`
- `invoice.payment_succeeded`

Se **não aparecer nada** → o encaminhamento não está batendo na sua máquina/porta.

### `stripe listen` mostra `<-- [400] POST .../webhook`

Quase sempre **`STRIPE_WEBHOOK_SECRET` no `.env` ≠ whsec do `stripe listen` atual**.  
Cada nova sessão do `stripe listen` pode gerar um **novo** `whsec_...`: copie para o `.env` e **reinicie a API**.

No terminal da API você verá `❌ Webhook: falha na assinatura...` até alinhar o secret.

## PASSO 3 — Endpoint na API

- Rota: `POST /v1/stripe/webhook`
- Body: **raw** (Buffer) — ver `main.ts` (`express.raw` só nesse path)
- Header: `stripe-signature` — ver `StripeController.handleWebhook`

## PASSO 4 — Logs no terminal da API

Após assinatura válida, a API imprime:

```text
🔥 WEBHOOK RECEBIDO
EVENTO: <tipo>
```

## Teste controlado

1. `stripe listen --forward-to localhost:3001/v1/stripe/webhook`
2. Em outro terminal: `stripe trigger checkout.session.completed`

**Esperado:** as duas linhas 🔥 / EVENTO no terminal da API (e `200` no `stripe listen`).

Se não aparecer → conferir `STRIPE_WEBHOOK_SECRET`, porta 3001 e se a API subiu com o `.env` atual.
