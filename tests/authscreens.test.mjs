import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('App.tsx usa a sessao do Keycloak e nao tem mais o fluxo do IAM', () => {
  const app = read('src/App.tsx');
  assert.doesNotMatch(app, /from '\.\/components\/Login'/);
  assert.doesNotMatch(app, /from '\.\/components\/Register'/);
  assert.doesNotMatch(app, /handleRegister|isAuthenticated/);
  assert.doesNotMatch(app, /consumeLoginHash|must_change_password|reset-password|ChangePassword|ForgotPassword/);
  assert.match(app, /iniciarSessao/);
  assert.match(app, /onSessionChange/);
  assert.match(app, /LOGIN_PATH/);
});

test('telas de senha do IAM foram removidas', () => {
  for (const f of ['ForgotPasswordScreen', 'ResetPasswordScreen', 'ChangePasswordScreen']) {
    assert.ok(!existsSync(new URL(`../src/components/auth/${f}.tsx`, import.meta.url)), f);
  }
});

test('LoginScreen: Google direto e e-mail sem campo de senha', () => {
  const login = read('src/components/auth/LoginScreen.tsx');
  assert.match(login, /Entrar com Google/);
  assert.match(login, /google: true/);
  assert.match(login, /ou com e-mail/);
  assert.doesNotMatch(login, /type="password"|PasswordInput|current-password/);
  assert.doesNotMatch(login, /Criar conta/i);
});

test('auth.ts usa oidc-client-ts com PKCE e sem chamadas ao IAM', () => {
  const auth = read('src/auth/auth.ts');
  assert.match(auth, /from 'oidc-client-ts'/);
  assert.match(auth, /response_type: 'code'/);
  assert.match(auth, /automaticSilentRenew: true/);
  assert.match(auth, /VITE_KEYCLOAK_ISSUER/);
  assert.match(auth, /VITE_KEYCLOAK_CLIENT_ID/);
  assert.doesNotMatch(auth, /api\/auth|VITE_AUTH_API_URL/);
});

test('Header usa o usuario da sessao', () => {
  const header = read('src/components/Header.tsx');
  assert.match(header, /user\.name/);
  assert.match(header, /user\.email/);
  assert.doesNotMatch(header, /ricardo\.lima@ideen\.tech/);
});

test('DataProvider fica dentro do guard, chaveado pelo id do usuario', () => {
  assert.doesNotMatch(read('src/main.tsx'), /DataProvider/);
  assert.match(read('src/App.tsx'), /<DataProvider key=\{session\.user\.id\}>/);
});
