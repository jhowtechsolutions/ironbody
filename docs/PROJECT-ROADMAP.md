# IronBody — Roadmap & cronograma

Documento vivo: prioriza **entrega de valor ao personal/aluno** e liga ao que já está no código.  
Para detalhes técnicos de Stripe, S3 e deploy, ver links no **Anexo A**.

**Cronograma interativo (checklist no browser):** [`CRONOGRAMA-DASHBOARD.html`](../CRONOGRAMA-DASHBOARD.html) — alinhado a este ficheiro.

---

## 1. Status atual do produto

### O que já está pronto (utilizável)

| Área | Entregas |
|------|----------|
| **FASE 1 — Área do personal** | Listagem de alunos vinculados; detalhe do aluno; mídias (evolução + avaliação); avaliações completas; grid responsivo, modal de preview, skeleton e empty states. |
| **FASE 2 — Autenticação** | Cadastro personal (default) e aluno (`ALUNO`); JWT access + refresh; sessão persistida no frontend; proteção por papel (`PersonalDashboardGuard` nas rotas do personal); `?next` no login/registro. |
| **FASE 3 — Convite por link** | `Invitation` (token único); `POST/GET/accept` em `/v1/invitations`; página pública `/convite/[token]`; fluxo: personal gera link → aluno cadastra ou loga → aceita → `StudentPersonalLink`; modal com copiar link. |
| **FASE 4 — Treino simples** | Modelos `SimpleWorkout`, `SimpleWorkoutExercise`, `StudentWorkout`; endpoints `POST/GET /v1/workouts`, `GET /v1/workouts/:id`, `POST /v1/workouts/:id/assign`, `GET /v1/students/me/workout`; telas `/dashboard/personal/treinos` (+ novo + `[id]`); aluno vê **Treino do dia** no dashboard. |

### O que já é “utilizável em produção” (com ressalvas)

- **Fluxo core:** convite → vínculo → criar treino → atribuir → aluno vê treino — está implementado.
- **Billing Stripe (código):** checkout, webhooks, sync, portal — ver Anexo A; **LIVE** e domínio ainda dependem de deploy e checklist operacional.
- **Mídia S3:** fluxo implementado; buckets e IAM são **configuração manual** por ambiente.
- **Banco:** em qualquer ambiente novo, rodar `npx prisma migrate deploy` na API (evita erro de tabelas inexistentes, ex.: `SimpleWorkout`).

---

## 2. Gaps identificados

| Tipo | Gap | Nota |
|------|-----|------|
| **UX** | Erro genérico ou pouco amigável quando falha o carregamento do treino no aluno | Trocar por estado vazio + mensagem clara e CTA (falar com o personal / atualizar). |
| **UX** | Pouco feedback após **atribuir** treino no personal | Confirmação visual (toast ou banner) + opcional “última atribuição”. |
| **Produto** | Personal não vê, num ápice, **quem ainda não tem treino atribuído** | Indicador na lista de alunos ou no dashboard. |
| **Produto** | Pós-convite: aluno pode não saber o próximo passo | Onboarding curto na primeira entrada (banner ou checklist: “Seu personal vai te passar o treino”). |
| **Operacional** | Migrações não aplicadas no ambiente local/Docker | Sempre aplicar migrate após pull; documentar no README dev se necessário. |
| **Legado** | Modelo antigo `Workout` (modalidade/catálogo) ≠ `SimpleWorkout` | Não misturar conceitos na UI; documentação já assume treino “simples” na FASE 4. |

---

## 3. Próxima fase — FASE 4.1 (polimento e ativação)

Objetivo: o fluxo que já existe **parecer produto acabado** e guiar personal e aluno.

### UX

- [ ] Dashboard aluno: **estado vazio amigável** quando não há treino (sem “parecer bug”).
- [ ] Tratamento de erro de rede na área do treino: mensagem humana + ação (tentar de novo).
- [ ] Após **Atribuir** no detalhe do treino: feedback visual imediato (e opcional persistir “atribuído em …”).
- [ ] Revisar textos e CTAs (convite, treino do dia, lista de treinos).

### Produto

- [ ] **Indicador de alunos sem treino** (último `StudentWorkout` inexistente ou alerta simples) no dashboard personal ou em `/alunos`.
- [ ] **Destaque para novos vínculos** (ex.: ordenar por `createdAt` do link ou badge “Novo” na primeira semana).
- [ ] **Onboarding pós-convite** mínimo: uma frase ou passo único na primeira visita do aluno ao dashboard.

**Critério de conclusão 4.1:** um novo usuário consegue percorrer convite → treino → visualização **sem mensagem assustadora** e o personal entende **quem falta ativar**.

---

## 4. FASE 5 — Engagement (planejamento)

Foco: **histórico e hábito**, sem IA nem periodização complexa no início.

- Histórico de treinos atribuídos (linha do tempo ou lista por data).
- “Marcar treino como concluído” (sessão simples ou flag por dia).
- Registro de progresso básico (notas, RPE opcional, ou check-in).
- Upload de novas fotos de evolução integrado ao fluxo do aluno (já há base de mídia).

**Dependência:** definir modelo mínimo (ex.: `WorkoutCompletion` ou sessão datada) antes de codar.

---

## 5. FASE 6 — Monetização (produto + operação)

O código já inclui **Stripe** (checkout, webhook, planos). Nesta fase, o foco é **produto vendável**:

- Limites claros **FREE vs PREMIUM** (quantos alunos, recursos de mídia, IA se existir).
- Mensagens na UI quando bate no limite.
- Stripe **test → LIVE** + preços live + webhook HTTPS em produção.
- Alinhamento com [`docs/MONETIZACAO-CHECKLIST.md`](MONETIZACAO-CHECKLIST.md) e checklist live da API.

---

## 6. Backlog priorizado

### Alta prioridade (próxima sessão)

1. UX do **treino do dia** no aluno (vazio + erro).
2. **Feedback** ao atribuir treino (personal).
3. Validar de ponta a ponta: migrate → criar treino → assign → aluno vê.
4. Indicador simples: **alunos sem treino** (mesmo que só contagem + link).

### Média prioridade

- Onboarding pós-convite no dashboard aluno.
- Badge / ordenação para **alunos novos**.
- Pequena página “ajuda” ou tooltips no fluxo de treinos.

### Baixa prioridade

- Refino visual global.
- Métricas internas (conversão, retenção) — ver secção no fim do Anexo A.

---

## 7. Checklist para a próxima sessão

1. Reproduzir fluxo aluno **sem** treino e **com** falha de API; ajustar cópia e layout.
2. Garantir que `assign` atualiza `assignedAt` e o aluno vê o treino após refresh.
3. Adicionar feedback visual no botão **Atribuir** (sucesso / erro já vindo da API).
4. (Opcional rápido) Contar alunos vinculados sem `StudentWorkout` e mostrar no personal.
5. Smoke test manual completo: convite → aceite → treino → assign → login aluno.

---

## 8. Critérios de validação

### Quando considerar a FASE 4.1 pronta

- Aluno sem treino vê **mensagem clara**, não stack trace nem erro técnico.
- Personal recebe **confirmação** ao atribuir.
- Lista ou dashboard do personal deixa óbvio **quem ainda não tem treino** (mínimo viável).

### Como testar manualmente

1. **Personal:** criar treino com 2+ exercícios; atribuir a aluno vinculado.
2. **Aluno:** login; dashboard mostra nome do treino e linhas `Nxreps` + descanso.
3. **Aluno sem assign:** copy e layout aceitáveis.
4. **API:** `GET /v1/students/me/workout` com e sem vínculo de treino.
5. **BD:** `npx prisma migrate deploy` em ambiente limpo não falha.

---

## 9. Visão de produto (simples)

**O que o IronBody já é hoje:** uma ferramenta em que o **personal captura alunos por link**, **organiza vínculos**, **prescreve um treino simples** e o **aluno vê o treino na prática** — mais mídia/evolução na área do personal e base de assinatura/pagamentos no código.

**O que falta para ser “vendável” de forma confiante:** polimento do fluxo de ativação (4.1), limites e narrativa de plano (FASE 6), deploy estável e Stripe LIVE, e — para retenção — histórico e conclusão de treino (FASE 5).

---

## Anexo A — Infra, billing e docs técnicas (referência)

Conteúdo anterior do roadmap (proteção premium, UI billing, Stripe, S3, hardening, produção) **continua válido** nos documentos abaixo:

| Tema | Documento |
|------|-----------|
| Billing / premium backend | [`services/api/docs/BILLING-PREMIUM.md`](../services/api/docs/BILLING-PREMIUM.md) |
| Eventos Stripe | [`docs/STRIPE-EVENTS-VALIDATION.md`](STRIPE-EVENTS-VALIDATION.md) |
| Monetização (checklist) | [`docs/MONETIZACAO-CHECKLIST.md`](MONETIZACAO-CHECKLIST.md) |
| Upload S3 | [`docs/S3-UPLOAD-FLOW.md`](S3-UPLOAD-FLOW.md) |
| Hardening / smoke | [`docs/HARDENING-NOTES.md`](HARDENING-NOTES.md) · [`docs/SMOKE-TEST-CHECKLIST.md`](SMOKE-TEST-CHECKLIST.md) |
| API área personal | [`docs/PERSONAL-AREA-API.md`](PERSONAL-AREA-API.md) |
| Stripe LIVE | [`services/api/docs/STRIPE-LIVE-CHECKLIST.md`](../services/api/docs/STRIPE-LIVE-CHECKLIST.md) |
| UI assinatura (web) | [`apps/web/docs/SUBSCRIPTION-UI.md`](../apps/web/docs/SUBSCRIPTION-UI.md) |

**Deploy (lembrete):** API com `npx prisma migrate deploy`; frontend com `NEXT_PUBLIC_API_URL` correto; webhook Stripe em HTTPS.

**Métricas futuras (opcional):** conversão FREE → PREMIUM, churn, uso de features premium, retenção.

---

## Roadmap visual (produto)

```text
FASE 1 — Área personal        ✅
FASE 2 — Auth                 ✅
FASE 3 — Convite              ✅
FASE 4 — Treino simples       ✅
        ↓
FASE 4.1 — Polimento          🔴 próxima
        ↓
FASE 5 — Engagement           ⚪ planejado
        ↓
FASE 6 — Monetização produto  🟡 (código Stripe existe; falta produto + LIVE)
```

---

*Última reorganização: alinhamento com fluxo convite → treino → visualização e priorização da sessão seguinte em UX e ativação.*
