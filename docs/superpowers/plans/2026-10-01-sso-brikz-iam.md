# Login único do Trava-AP com o brikz-iam: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O `ap.brikz.ai` passa a fazer login pelo `brikz-iam` (as mesmas contas do fidexa), com a tela do fidexa, e o token do usuário substitui os JWT de dev embutidos no bundle.

**Architecture:**
- O IAM ganha `DEFAULT_FINANCIADOR_ID` no token de acesso e uma allowlist de fronts (`return_to`).
- Os backends do AP passam a aceitar uma segunda chave pública (a do brikz-iam).
- O front porta o `auth.ts`, as telas e o guard do fidexa, adaptados para o Vite (sem router e sem Firebase).

**Spec:** `docs/superpowers/specs/2026-10-01-sso-brikz-iam-design.md`. Leia antes de qualquer tarefa.

**Fonte para portar:** `C:\DEV\brikz\frontend-fidexa\frontend-fidexa`, especialmente:
- `src/lib/auth.ts`
- `src/components/AuthShell.tsx`
- `src/app/login/page.tsx`
- `src/app/forgot-password/page.tsx`
- `src/app/reset-password/page.tsx`
- `src/app/trocar-senha/page.tsx`
- `src/components/AuthGate.tsx`
- `src/lib/user.ts`
- `src/lib/auth.test.ts`

## Global Constraints

- Cada repositório trabalha numa branch nova chamada `feat/ap-sso`, a partir do branch padrão. Nada de commit direto em `main` ou `master`, e nenhum push. O controller cuida do push e do deploy.
- Nenhuma dependência nova em nenhum repositório.
- IAM: o comportamento sem `return_to`, ou com `return_to` inválido, tem que ser **idêntico** ao de hoje. É produção do fidexa.
- Backends: aceitar duas chaves é aditivo. Tokens assinados pela chave atual continuam válidos, e a regra do `financiador_id` (14 dígitos, obrigatório) não muda.
- Front:
  - chaves de localStorage `brikz.ap.auth.access`, `brikz.ap.auth.refresh` e `brikz.ap.auth.user`;
  - env `VITE_AUTH_API_URL`;
  - nenhum `VITE_*_DEV_JWT` no código;
  - baseline de `tsc` = 96 erros, que não pode subir; `npm test` e `vite build` passam.
- Copy em PT-BR, sem exclamação, `brikz` em minúsculas. O visual segue o DS já aplicado (classes `btn`, `input-soft`, `panel` etc. de `src/styles/brikz-components.css`).
- Todo commit termina com uma linha em branco seguida de `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Open redirect.** `return_to=https://evil.com` tem que cair no `FRONTEND_URL`. Teste na Task 1.
2. **Token da chave errada.** Um token assinado por uma chave desconhecida dá 401, e um token expirado da segunda chave dá "token expirado", sem cair para outra mensagem. Teste na Task 2.
3. **Renovação concorrente.** Vários 401 simultâneos geram uma única chamada de refresh. Teste na Task 3.
4. **Refresh morto.** Um refresh que volta 401/403 limpa a sessão. Já um erro de rede ou 5xx **não** limpa. Teste na Task 3.
5. **Retorno do Google.** O hash `#access=…&refresh=…` é consumido e limpo da URL. Teste na Task 3.

---

### Task 1: IAM (`C:\DEV\brikz\backend\services\iam`)

**Files:**
- `config/settings.py`
- `apps/users/tokens.py`
- `apps/users/views.py`: `_send_password_reset_email`, `password_reset_request`, `google_start`, `google_callback`
- `apps/users/serializers.py`: `PasswordResetRequestSerializer`
- `.env.example`
- testes em `apps/users/test_ap_sso.py`
- `cloudbuild.yaml`: substitutions `_FRONTEND_URLS` e `_DEFAULT_FINANCIADOR_ID` e env vars correspondentes. Listas separadas por **espaço**, porque o `--set-env-vars` usa vírgula.

**Requisitos:**
- `DEFAULT_FINANCIADOR_ID = os.getenv("DEFAULT_FINANCIADOR_ID", "")`. Em `access_token_for`, incluir `financiador_id` apenas se o valor casar com `^\d{14}$`. O refresh (`views.refresh`) usa `access_token_for`, então herda o comportamento.
- `FRONTEND_URLS`: começa com `FRONTEND_URL` e acrescenta os itens da env `FRONTEND_URLS` (separados por espaço ou vírgula), sem duplicatas e sem barra final. Esses itens também entram em `_cors_origins`.
- `resolve_return_to(value: str | None) -> str`, em `apps/users/views.py` ou num módulo pequeno `apps/users/frontends.py`. Normaliza tirando a barra final e só aceita igualdade exata com um item de `FRONTEND_URLS`. Caso contrário, devolve `FRONTEND_URL`.
- `google_start`: `request.session["google_oauth_return_to"] = resolve_return_to(request.GET.get("return_to"))`.
- `google_callback`: `base = resolve_return_to(request.session.pop("google_oauth_return_to", None))`. **Todos** os redirects para o front, inclusive os de erro, se houver, usam `base`. Ler a função inteira antes de alterar.
- `password_reset_request`: campo opcional `return_to` no serializer, e `_send_password_reset_email(user, base)` monta o link com `base`.

**Testes (TDD):**
- `resolve_return_to`: aceita fidexa e ap; recusa `https://evil.com`, `https://ap.brikz.ai.evil.com` e `None`, que caem no `FRONTEND_URL`.
- `access_token_for`: com a setting válida inclui `financiador_id`; com a setting vazia ou inválida não inclui (usar `override_settings`).
- `google_start` com `return_to` válido guarda o valor na sessão e redireciona para o Google. Mockar o que for necessário.
- Para rodar: `python manage.py test apps.users`. Se não houver Postgres (Cloud SQL proxy ou Docker), **não** invente um settings novo. Rode os testes puros que não tocam o banco com `SimpleTestCase` e informe exatamente o que não pôde rodar.

**Commit:** `feat(iam): financiador_id padrao no token e allowlist de fronts (return_to)`

---

### Task 2: Backends do AP, duas chaves aceitas (3 repositórios, a mesma mudança)

**Files (em cada repositório):**
- `shared/jwt_auth.py`
- `shared/tests/test_jwt_auth.py`
- `cloudbuild.yaml`

Os caminhos são:
- `C:\DEV\ap\ap-back-optin\optin`
- `C:\DEV\ap\ap-back-contratos\contratos`
- `C:\DEV\ap\ap-back-consulta-agenda`

**Requisitos:**
- `_public_keys() -> list[str]`: devolve `IAM_JWT_PUBLIC_KEY` (obrigatória, mantendo o tratamento atual de erro de configuração) e, se definida e não vazia, `IAM_JWT_PUBLIC_KEY_BRIKZ_IAM`, aplicando o `.replace("\\n", "\n")` atual.
- Na validação, tentar cada chave em ordem. Só `jwt.InvalidSignatureError` passa para a próxima; qualquer outra exceção segue o fluxo atual (expirado vira "token expirado" etc.). Se todas as assinaturas falharem, o resultado é o mesmo de hoje para assinatura inválida.
- Não mudar o issuer, as claims exigidas nem a regra do `financiador_id`.
- `cloudbuild.yaml`:
  - acrescentar `IAM_JWT_PUBLIC_KEY_BRIKZ_IAM=IAM_JWT_PUBLIC_KEY_BRIKZ_IAM:latest` ao `--set-secrets`;
  - **no contratos**, acrescentar também `IAM_JWT_PUBLIC_KEY=IAM_JWT_PUBLIC_KEY:latest` ao `--set-secrets` e `IAM_JWT_ISSUER=brikz-iam` ao `--set-env-vars`, respeitando o separador usado no arquivo (`^|^`).

**Testes (TDD), em cada repositório:**
- Um token assinado pela segunda chave, com `financiador_id`, é aceito.
- Um token assinado por uma terceira chave dá 401.
- Um token expirado da segunda chave dá a mensagem de expirado.
- Sem a env da segunda chave, o comportamento é o de hoje.
- Gerar os pares de chaves no próprio teste, como os testes existentes fazem.
- Para rodar: `pytest shared/tests/test_jwt_auth.py`. Se o conftest exigir banco, rode só esse arquivo com o marcador ou flag que dispense banco, se existir, e informe.

**Commit (em cada repositório):** `feat(auth): aceita chave publica do brikz-iam alem da de homolog`

---

### Task 3: Front, núcleo de autenticação e serviços

**Files:**
- Create: `src/auth/auth.ts`, `tests/auth.test.mjs`
- Modify:
  - `src/services/contratosApi.ts`, `src/services/optinApi.ts`, `src/services/agendaApi.ts`;
  - `.env.example`, `Dockerfile`, `cloudbuild.yaml`, `deploy.sh`: remover os três `*_DEV_JWT` e adicionar `VITE_AUTH_API_URL`, com a substitution `_AUTH_URL`.

**Requisitos:**
- `src/auth/auth.ts` é um port de `frontend-fidexa/src/lib/auth.ts` **sem** Firebase e sem cookie de SSR, com as chaves `brikz.ap.auth.*`. Exportar:
  - `AuthUser` (o tipo do `/me`);
  - `getSession()`;
  - `login(email, password)`;
  - `fetchMe(access)`;
  - `storeSession({access, refresh, user})`;
  - `clearSession()`;
  - `refreshAccess()` (promise única compartilhada);
  - `authFetch(input, init?)`;
  - `requestPasswordReset(email)`, que envia `return_to: window.location.origin`;
  - `confirmPasswordReset(uid, token, password)`;
  - `changePassword(current, next)`;
  - `googleStartUrl()`, que usa `?return_to=` com `encodeURIComponent(origin)`;
  - `consumeLoginHash()`, que lê `#access=&refresh=`, limpa com `history.replaceState` e devolve os tokens ou `null`;
  - `onSessionChange(cb)` (evento simples para o App reagir ao logout).
- `authFetch` em caso de 401: chama `refreshAccess()` uma vez e repete a requisição. Se o refresh devolver 401/403, chama `clearSession()` e emite a mudança de sessão. Rede ou 5xx deixam a sessão como está e devolvem o erro.
- Os três serviços trocam o `fetch` com `Authorization` de `*_DEV_JWT` por `authFetch`, sem mudar as assinaturas públicas.
- O código precisa ser importável pelo `node --test` (sintaxe TS apagável). Nos testes, use stubs de `globalThis.fetch`, `localStorage`, `window` e `history`.

**Testes (TDD, `tests/auth.test.mjs`):**
- O login guarda a sessão.
- `authFetch` anexa o Bearer.
- 401, depois refresh ok, depois repetição ok.
- Dois 401 simultâneos geram um único refresh.
- Refresh com 401 limpa a sessão; refresh com 500 não limpa.
- `consumeLoginHash` lê e limpa o hash.
- `googleStartUrl` inclui `return_to`.
- `grep` garantindo que não sobrou `DEV_JWT` em `src/`.

**Commit:** `feat(auth): sessao brikz-iam no front (authFetch, refresh, google return)`

---

### Task 4: Front, telas e guard

**Files:**
- Create:
  - `src/components/auth/AuthShell.tsx` (port do fidexa, com "brikz | Trava-AP" e uma headline em PT-BR sobre o AP: registros, travas e liquidações, sem exclamação);
  - `src/components/auth/LoginScreen.tsx`;
  - `src/components/auth/ForgotPasswordScreen.tsx`;
  - `src/components/auth/ResetPasswordScreen.tsx`;
  - `src/components/auth/ChangePasswordScreen.tsx`.
- Modify:
  - `src/App.tsx`: o guard, removendo `Login`, `Register`, `handleLogin` e `handleRegister`;
  - `src/components/Header.tsx`: usuário real e "Sair";
  - excluir `src/components/Login.tsx` e o `Register`, se não forem mais usados;
  - atualizar `tests/brand.test.mjs`, que hoje verifica o `Login.tsx`. Mover essas verificações para o `AuthShell` e o `LoginScreen`, mantendo "Trava-AP", o painel ink, o logo on-dark/on-light e a regra de copy sem exclamação.

**Requisitos:**
- **Visual:** o mesmo do login do fidexa (painel `bg-black` à esquerda com grid e brilho cyan, e formulário à direita sobre `grid-bg`), usando os tokens do DS já aplicados aqui. Botão "Entrar com Google" com o SVG de 4 cores do fidexa e um divisor "ou com e-mail". **Sem** "Criar conta".
- **Guard (`App.tsx`):** ao montar, se `consumeLoginHash()` devolver tokens, chama `fetchMe` e depois `storeSession`. Depois:
  - `pathname === '/reset-password'` mostra o `ResetPasswordScreen`, lendo `uid` e `token` da query;
  - sem sessão mostra o `LoginScreen`, ou o `ForgotPasswordScreen` quando esse estado local estiver ativo;
  - com `user.must_change_password` mostra o `ChangePasswordScreen`;
  - nos demais casos mostra o app atual.
  
  Escutar `onSessionChange` para voltar ao login no logout ou quando a sessão morrer.
- **Header:** troca os nomes mockados pelo `user.name` e `user.email` da sessão. "Sair" chama `clearSession()`.
- **Erros do IAM:** 400 no login mostra "E-mail ou senha inválidos". 403 no retorno do Google (o IAM redireciona com erro, se houver) mostra uma mensagem amigável. A falha de rede mostra "Não foi possível conectar".

**Testes:** `tests/brand.test.mjs` atualizado, e um teste novo garantindo que `App.tsx` não importa mais `Login`/`Register` e que `LoginScreen` contém "Entrar com Google" e não contém "Criar conta". Rodar `npm test`, a contagem do `tsc` e o `vite build`.

**Commit:** `feat(auth): telas de login do brikz-iam (google, e-mail, reset, troca de senha) e guard`

---

### Task 5: Infra e deploy (controller, não subagente)

1. Criar o secret `IAM_JWT_PUBLIC_KEY_BRIKZ_IAM` no `brikz-ap` a partir do secret `IAM_JWT_PUBLIC_KEY` do `fidexa-493416`, via pipe e sem imprimir. Dar `roles/secretmanager.secretAccessor` às SAs `optin-run`, `contratos-run` e `agenda-run`.
2. Backends: push de `feat/ap-sso` para a `master` de cada repositório, o que dispara o trigger. Acompanhar os builds. Com o usuário logado num token gerado pelo IAM, conferir que o optin devolve 200.
3. IAM: com confirmação do usuário, deploy via `cloudbuild.yaml` com `_FRONTEND_URLS` e `_DEFAULT_FINANCIADOR_ID`. Conferir que o login do fidexa continua funcionando (`POST /api/auth/login` com credencial inválida devolve 400, e `/api/auth/google/start` sem `return_to` devolve 302).
4. Front: `.env` com `VITE_AUTH_API_URL=https://brikz-backend-vuhwbuat4a-ue.a.run.app`, depois `./deploy.sh`.
5. O usuário valida fim a fim no `ap.brikz.ai`.
