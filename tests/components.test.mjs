import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import postcss from 'postcss';
import tailwind from 'tailwindcss';
import config from '../tailwind.config.js';

const CLASSES = [
  'btn', 'btn-primary', 'btn-soft', 'btn-ghost', 'btn-accent', 'btn-sm', 'chips', 'chip', 'chip-on',
  'input-soft', 'select-soft', 'panel', 'panel-head', 'panel-title', 'panel-meta', 'table-brikz',
  'label-mono', 'eyebrow', 'line-accent', 'tag', 'status', 'status-ready', 'status-idle',
  'status-success', 'status-warning', 'status-danger', 'app-canvas',
];

const source = readFileSync(new URL('../src/styles/brikz-components.css', import.meta.url), 'utf8');
const { css } = await postcss([
  tailwind({ ...config, content: [{ raw: `<div class="${CLASSES.join(' ')}"></div>` }] }),
]).process(`@tailwind components;\n${source}`, { from: undefined });

test('todas as classes da camada sao geradas', () => {
  for (const c of CLASSES) assert.match(css, new RegExp(`\\.${c}[\\s{:,.]`), `.${c} ausente`);
});

test('btn-primary e preto do DS e btn-accent e cyan', () => {
  assert.match(css, /\.btn-primary\s*\{[^}]*background-color:\s*var\(--ink-1\)/);
  assert.match(css, /\.btn-accent\s*\{[^}]*background-color:\s*var\(--cyan-700\)/);
});

test('cabecalho de tabela e label em mono', () => {
  assert.match(css, /\.table-brikz th\s*\{[^}]*font-family:\s*var\(--font-mono\)/);
  assert.match(css, /\.label-mono\s*\{[^}]*font-family:\s*var\(--font-mono\)/);
});

test('tokens css definidos no :root', () => {
  for (const v of ['--ink-1', '--cyan-700', '--hairline', '--font-mono', '--data-5']) {
    assert.match(source, new RegExp(`${v}:`), v);
  }
});

test('index.css importa a camada', () => {
  const index = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
  assert.match(index, /@import ['"]\.\/styles\/brikz-components\.css['"]/);
});
