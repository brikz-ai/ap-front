import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('App.tsx nao importa mais Login/Register nem usa isAuthenticated', () => {
  const app = read('src/App.tsx');
  assert.doesNotMatch(app, /from '\.\/components\/Login'/);
  assert.doesNotMatch(app, /from '\.\/components\/Register'/);
  assert.doesNotMatch(app, /handleRegister|isAuthenticated/);
  assert.match(app, /consumeLoginHash/);
  assert.match(app, /onSessionChange/);
  assert.match(app, /must_change_password/);
  assert.match(app, /'\/reset-password'/);
});

test('LoginScreen tem Entrar com Google e nao oferece criar conta', () => {
  const login = read('src/components/auth/LoginScreen.tsx');
  assert.match(login, /Entrar com Google/);
  assert.match(login, /ou com e-mail/);
  assert.doesNotMatch(login, /Criar conta/i);
});

test('Header usa o usuario da sessao', () => {
  const header = read('src/components/Header.tsx');
  assert.match(header, /user\.name/);
  assert.match(header, /user\.email/);
  assert.doesNotMatch(header, /ricardo\.lima@ideen\.tech/);
});
