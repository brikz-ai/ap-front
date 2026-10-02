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
  assert.match(html, /<link rel="icon" href="\/favicon\.ico"/);
  assert.match(html, /<link rel="icon" type="image\/png" sizes="32x32" href="\/brand\/favicon-32\.png"/);
  for (const f of ['public/favicon.ico', 'public/brand/favicon-32.png', 'public/brand/favicon-180.png']) {
    assert.ok(existsSync(new URL(`../${f}`, import.meta.url)), f);
  }
});

test('sidebar expandida mostra o logo brikz', () => {
  const sidebar = read('src/components/Sidebar.tsx');
  assert.match(sidebar, /src="\/brand\/logo-on-light\.png"/);
  assert.match(sidebar, /alt="brikz"/);
});

test('login tem painel ink com logo on-dark', () => {
  const shell = read('src/components/auth/AuthShell.tsx');
  assert.match(shell, /bg-black/);
  assert.match(shell, /src="\/brand\/logo-on-dark\.png"/);
  assert.match(shell, /src="\/brand\/logo-on-light\.png"/);
});

test('copy do login segue o DS (sem exclamacao)', () => {
  for (const f of ['AuthShell', 'LoginScreen']) {
    const src = read(`src/components/auth/${f}.tsx`);
    const jsxText = [...src.matchAll(/>([^<>{}]+)</g)].map(m => m[1]).join(' ');
    assert.doesNotMatch(jsxText, /!/, f);
    const literals = [...src.matchAll(/'([^'\n]*)'/g)].map(m => m[1]).filter(t => /\s/.test(t)).join(' ');
    assert.doesNotMatch(literals, /!/, f);
  }
});

test('nome do produto ao lado do logo (Trava-AP na sidebar, AP no login)', () => {
  assert.match(read('src/components/Sidebar.tsx'), />Trava-AP</);
  assert.match(read('src/components/auth/AuthShell.tsx'), />AP</);
});
