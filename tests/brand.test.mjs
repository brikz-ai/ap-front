import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('logos oficiais publicados', () => {
  for (const f of ['logo-on-light.png', 'logo-on-dark.png', 'logo-transparent.png']) {
    assert.ok(existsSync(new URL(`../public/brand/${f}`, import.meta.url)), f);
  }
});

test('index.html em pt-BR com favicon brikz', () => {
  const html = read('index.html');
  assert.match(html, /<html lang="pt-BR">/);
  assert.match(html, /<link rel="icon" type="image\/png" href="\/brand\/logo-transparent\.png"/);
});

test('sidebar expandida mostra o logo brikz', () => {
  const sidebar = read('src/components/Sidebar.tsx');
  assert.match(sidebar, /src="\/brand\/logo-on-light\.png"/);
  assert.match(sidebar, /alt="brikz"/);
});

test('login tem painel ink com logo on-dark', () => {
  const login = read('src/components/Login.tsx');
  assert.match(login, /bg-black/);
  assert.match(login, /src="\/brand\/logo-on-dark\.png"/);
  assert.match(login, /src="\/brand\/logo-on-light\.png"/);
});

test('copy do login segue o DS (sem exclamacao)', () => {
  const login = read('src/components/Login.tsx');
  const jsxText = [...login.matchAll(/>([^<>{}]+)</g)].map(m => m[1]).join(' ');
  assert.doesNotMatch(jsxText, /!/);
});
