# Assinatura Premium — Web (IronBody)

## Arquitetura

- **`SubscriptionProvider`** (`src/contexts/SubscriptionContext.tsx`): após login, chama em paralelo `GET /v1/users/me` e `GET /v1/billing/subscription/me`, atualiza `syncUserFromServer` no `AuthContext`.
- **`useSubscription()`** (`src/hooks/useSubscription.ts` reexporta o contexto):
  - `plan`, `planType`, `subscription` — valores agregados para a UI
  - `profile`, `billing` — respostas completas
  - `loading`, `error`, `refresh()`
  - `startCheckout({ plan, returnBasePath })`, `checkoutLoading`, `checkoutError`
  - `openCustomerPortal({ returnPath })`, `portalLoading`, `portalError`
- **`billingApi`** (`src/services/billingApi.ts`): `fetchMe`, `fetchSubscription`, `createCheckoutSession`, `createCustomerPortalSession`

## Componentes

| Componente | Uso |
|------------|-----|
| `PlanBadge` | FREE / PREMIUM ALUNO / PREMIUM PERSONAL (`planDisplayLabel`) |
| `UpgradeCard` | CTA + lista de benefícios + checkout Stripe (`success`/`cancel` em `{returnBasePath}/upgrade/...`) |
| `PremiumGate` | Bloqueia conteúdo; `requiredPlanType` + Premium; props `fallbackTitle` / `fallbackDescription` opcionais |
| `DashboardPlanSection` | Card no dashboard: badge + upgrade (FREE) ou `SubscriptionStatusCard` embutido (PREMIUM) |
| `SubscriptionStatusCard` | Status, trial, períodos, IDs Stripe; botão **Gerenciar assinatura** → Customer Portal (`manageReturnPath`) |

## Rotas

- Dashboard personal: `/dashboard/personal` (+ Conta, IA Treino)
- Dashboard aluno: `/dashboard/aluno` (+ Conta, Nutrição)
- Conta / plano: `/dashboard/personal/conta`, `/dashboard/aluno/conta`
- IA (gate PERSONAL): `/dashboard/personal/ia-treino`
- Nutrição (gate ALUNO): `/dashboard/aluno/nutricao`
- Pós-checkout: `.../upgrade/success` e `.../upgrade/cancel`

## Como testar

1. API Nest em `http://localhost:3001`, Stripe configurado; web em `http://localhost:3000`.
2. `NEXT_PUBLIC_API_URL=http://localhost:3001/v1` (ou padrão já aponta para isso).
3. **aluno FREE / personal FREE**: badge FREE, upgrade, gates bloqueados; checkout redireciona à Stripe.
4. **aluno PREMIUM / personal PREMIUM**: badge correto, status na conta/dashboard, **Gerenciar assinatura** abre o portal (requer checkout concluído e `stripeCustomerId` no backend).
5. **Premium tipo errado**: gate da outra persona mostra “Plano diferente” + CTA do plano correto.
6. Após pagamento, `/upgrade/success` chama `refresh()`; F5 mantém plano vindo da API.

## Variáveis

- `NEXT_PUBLIC_API_URL` — base da API com sufixo `/v1`.
