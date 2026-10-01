# Login único do Trava-AP com o brikz-iam (MVP)

**Data:** 2026-10-01
**Decisões do usuário:** reaproveitar o IAM do fidexa, com as mesmas contas (opção A); usar o financiador que já existe (`38138785000136`); qualquer usuário do IAM pode entrar no AP (é um MVP).

## Objetivo

O `ap.brikz.ai` passa a ter o mesmo login do `fidexa.brikz.ai`:
- tela no padrão do fidexa;
- e-mail e senha, ou Google;
- "esqueci a senha", "redefinir senha" e "trocar senha" obrigatória.

Tudo isso contra o `brikz-iam`, que roda no projeto `fidexa-493416`. O token do usuário logado substitui os JWT de dev que hoje ficam embutidos no bundle público.

## Repositórios afetados

| Repositório | Caminho local | Remoto / branch | Deploy |
|---|---|---|---|
| IAM | `C:\DEV\brikz\backend\services\iam` | `brikz-ai/backend` `main` | `services/iam/cloudbuild.yaml` (serviço `brikz-backend`, `us-east1`, projeto `fidexa-493416`) |
| optin | `C:\DEV\ap\ap-back-optin\optin` | `brikzai/ap-optin-back` `master` | trigger `optin-deploy-master` (`brikz-ap`) |
| contratos | `C:\DEV\ap\ap-back-contratos\contratos` | `brikzai/ap-back-contratos` `master` | trigger `contratos-deploy-master` |
| agenda | `C:\DEV\ap\ap-back-consulta-agenda` | remoto `brikzai` → `brikzai/brikzai-ap-consulta-agenda-back` `master` | trigger `agenda-deploy-master` |
| front | `C:\DEV\ap\ap-front` | `brikz-ai/ap-front` `main` | `./deploy.sh` |

## Design

### 1. IAM

- **`financiador_id` no token de acesso**
  - Nova setting `DEFAULT_FINANCIADOR_ID` (env, string de 14 dígitos; vazia por padrão).
  - Em `apps/users/tokens.py::access_token_for`, incluir `"financiador_id": settings.DEFAULT_FINANCIADOR_ID` **só quando a setting estiver preenchida e for válida** (`^\d{14}$`).
  - Sem migração de banco: o banco é o mesmo do fidexa em produção. O campo por usuário fica para quando houver mais de um financiador.
  - O fidexa ignora claims desconhecidas, então não é afetado.
- **Vários fronts**
  - Nova setting `FRONTEND_URLS`: lista de origens permitidas, separadas por espaço. Ela sempre inclui `FRONTEND_URL`.
  - Função `_resolve_return_to(value)`: devolve a origem se ela estiver na allowlist, ou `FRONTEND_URL` caso contrário.
  - `google_start`: lê `?return_to=<origem>`, valida e guarda em `request.session["google_oauth_return_to"]`.
  - `google_callback`: redireciona para `<return_to>/login#access=…&refresh=…`, usando `FRONTEND_URL` como padrão. Isso vale também para os redirects de erro que hoje usam `FRONTEND_URL`.
  - `password/reset`: aceita o campo opcional `return_to`, validado pela mesma função, e o link do e-mail usa essa origem.
  - As origens de `FRONTEND_URLS` também entram em `CORS_ALLOWED_ORIGINS` e, portanto, em `CSRF_TRUSTED_ORIGINS`.
- **Deploy:** env `FRONTEND_URLS="https://fidexa.brikz.ai https://ap.brikz.ai"`, `DEFAULT_FINANCIADOR_ID=38138785000136` e `ALLOWED_ORIGINS="https://ap.brikz.ai"`. As listas são separadas por espaço, porque o `cloudbuild.yaml` usa vírgula como separador de env vars.

### 2. Backends do AP (optin, contratos, agenda)

- **Duas chaves aceitas em `shared/jwt_auth.py`**
  - Validar com `IAM_JWT_PUBLIC_KEY` (homolog, já existe) e, se essa assinatura falhar, com `IAM_JWT_PUBLIC_KEY_BRIKZ_IAM` (nova, opcional).
  - Só `InvalidSignatureError` tenta a próxima chave. Expirado, issuer errado ou claim faltando continuam falhando de imediato.
  - Uma env opcional ausente é ignorada.
  - O issuer continua sendo `IAM_JWT_ISSUER=brikz-iam`, que é o mesmo nos dois emissores.
  - A regra do `financiador_id` não muda.
- **`cloudbuild.yaml` dos três:** montar o secret novo, `IAM_JWT_PUBLIC_KEY_BRIKZ_IAM=IAM_JWT_PUBLIC_KEY_BRIKZ_IAM:latest`. No contratos, montar também `IAM_JWT_PUBLIC_KEY` e `IAM_JWT_ISSUER`, que hoje não são injetados.
- **Secret no `brikz-ap`:** criar `IAM_JWT_PUBLIC_KEY_BRIKZ_IAM` a partir do secret `IAM_JWT_PUBLIC_KEY` do projeto `fidexa-493416`, sem expor o valor. Dar `secretAccessor` às SAs de runtime `optin-run`, `contratos-run` e `agenda-run`.
- **CORS:** já libera `https://ap.brikz.ai`.

### 3. Front (`ap-front`)

- **`src/auth/auth.ts`:** port de `frontend-fidexa/src/lib/auth.ts`, sem o Firebase e sem cookie de SSR. Contém:
  - `VITE_AUTH_API_URL`;
  - chaves de localStorage `brikz.ap.auth.access`, `brikz.ap.auth.refresh` e `brikz.ap.auth.user`;
  - `login`, `refreshAccess` (requisição única compartilhada), `fetchMe`, `storeSession`, `clearSession`;
  - `authFetch`, que anexa `Authorization: Bearer`, faz uma renovação em caso de 401 e, se a renovação falhar com 401/403, limpa a sessão e volta ao login;
  - `requestPasswordReset(email)` enviando `return_to = window.location.origin`;
  - `confirmPasswordReset` e `changePassword`;
  - `googleStartUrl()` com `?return_to=<origin>`;
  - `consumeLoginHash()` para o retorno do Google.
- **Serviços:** `contratosApi.ts`, `optinApi.ts` e `agendaApi.ts` passam a usar `authFetch`. As variáveis `VITE_*_DEV_JWT` são removidas do código, do Dockerfile, do `cloudbuild.yaml` e do `deploy.sh`.
- **Telas**, no visual do `AuthShell` do fidexa e com "brikz | Trava-AP":
  - **Login:** Google, e-mail e senha, "Esqueceu?" e mostrar/ocultar senha. Sem "Criar conta", porque as contas são criadas no admin do IAM.
  - **Esqueci a senha.**
  - **Redefinir senha:** rota `/reset-password?uid&token`.
  - **Trocar senha:** obrigatória quando `must_change_password` vier ligado.
  
  O `Login.tsx` atual é substituído. O `Register` e o `handleRegister` do `App.tsx` saem.
- **`AuthGate`:** em `App.tsx`, sem sessão o app mostra o login. A detecção usa o `pathname` (`/reset-password`) e o hash (`#access=`), porque o app não tem router. O nginx já devolve o `index.html` para qualquer rota.
- **Header:** mostra o nome e o e-mail do usuário real (`user` da sessão), e "Sair" chama `signOut()`.

## Fora do escopo

- Proteger as rotas abertas do contratos (pendência já conhecida).
- `financiador_id` por usuário e mais de um financiador.
- Permissões e papéis no AP.
- MFA.
- Remover a chave de homolog dos backends, o que deve ser feito depois da virada.

## Riscos

- **Deploy do IAM afeta o fidexa.** Mitigação: as mudanças são aditivas e o comportamento padrão continua igual quando `return_to` está ausente ou inválido. Os testes do IAM precisam passar.
- **Push na `master` dos backends dispara deploy em produção.** Mitigação: aceitar duas chaves é aditivo; os tokens atuais continuam válidos.
- **Login com Google de um usuário que não existe no IAM devolve 403**, como já acontece no fidexa.

## Verificação

1. Testes de cada repositório:
   - IAM: `python manage.py test apps.users`, que precisa de Postgres (ver o runbook).
   - Backends: `pytest shared/tests/test_jwt_auth.py`.
   - Front: `npm test`, contagem de erros do `tsc` e `vite build`.
2. Fim a fim no `ap.brikz.ai`, feito pelo usuário com a própria conta: login por e-mail e senha, login pelo Google, telas com dados, "Sair" e "esqueci a senha".
