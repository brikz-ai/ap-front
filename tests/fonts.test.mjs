import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
const urls = [...css.matchAll(/url\(['"]?(\/fonts\/[^'")]+)['"]?\)/g)].map(m => m[1]);

test('index.css declara as tres familias brikz', () => {
  for (const family of ['Inter', 'Space Grotesk', 'JetBrains Mono']) {
    assert.match(css, new RegExp(`font-family:\\s*'${family}'`), family);
  }
});

test('todas as urls de fonte existem', () => {
  assert.ok(urls.length >= 9, `esperava >= 9 urls, achou ${urls.length}`);
  for (const url of urls) {
    assert.ok(existsSync(new URL(`../public${url}`, import.meta.url)), `arquivo ausente: public${url}`);
  }
});
