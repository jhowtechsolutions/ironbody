# Estabilidade do build (Next.js + monorepo)

## Causa do erro

Durante `next build`, o prerender/SSR falhava em **todas** as rotas com:

`TypeError: Cannot read properties of null (reading 'useContext')`

O stack trace apontava para:

- `styled-jsx` → `StyleRegistry` → `React.useContext`
- `react-dom-server.browser` (renderização no servidor)

**Causa raiz:** em monorepo **npm workspaces**, havia **duas instâncias físicas (e até versões diferentes)** de `react`:

- `styled-jsx` (hoistado em `node_modules` na **raiz** do repo) resolvia `react` na raiz (ex.: 18.2.0).
- `next` / `react-dom` em `apps/web` instalaram `react` em `apps/web/node_modules` (chegou a **18.3.1** via range do lockfile).

O React só funciona com **uma** cópia por árvore de render; com duas, o dispatcher de hooks fica inconsistente e `useContext` quebra no SSR.

Isso **não** era bug da UI de billing (`SubscriptionContext`, `PremiumGate`, etc.).

## Páginas / rotas afetadas

Qualquer página sujeita a SSG/prerender (incluindo `/`, `/login`, dashboards, `/404`, `/500`, locales `en` e `pt-BR`).

## Correções aplicadas

1. **`package-lock.json` (workspace `ironbody-web`):** alinhar `react` e `react-dom` em **18.2.0** (coerente com `apps/mobile` e `overrides` da raiz), removendo o par **18.3.1** que ficou preso no lockfile.
2. **`package.json` (raiz):** `dependencies` + `overrides` para `react` / `react-dom` **18.2.0**, e override aninhado em `next` para evitar drift.
3. **`apps/web/package.json`:** versões **fixas** `18.2.0` (sem `^`) para o workspace web.
4. **`apps/web/next.config.js`:**
   - `webpack.resolve.modules` inclui `../../node_modules` para achar pacotes hoistados na raiz.
   - aliases explícitos de `react`, `react-dom` e runtimes JSX para **a mesma** instância escolhida (local ao app se existir, senão raiz).

## Recomendações para evitar regressão

- Manter **uma** versão de `react` / `react-dom` em todo o monorepo (usar `overrides` na raiz).
- Após mudar versões de React, rodar `npm install` na raiz e conferir com `npm ls react react-dom` que não aparecem cópias “invalid” ou duas versões sob `apps/web`.
- Se o lockfile voltar a fixar uma versão errada do web, rodar `npm install` na raiz ou corrigir o trecho do workspace no `package-lock.json` antes de deploy.
- Evitar ranges largos só no web que permitam **18.3.x** enquanto o mobile ficar em **18.2.0**, a menos que todo o repo suba de versão em conjunto.

## Critério de verificação

- `npm run build` em `apps/web` conclui sem erros.
- `npx tsc --noEmit` no web continua passando (quando aplicável ao projeto).
