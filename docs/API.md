# IronBody API (v1)

Base URL: `http://localhost:3001/v1` (ou `https://api.ironbody.app/v1` em produção)

## Autenticação

- **Login:** `POST /auth/login`  
  Body: `{ "email": "...", "password": "..." }`  
  Retorno: `{ user, accessToken, refreshToken, expiresIn }`

- **Cadastro:** `POST /auth/register`  
  Body: `{ "email", "password", "name", "role": "PERSONAL_PROFESSOR" | "ALUNO" }`  
  Retorno: mesmo formato do login.

- **Refresh:** `POST /auth/refresh`  
  Body: `{ "refreshToken": "..." }`  
  Retorno: `{ accessToken, refreshToken, expiresIn }`

- **Logout:** `POST /auth/logout`  
  Body (opcional): `{ "refreshToken": "..." }`

Rotas protegidas: header `Authorization: Bearer <accessToken>`.

## Usuário

- **Me:** `GET /users/me`  
  Retorno: `{ id, email, name, role, plan, createdAt }`

## Esportes (modalidades)

- **Listar:** `GET /sports`  
  Retorno: lista de esportes com `categories` (categorias por modalidade).

- **Categorias:** `GET /sports/:sportId/categories`

- **Exercícios:** `GET /sports/:sportId/exercises`

## Treinos

- **Listar:** `GET /workouts`  
  Para Aluno: treinos do aluno. Para Personal: treinos criados por ele.

- **Detalhe:** `GET /workouts/:id`

- **Criar (Personal):** `POST /workouts`  
  Body: `{ studentId, sportId, categoryId, nome?, tipo?, objetivo?, scheduledAt?, exercises?: [{ exerciseId, orderIndex, sets?, reps?, tempo?, peso?, restSeconds? }] }`

## IA

- **Gerar treino:** `POST /ai/workout/generate` (apenas Personal, Bearer obrigatório)  
  Body: `{ "modalidade": "Musculação", "categoria": "ABC", "objetivo": "Hipertrofia", "nivel?": "intermediário", "diasSemana?": 3, "equipamentos?": ["barra", "halteres"], "restricoes?": "..." }`  
  Requer `OPENAI_API_KEY` no ambiente. Retorno: JSON com `nome`, `objetivo`, `exercicios[]`, `observacoes_gerais`.

## Prompts IA (a implementar)

- `POST /ai/workout/periodize` – periodização
- `POST /ai/workout/adjust` – ajuste por histórico/PR
- `POST /ai/nutrition/meal-photo` – foto do prato (alimentos, calorias, macros)

Dietas/meal-photo só liberados se o Personal tiver CRN válido.
