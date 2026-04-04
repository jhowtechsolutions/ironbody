# API — área do personal (alunos vinculados)

Endpoints para o **personal autenticado** (`PERSONAL_PROFESSOR`) listar alunos com vínculo em `StudentPersonalLink` e consultar mídias/avaliações **somente** desses alunos.

## Autorização geral

| Condição | Resposta |
|----------|----------|
| Sem `Authorization: Bearer <JWT>` | **401** |
| JWT válido mas papel ≠ `PERSONAL_PROFESSOR` | **403** (RolesGuard) |
| Personal sem `StudentPersonalLink` com o `studentId` da rota | **403** (`Sem vínculo com este aluno`) |

**Alunos** (`ALUNO`) não devem conseguir chamar estes endpoints (403).

**Admin** também recebe 403 nestas rotas (restritas ao personal).

## Endpoints

Base: `http://localhost:3001/v1` (ajuste conforme `APP_URL_API`).

### `GET /users/my-students`

- **Quem:** `PERSONAL_PROFESSOR` + JWT.
- **Resposta 200:** array de alunos vinculados; `[]` se não houver vínculos.
- **Campos por item:** `id`, `name`, `email`, `role`, `plan`, `planType`, `createdAt` (conta do aluno).
- **Ordenação:** nome do aluno (A→Z).

### `GET /media/student/:studentId`

- **Quem:** `PERSONAL_PROFESSOR` + JWT.
- **Regra:** deve existir linha em `StudentPersonalLink` (`personalId` = usuário autenticado, `studentId` = parâmetro).
- **Query opcional:** `kind`, `entityType`, `entityId` (mesmos enums que `GET /media`).
- **Resposta 200:** lista de `MediaFile` do **dono** `ownerUserId = studentId`.
- **URL pública:** cada item inclui `url` (gravada no confirm do upload; URL pública S3) e `bucket` / `objectKey`.

### `GET /assessments/student/:studentId`

- **Quem:** `PERSONAL_PROFESSOR` + JWT.
- **Regra:** mesmo vínculo que acima.
- **Resposta 200:** avaliações do aluno (`data` desc), com `bodyMeasures`, `adipometry` e `mediaFiles`: mídias com `entityType = ASSESSMENT` e `entityId` = id da avaliação (e `ownerUserId` = aluno).

## Dados de teste (seed)

Na raiz do monorepo (com Postgres no ar):

```bash
npm run db:seed
```

Ou: `cd services/api && npx prisma db seed`

O seed garante (se os usuários existirem):

- `personal@ironbody.app` ↔ `aluno@ironbody.app`
- `personal@ironbody.app` ↔ `aluno2@ironbody.app`

Senha de teste: `senha123`. Se os usuários já existiam de um seed antigo, o bloco de links usa **upsert** e atualiza/cria os vínculos na execução do seed.

## Testar no Swagger

1. Suba a API (`npm run dev:api` na raiz do repo).
2. Abra **http://localhost:3001/v1/docs**.
3. Em **auth**, use `POST /v1/auth/login` com `personal@ironbody.app` / `senha123`.
4. Clique **Authorize**, cole o **`accessToken`** retornado no JSON do login (camelCase; não use `access_token`).
5. Teste:
   - `GET /users/my-students`
   - `GET /media/student/{studentId}` — use o `id` de um aluno devolvido em my-students.
   - `GET /assessments/student/{studentId}` — idem.

Para validar **403**, faça login como `aluno@ironbody.app` e chame `GET /users/my-students`, ou como personal use um `studentId` de outro personal.

## Exemplos de JSON

**`GET /users/my-students` (200)**

```json
[
  {
    "id": "clxxxxxxxx",
    "name": "Aluno Dois",
    "email": "aluno2@ironbody.app",
    "role": "ALUNO",
    "plan": "FREE",
    "planType": null,
    "createdAt": "2026-03-29T12:00:00.000Z"
  }
]
```

**`GET /media/student/:studentId` (200)** — trecho

```json
[
  {
    "id": "clmedia1",
    "ownerUserId": "clstudent1",
    "entityType": "USER_PROGRESS",
    "entityId": null,
    "kind": "PHOTO_PROGRESS",
    "bucket": "ironbody-media-dev",
    "objectKey": "users/clstudent1/progress/uuid.jpg",
    "url": "https://bucket.s3.sa-east-1.amazonaws.com/users/clstudent1/progress/uuid.jpg",
    "mimeType": "image/jpeg",
    "sizeBytes": 120000,
    "createdAt": "2026-03-29T12:00:00.000Z",
    "updatedAt": "2026-03-29T12:00:00.000Z"
  }
]
```

**`GET /assessments/student/:studentId` (200)** — trecho

```json
[
  {
    "id": "clasm1",
    "studentId": "clstudent1",
    "data": "2026-03-29T10:00:00.000Z",
    "peso": 75.5,
    "imc": 23.2,
    "observacoes": null,
    "createdAt": "2026-03-29T10:00:00.000Z",
    "bodyMeasures": [],
    "adipometry": [],
    "mediaFiles": []
  }
]
```
