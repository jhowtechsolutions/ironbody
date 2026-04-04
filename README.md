# IronBody

Ecossistema fitness: Personal/Professor e Aluno. Login, dashboards por perfil, treinos, esportes dinâmicos, pronto para MVP.

## Estrutura

- **apps/web** – Next.js (login, cadastro, dashboard Personal, dashboard Aluno, i18n PT-BR, tema claro/escuro)
- **apps/mobile** – Expo (React Native) com Expo Router (login, cadastro, dashboards)
- **services/api** – NestJS + Prisma (auth JWT + refresh, RBAC, esportes, treinos, Swagger em `/v1/docs`)
- **config/** – Documentação de variáveis de ambiente (Stripe, AWS, Agora, SendGrid, OpenAI, etc.)

## Pré-requisitos

- Node 20+
- Docker (para Postgres local) ou Supabase
- Contas e chaves nos serviços (ver `config/README.md` e `.env.example`)

## Como rodar

### 1. Banco de dados

```bash
# Opção A: Docker
cp .env.example .env
# Edite .env e defina DATABASE_URL se necessário (padrão local)
docker compose up -d

# Opção B: Use a URL do Supabase em DATABASE_URL no .env
```

### 2. API

```bash
cd services/api
cp ../../.env.example .env
# Preencha .env (mínimo: DATABASE_URL e JWT_SECRET)
npm install
npx prisma generate
# Se o banco já estiver rodando (ex: docker compose up -d):
npx prisma migrate deploy
# Ou para criar migração interativa: npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

Há uma migração inicial em `services/api/prisma/migrations/20240302000000_init/`. Use `prisma migrate deploy` para aplicá-la ao banco.

API: http://localhost:3001/v1  
Swagger: http://localhost:3001/v1/docs

### 3. Web

```bash
cd apps/web
npm install
# Crie .env.local com NEXT_PUBLIC_API_URL=http://localhost:3001/v1
npm run dev
```

Site: http://localhost:3000

### 4. Mobile

```bash
cd apps/mobile
npm install
# Crie .env com EXPO_PUBLIC_API_URL=http://SEU_IP:3001/v1 (para dispositivo físico)
npx expo start
```

Adicione ícones em `apps/mobile/assets/` (icon.png, splash.png, adaptive-icon.png) conforme `app.json`.

## Endpoints principais (v1)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /auth/register | Cadastro (body: email, password, name, role) |
| POST | /auth/login | Login (body: email, password) |
| POST | /auth/refresh | Refresh token (body: refreshToken) |
| POST | /auth/logout | Logout (body: refreshToken opcional) |
| GET | /users/me | Usuário logado (Bearer) |
| GET | /sports | Listar esportes e categorias (Bearer) |
| GET | /sports/:id/categories | Categorias do esporte |
| GET | /sports/:id/exercises | Exercícios do esporte |
| GET | /workouts | Listar treinos do usuário (Personal ou Aluno) |
| GET | /workouts/:id | Detalhe do treino |
| POST | /workouts | Criar treino (apenas Personal, body: studentId, sportId, categoryId, nome, tipo, objetivo, exercises?) |

## Seeds

- Esportes: Musculação, Crossfit, Crosstraining, Funcional, Corrida, Hyrox, Calistenia
- Categorias por esporte (ex.: Musculação: ABC, ABCD, Full Body…)
- Exercícios iniciais por esporte (ex.: Supino reto, Agachamento, Thruster, etc.)

## Configuração de serviços

Veja **config/README.md** e **.env.example** para:

- Stripe (TEST), AWS S3, Agora, SendGrid, OpenAI
- DATABASE_URL, JWT_SECRET, APP_URL_WEB, APP_URL_API

Preencha as variáveis em `.env` (API) e nos painéis (Vercel, Railway, EAS) quando for deploy.

## Planos FREE / PREMIUM

- **Personal FREE:** até 10 alunos, 5 treinos ativos, 2 avaliações por aluno; sem IA, dieta, videochamada, gráficos avançados.
- **Personal PREMIUM:** ilimitado; IA, dietas (com CRN), videochamada, relatórios.
- **Aluno FREE:** 1 Personal; ver treinos, registrar, PR, vídeos.
- **Aluno PREMIUM:** IA, foto do prato, comparação fotos, chat, videochamada.

Controle de acesso por assinatura e CRN será implementado nos próximos módulos (pagamentos Stripe, middlewares de plano).

## Próximos passos (pós-MVP)

- Módulo de avaliações físicas (adipometria, medidas, fotos)
- IA: geração de treino, periodização, ajuste, foto do prato (OpenAI)
- Upload de mídia (S3, URLs assinadas)
- Videochamada (Agora)
- Pagamentos (Stripe, trial 7 dias)
- Chat e notificações
