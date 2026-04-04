# Fluxo de upload de mídia (AWS S3)

## Visão geral

O backend **não** recebe o arquivo em si. Ele gera uma **presigned URL** (PUT), o browser envia o arquivo **direto ao S3**, e em seguida o frontend chama **`POST /v1/media/confirm`** para persistir metadados no PostgreSQL (`MediaFile`).

```
Frontend                    API                         S3
   |--- POST /media/upload-url -->|                        |
   |<-- uploadUrl, objectKey ------|                        |
   |--- PUT uploadUrl (body=file) ------------------------>|
   |--- POST /media/confirm ------>|                        |
   |                         Prisma insert                  |
```

## Variáveis de ambiente (API)

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `AWS_ACCESS_KEY_ID` | Sim* | Credencial IAM (nunca no frontend). |
| `AWS_SECRET_ACCESS_KEY` | Sim* | Credencial IAM. |
| `AWS_REGION` | Sim | Ex.: `us-east-1`. |
| `AWS_S3_BUCKET_MEDIA` | Recomendada | Bucket padrão quando tipos específicos não estão definidos. |
| `AWS_S3_BUCKET_PHOTOS` | Opcional | Fotos (evolução, avaliação, GIF de exercício). Se vazio, usa `AWS_S3_BUCKET_MEDIA`. |
| `AWS_S3_BUCKET_VIDEOS` | Opcional | Vídeos de exercício. Se vazio, usa `AWS_S3_BUCKET_MEDIA` ou fotos. |

\*Sem credenciais, `POST /media/upload-url` retorna `503` com mensagem clara — útil em dev sem S3.

## Buckets e política

- Em **MVP**, o desenho supõe objetos **legíveis via URL pública** (bucket/policy ou “bloquear lista pública mas permitir objeto GET”, conforme sua política). A URL salva no banco segue o padrão virtual-hosted:  
  `https://{bucket}.s3.{region}.amazonaws.com/{key}`  
- Para **objetos 100% privados**, evolua para `GetObject` com URL assinada de leitura sem mudar o modelo: continue armazenando `bucket` + `objectKey` e gere leitura sob demanda.

## Padrão de `objectKey` (sempre gerado no servidor)

- Evolução: `users/{studentId}/progress/{uuid}.{ext}`
- Avaliação: `users/{studentId}/assessments/{uuid}.{ext}`
- Vídeo exercício: `exercises/{exerciseId}/videos/{uuid}.{ext}`
- GIF exercício: `exercises/{exerciseId}/gifs/{uuid}.{ext}`

O cliente **não** envia `objectKey` na geração da URL; só repete `bucket` / `objectKey` retornados na confirmação.

## Endpoints

- `POST /v1/media/upload-url` — corpo: `kind`, `fileName`, `mimeType`, `entityType`, `entityId?` (JWT).
- `POST /v1/media/confirm` — após PUT no S3; API faz **HeadObject** para validar existência/tamanho/tipo.
- `GET /v1/media` — listagem com filtros `kind`, `entityType`, `entityId`, `ownerUserId` (com regras por papel).
- `DELETE /v1/media/:id` — remove objeto no S3 e linha no banco.

Avaliações (suporte ao fluxo de foto):

- `POST /v1/assessments` — cria registro de avaliação (aluno: próprio `studentId`; personal: `studentId` no body + vínculo).
- `GET /v1/assessments/my?studentId=` — lista visível ao usuário.

## MIME e tamanhos (servidor)

| kind | MIME | Tamanho máx. (aprox.) |
|------|------|------------------------|
| `PHOTO_PROGRESS`, `PHOTO_ASSESSMENT` | `image/jpeg`, `image/png`, `image/webp` | 10 MiB |
| `EXERCISE_GIF` | `image/gif` | 20 MiB |
| `EXERCISE_VIDEO` | `video/mp4`, `video/webm` | 120 MiB |

## Migração Prisma

Na raiz do monorepo ou em `services/api`:

```bash
npx prisma migrate deploy
# ou em dev:
npm run prisma:migrate -w ironbody-api
```

Migration: `20260329120000_add_media_file`.

## Teste local

1. Configure `.env` da API com buckets reais (ou um único `AWS_S3_BUCKET_MEDIA` de teste).
2. Buckets com CORS permitindo `PUT` a partir da origem do frontend (ex. `http://localhost:3000`) e método/headers necessários (`Content-Type`).
3. Suba API e web; faça login como **ALUNO** → `/dashboard/aluno/evolucao` ou **personal** → `/dashboard/personal/exercicio-midia`.
4. Verifique no S3 o objeto e na tabela `MediaFile` o registro.

## Troubleshooting

| Sintoma | Causa provável |
|---------|----------------|
| `503` no upload-url | Credenciais AWS ou buckets não definidos. |
| `PUT` falha no browser | CORS do bucket ou URL expirada (> 15 min). |
| `400` na confirmação | Objeto não existe (PUT falhou), `Content-Type` divergente, ou `sizeBytes` muito diferente do objeto. |
| Erro de permissão | Papel errado (ex.: aluno tentando `EXERCISE_VIDEO`) ou personal sem vínculo com aluno na avaliação. |

## Frontend

- API clients: `apps/web/src/services/mediaApi.ts`
- Hook: `apps/web/src/hooks/useMediaUpload.ts`
- Componentes: `FileUploadField`, `MediaGallery` em `apps/web/src/components/media/`

Nenhum segredo AWS é exposto no bundle; apenas URLs assinadas retornadas pela API após autenticação.
