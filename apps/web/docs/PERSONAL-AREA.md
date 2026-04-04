# Área do personal (frontend)

Primeira versão da UI para o profissional (`PERSONAL_PROFESSOR`) ver **alunos vinculados**, **mídias** e **avaliações**, usando apenas os endpoints já existentes da API.

## Rotas

| Rota | Descrição |
|------|-----------|
| `/dashboard/personal/alunos` | Lista de alunos (`GET /v1/users/my-students`) |
| `/dashboard/personal/alunos/[studentId]` | Detalhe: mídias + avaliações do aluno |

O menu superior do dashboard personal inclui o link **Alunos** (`PersonalSubnav`).

## Fluxo de navegação

1. Login como personal (ex.: `personal@ironbody.app` / `senha123` após seed).
2. Redirecionamento para `/dashboard/personal`.
3. Clicar em **Alunos** (ou ir direto a `/dashboard/personal/alunos`).
4. Clicar em **Ver detalhes** no card do aluno.
5. Na página de detalhe: dados básicos, fotos de evolução, fotos de avaliação, lista de avaliações (com medidas, adipometria e miniaturas de mídia quando existirem).

## Autorização no cliente

- Se `user.role !== 'PERSONAL_PROFESSOR'`, as páginas mostram aviso e link para login (o backend continua sendo a fonte da verdade: 401/403).

## Serviços e hooks

- `src/services/personalStudentsApi.ts` — `listMyStudents`, `listStudentMedia`, `listStudentAssessments`
- `src/hooks/usePersonalStudents.ts` — lista de alunos
- `src/hooks/useStudentDetail.ts` — mídias + avaliações + resolução dos dados básicos via `my-students`

## Como testar localmente

1. Subir API (`npm run dev:api`) e Postgres (ex.: `docker compose up -d`).
2. Subir web (`npm run dev:web`).
3. Garantir vínculos: `npm run db:seed` (cria/atualiza `StudentPersonalLink` para o personal de teste).
4. `NEXT_PUBLIC_API_URL` deve apontar para a API (padrão `http://localhost:3001/v1` se não definido).
5. Login no app web com o personal de teste → **Alunos**.

## Filtros de mídia na UI

- **Evolução:** `kind === PHOTO_PROGRESS` ou `entityType === USER_PROGRESS`
- **Avaliação:** `kind === PHOTO_ASSESSMENT` ou `entityType === ASSESSMENT`, unificado com `assessments[].mediaFiles` (sem duplicar por `id`)

Documentação da API: `docs/PERSONAL-AREA-API.md` (raiz do monorepo).

---

## UX premium — Fase 1 (detalhe do aluno)

Melhorias apenas na página **`/dashboard/personal/alunos/[studentId]`** (sem mudanças de backend).

### Pré-visualização real

- Thumbnails usam a **URL pública** retornada pela API (`<img>` nativo, não `next/image`), para não depender de `remotePatterns` para cada bucket/região S3.
- Se a imagem falhar (`onError`), é exibido um **fallback** (“Preview indisponível”) em caixa alinhada ao tema escuro.
- Vídeos no grid: preview com `<video muted preload="metadata">`; no modal, player com controles.

### Grid responsivo

- CSS module `personal-student-detail.module.css`: **1 coluna** (mobile), **2** a partir de 640px, **3** a partir de 1024px.
- Componentes: `StudentMediaGrid` → `StudentMediaCard` (thumbnail + data + kind + botões **Ampliar** / **Nova aba**).

### Modal de mídia

- `MediaPreviewModal`: imagem grande ou vídeo, metadados (tipo, data, `entityId` se houver), **Abrir URL original**, **Fechar**.
- Fecha com **ESC**, clique no **backdrop**, botão **×** (foco inicial para acessibilidade) e botão **Fechar**.
- `aria-label` nos botões; título oculto para leitores de tela (`srOnly`).
- `body { overflow: hidden }` enquanto o modal está aberto.

### Avaliações

- `StudentAssessmentCard`: cabeçalho com data e ID, métricas (peso / IMC com “Não informado” se null), observações, medidas e adipometria **só se houver itens**, grelha de thumbs que abre o mesmo modal.

### Loading e vazios

- Loading: `StudentDetailSkeleton` (shimmer) em vez de uma única linha de texto.
- Vazios: `StudentSectionEmpty` (bloco tracejado + título + descrição) por seção.

### Arquivos envolvidos

| Arquivo | Papel |
|---------|--------|
| `src/components/personal/personal-student-detail.module.css` | Grid, modal, skeleton, cards de avaliação |
| `MediaPreviewModal.tsx` | Modal |
| `StudentMediaThumbnail.tsx` | Imagem + fallback |
| `StudentMediaCard.tsx` | Card no grid |
| `StudentMediaGrid.tsx` | Grade |
| `StudentAssessmentCard.tsx` | Card de avaliação |
| `StudentDetailSkeleton.tsx` | Loading |
| `StudentSectionEmpty.tsx` | Empty state |
| `pages/dashboard/personal/alunos/[studentId].tsx` | Orquestração |

### Como validar

1. Mesmo fluxo da seção “Como testar localmente” acima.
2. Abrir um aluno com fotos no S3: conferir **thumbnails reais**, **grade** ao redimensionar a janela, **Ampliar** → modal → ESC / clique fora / ×.
3. Aluno sem mídias: mensagens de vazio por seção.
4. `npm run build -w ironbody-web` deve passar.
