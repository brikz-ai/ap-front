import { test } from 'node:test';
import assert from 'node:assert/strict';
import resolveConfig from 'tailwindcss/resolveConfig.js';
import config from '../tailwind.config.js';
import { scales, paletteMap } from '../src/styles/brikzTokens.js';

const theme = resolveConfig(config).theme;
const SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
const TAILWIND_DEFAULT_PALETTES = [
  'slate', 'gray', 'zinc', 'neutral', 'stone', 'red', 'orange', 'amber', 'yellow', 'lime', 'green',
  'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
];

test('cada escala tem os 11 shades', () => {
  for (const [name, scale] of Object.entries(scales)) {
    assert.deepEqual(Object.keys(scale), SHADES, `escala ${name}`);
  }
});

test('todas as paletas default do Tailwind sao brikz', () => {
  for (const palette of TAILWIND_DEFAULT_PALETTES) {
    const target = paletteMap[palette];
    assert.ok(target, `paleta ${palette} sem mapeamento`);
    for (const shade of SHADES) {
      assert.equal(theme.colors[palette][shade], scales[target][shade], `${palette}-${shade}`);
    }
  }
});

test('primario e ink: blue-600 preto, blue-700 #000', () => {
  assert.equal(theme.colors.blue['600'], '#0a0a0a');
  assert.equal(theme.colors.blue['700'], '#000000');
  assert.equal(theme.colors.emerald['600'], '#0a0a0a');
  assert.equal(theme.colors.purple['50'], '#fafafa');
});

test('cyan e o accent explicito', () => {
  assert.equal(theme.colors.cyan['600'], '#0891b2');
  assert.equal(theme.colors.cyan['700'], '#0e7490');
  assert.equal(theme.colors.accent.DEFAULT, '#0891b2');
});

test('ring e border de focus continuam cyan', () => {
  for (const p of ['blue', 'emerald', 'teal', 'indigo', 'purple']) {
    assert.equal(theme.ringColor[p]['500'], '#06b6d4', `ring ${p}-500`);
    assert.equal(theme.borderColor[p]['500'], '#06b6d4', `border ${p}-500`);
    assert.equal(theme.borderColor[p]['600'], '#0891b2', `border ${p}-600`);
    assert.equal(theme.borderColor[p]['200'], '#e5e7eb', `border ${p}-200 fica hairline`);
  }
});

test('cinza e ink brikz', () => {
  assert.equal(theme.colors.gray['900'], '#0a0a0a');
  assert.equal(theme.colors.gray['200'], '#e5e7eb');
});

test('status usam a paleta data do DS', () => {
  assert.equal(theme.colors.green['500'], '#00a87e');
  assert.equal(theme.colors.red['500'], '#e23b4a');
  assert.equal(theme.colors.amber['500'], '#ec7e00');
});

test('raios seguem a escala do DS', () => {
  assert.equal(theme.borderRadius.xl, '10px');
  assert.equal(theme.borderRadius['2xl'], '12px');
  assert.equal(theme.borderRadius['3xl'], '16px');
});

test('fontes brikz', () => {
  assert.equal(theme.fontFamily.sans[0], 'Inter');
  assert.equal(theme.fontFamily.display[0], 'Space Grotesk');
  assert.equal(theme.fontFamily.mono[0], 'JetBrains Mono');
});

test('preserva white, black e transparent', () => {
  assert.equal(theme.colors.white, '#fff');
  assert.equal(theme.colors.black, '#000');
  assert.equal(theme.colors.transparent, 'transparent');
});
