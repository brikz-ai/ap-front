# Brikz Design System, Fase A (rebrand via tokens): plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar a identidade visual brikz ao ap-front inteiro (cores, tipografia, raios, sombras, gráficos, logo e Login) sem tocar no layout ou no comportamento das telas de feature.

**Architecture:**
- Um módulo de tokens (`src/styles/brikzTokens.js`) alimenta o `tailwind.config.js`. O config sobrescreve **todas** as 22 paletas default do Tailwind com 5 escalas brikz: accent cyan, ink, sucesso, erro e alerta. Assim as cerca de 8.500 classes existentes mudam de cor sem editar os arquivos.
- Fontes e logos são servidos de `public/`.
- As cores de gráficos ficam centralizadas em `src/styles/chartColors.ts`.
- Os testes usam `node:test`, nativo do Node 25. Nenhuma dependência nova.

**Tech Stack:** Vite 5, React 18, TypeScript 5.5, Tailwind 3.4, recharts 3, Node 25 (`node --test`, que roda `.ts` nativamente).

**Spec:** `docs/superpowers/specs/2026-10-01-brikz-design-system-design.md`

**Fonte do DS:** `C:\DEV\brikz\Brikz Design System\dist\` (`fonts/`, `logo/`, `tokens.js`)

## Global Constraints

- **Accent único:** cyan.
  - Na posição Tailwind `600` fica `#0891b2` (accent do DS).
  - Na `700` fica `#0e7490` (hover do DS).
- Escalas exatas: copiar **literalmente** da tabela da Task 1. Ela é a mesma da seção 2 da spec.
- `--data-*` (`#0891b2 #5B7FFF #00A87E #EC7E00 #E23B4A #8B5CF6`) são usados **só** em gráficos.
- O nome da marca é sempre `brikz`, minúsculo.
- Não inventar logo. Usar só os PNGs de `dist/logo/`.
- Copy em PT-BR, sem ponto de exclamação e sem os padrões "Não X. É Y." / "De X a Y".
- No máximo um elemento cyan saturado (`#00ffff`) por viewport, e apenas dentro do painel `.ink`.
- Nenhuma dependência nova no `package.json`. Só o script `"test"`.
- Não alterar layout nem lógica das telas de feature, exceto nos pontos listados nas Tasks 3 e 5.
- Baselines:
  - `npx tsc --noEmit -p tsconfig.app.json` tem **96** erros pré-existentes, e esse número não pode subir.
  - `npx vite build` passa e deve continuar passando.
- O repo tem `package-lock.json` e `pnpm-lock.yaml`. Não rodar install, porque nada novo é instalado.

## Review Focus

1. **Paleta default esquecida.** Uma classe como `bg-fuchsia-500` ou `text-stone-600` em qualquer arquivo continuaria com a cor do Tailwind. O esperado é que todas as 22 paletas default resolvam para uma escala brikz. Teste na Task 1: `todas as paletas default do Tailwind sao brikz`.
2. **Shade faltando.** Um shade ausente (ex.: `bg-blue-950` ou `text-gray-150`) quebra o build ou fica sem cor. O esperado é que toda escala tenha os 11 shades, de 50 a 950. Teste na Task 1: `cada escala tem os 11 shades`.
3. **Fonte com 404.** Se o `url()` do `@font-face` aponta para um arquivo que não existe, o app cai silenciosamente para a fonte do sistema. O esperado é que todo `url(/fonts/...)` do `index.css` exista em `public/`. Teste na Task 2: `todas as urls de fonte existem`.
4. **Hex arbitrário fora do token.** Classes como `bg-[#0e4d64]` ou `style={{ backgroundColor: '#CC1717' }}` escapam do remapeamento. O esperado é que os 7 arquivos com hex não tenham mais nenhum literal. Teste na Task 3: `nenhum hex literal nos arquivos de grafico`.
5. **Adquirente com nome variante.** "Mercado Pago" (com espaço) ou "CIELO S.A." passariam a cair no cinza "desconhecida". O esperado é que o casamento ignore caixa e espaços e use `includes`. Teste na Task 3: `getAcquirerColor normaliza nome`.

---

## File Structure

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `src/styles/brikzTokens.js` | Criar | Fonte única dos valores brikz: escalas, aliases, data viz, raios, sombras e fontes. É JS puro, porque é importado pelo `tailwind.config.js` e pelos testes. |
| `tailwind.config.js` | Modificar | Mapeia as 22 paletas Tailwind para as escalas brikz, mais aliases, `fontFamily`, `borderRadius`, `boxShadow` e easing. |
| `tests/theme.test.mjs` | Criar | Testa o config resolvido (Review Focus 1 e 2). |
| `public/fonts/*.ttf` | Criar (cópia) | Fontes self-hosted. |
| `src/index.css` | Modificar | `@font-face` e `@layer base` (body e headings). |
| `tests/fonts.test.mjs` | Criar | Testa as urls de fonte (Review Focus 3). |
| `src/styles/chartColors.ts` | Criar | `CHART_COLORS`, `CHART_SEMANTIC`, `CHART_AXIS` e `getAcquirerColor()`. |
| `tests/chartColors.test.mjs` | Criar | Testa as cores de gráfico e a ausência de hex (Review Focus 4 e 5). |
| 7 componentes com hex | Modificar | Usar `chartColors.ts` e trocar hex arbitrário por classe. |
| `public/brand/*.png` | Criar (cópia) | Logos oficiais. |
| `index.html` | Modificar | `lang`, favicon e `theme-color`. |
| `src/components/Sidebar.tsx` | Modificar | Logo no header da sidebar expandida. |
| `src/components/Login.tsx` | Modificar | Split com painel `.ink` e correções de copy. |
| `docs/superpowers/specs/2026-10-01-brikz-revisao-categorias.md` | Criar | Lista os pontos onde purple, teal ou violet distinguiam categorias. |
| `package.json` | Modificar | Script `"test"`. |

**Desvio deliberado da spec:** o logo vai na **Sidebar expandida** e no **Login**, não no Header. O Header fica à direita da sidebar e mostra o título da página. Repetir o logo nele duplicaria a marca na mesma viewport. Com a sidebar recolhida (64px), não cabe o wordmark, então fica só o botão de expandir, como hoje.

---

### Task 1: Tokens brikz e remapeamento do Tailwind

**Files:**
- Create: `src/styles/brikzTokens.js`
- Modify: `tailwind.config.js`
- Modify: `package.json` (script `test`)
- Test: `tests/theme.test.mjs`

**Interfaces:**
- Produces:
  - `brikzTokens.js` exporta `scales` (`{ accent, ink, success, danger, warning }`, cada uma `Record<'50'|'100'|…|'950', string>`).
  - Também exporta `paletteMap` (`Record<string, keyof scales>`), `semantic`, `dataViz` (array de 6 hex), `fontFamily`, `borderRadius`, `boxShadow` e `easeOut`.

- [ ] **Step 1: Adicionar o script de teste no `package.json`**

Em `"scripts"`, adicionar depois de `"preview"`:

```json
    "preview": "vite preview",
    "test": "node --test tests/"
```

- [ ] **Step 2: Escrever o teste que falha (`tests/theme.test.mjs`)**

```js
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

test('accent do DS na posicao 600 e hover na 700', () => {
  assert.equal(theme.colors.blue['600'], '#0891b2');
  assert.equal(theme.colors.blue['700'], '#0e7490');
  assert.equal(theme.colors.accent.DEFAULT, '#0891b2');
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
```

- [ ] **Step 3: Rodar e confirmar que falha**

Run: `npm test`
Expected: FAIL, com `Cannot find module '.../src/styles/brikzTokens.js'`.

- [ ] **Step 4: Criar `src/styles/brikzTokens.js`**

```js
// Valores do Brikz Design System (C:\DEV\brikz\Brikz Design System\dist\tokens.js),
// adaptados as posicoes de shade do Tailwind. Fonte unica para tailwind.config.js e testes.

const accent = {
  50: '#ecfeff', 100: '#cffafe', 200: '#a5f3fc', 300: '#67e8f9', 400: '#22d3ee', 500: '#06b6d4',
  600: '#0891b2', // accent do DS (--cyan-700)
  700: '#0e7490', // hover do DS (--cyan-600)
  800: '#155e75', 900: '#164e63', 950: '#083344',
};

const ink = {
  50: '#fafafa', 100: '#f4f4f5', 200: '#e5e7eb', 300: '#d4d4d8', 400: '#a3a3a3', 500: '#737373',
  600: '#525252', 700: '#404040', 800: '#1f1f1f', 900: '#0a0a0a', 950: '#000000',
};

// --data-3
const success = {
  50: '#e6f7f2', 100: '#c2ecdf', 200: '#8fdcc5', 300: '#52c8a6', 400: '#1fb68d', 500: '#00a87e',
  600: '#00956f', 700: '#007a5b', 800: '#005f47', 900: '#004533', 950: '#002a1f',
};

// --data-5
const danger = {
  50: '#fdecee', 100: '#fad4d8', 200: '#f5a9b0', 300: '#ee7b86', 400: '#e85865', 500: '#e23b4a',
  600: '#c92d3b', 700: '#a8232f', 800: '#851c26', 900: '#63151c', 950: '#3d0c11',
};

// --data-4
const warning = {
  50: '#fef4e6', 100: '#fde5c2', 200: '#fbcb8a', 300: '#f6ac4f', 400: '#f19322', 500: '#ec7e00',
  600: '#c96b00', 700: '#a35700', 800: '#7d4300', 900: '#5a3000', 950: '#361d00',
};

export const scales = { accent, ink, success, danger, warning };

// O DS tem um unico accent: todo matiz decorativo do Tailwind vira cyan.
export const paletteMap = {
  blue: 'accent', sky: 'accent', indigo: 'accent', cyan: 'accent', teal: 'accent', emerald: 'accent',
  purple: 'accent', violet: 'accent', fuchsia: 'accent',
  slate: 'ink', gray: 'ink', zinc: 'ink', neutral: 'ink', stone: 'ink',
  green: 'success', lime: 'success',
  red: 'danger', rose: 'danger', pink: 'danger',
  yellow: 'warning', amber: 'warning', orange: 'warning',
};

export const semantic = {
  accent: { DEFAULT: '#0891b2', hover: '#0e7490', subtle: '#ecfeff', bright: '#00ffff' },
  ink: { 1: '#0a0a0a', 2: '#1f1f1f', 3: '#525252', 4: '#737373', 5: '#a3a3a3' },
  paper: '#f4f4f5',
  hairline: '#e5e7eb',
  fg: { 1: '#0a0a0a', 2: '#1f1f1f', 3: '#525252', 4: '#737373' },
  // texto sobre fundo .ink (--fg-ink-2 / --fg-ink-3)
  'fg-ink': { 2: '#b3b3b3', 3: '#808080' },
};

export const dataViz = ['#0891b2', '#5B7FFF', '#00A87E', '#EC7E00', '#E23B4A', '#8B5CF6'];

export const fontFamily = {
  sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
  display: ['Space Grotesk', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'ui-monospace', 'Menlo', 'monospace'],
};

export const borderRadius = {
  none: '0px', sm: '4px', DEFAULT: '6px', md: '6px', lg: '8px', xl: '10px', '2xl': '12px', '3xl': '16px',
  full: '9999px',
};

const shadowCard = '0 1px 3px rgba(15,23,42,.06), 0 1px 2px rgba(15,23,42,.04)';
const shadowLift = '0 12px 32px rgba(15,23,42,.10)';
export const boxShadow = {
  sm: shadowCard, DEFAULT: shadowCard, md: shadowCard, lg: shadowLift, xl: shadowLift, '2xl': shadowLift,
  glow: '0 8px 24px rgba(8,145,178,.25), 0 0 0 1px rgba(8,145,178,.10)',
};

export const easeOut = 'cubic-bezier(0.16, 1, 0.3, 1)';
```

- [ ] **Step 5: Reescrever `tailwind.config.js`**

```js
import { scales, paletteMap, semantic, fontFamily, borderRadius, boxShadow, easeOut } from './src/styles/brikzTokens.js';

// Brikz Design System, fase A: os nomes de paleta do Tailwind (blue, gray, purple...) sao
// ALIASES das escalas brikz. `bg-blue-600` renderiza o accent cyan #0891b2. Mapeamento em
// src/styles/brikzTokens.js (paletteMap). Codigo novo deve preferir accent / ink / fg / paper / hairline.
const remappedPalettes = Object.fromEntries(
  Object.entries(paletteMap).map(([palette, scale]) => [palette, scales[scale]]),
);

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    fontFamily,
    borderRadius,
    extend: {
      colors: { ...remappedPalettes, ...semantic },
      boxShadow,
      transitionTimingFunction: { DEFAULT: easeOut, out: easeOut },
    },
  },
  plugins: [],
};
```

- [ ] **Step 6: Rodar os testes e confirmar que passam**

Run: `npm test`
Expected: PASS nos 8 testes.

- [ ] **Step 7: Confirmar que o build continua passando**

Run: `npx vite build`
Expected: `✓ built in ...`, sem erro.

- [ ] **Step 8: Commit**

```bash
git add package.json tailwind.config.js src/styles/brikzTokens.js tests/theme.test.mjs
git commit -m "feat: remapeia paletas do Tailwind para os tokens do Brikz Design System"
```

---

### Task 2: Fontes self-hosted e tipografia base

**Files:**
- Create: `public/fonts/` (cópia de 9 TTF de `C:\DEV\brikz\Brikz Design System\dist\fonts\`)
- Modify: `src/index.css`
- Test: `tests/fonts.test.mjs`

**Interfaces:**
- Consumes: `fontFamily` da Task 1, cujos nomes `Inter`, `Space Grotesk` e `JetBrains Mono` precisam bater com o `font-family` dos `@font-face`.
- Produces: as classes `font-sans` (default do body), `font-display` e `font-mono` passam a funcionar.

- [ ] **Step 1: Escrever o teste que falha (`tests/fonts.test.mjs`)**

```js
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
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test`
Expected: FAIL em `index.css declara as tres familias brikz`.

- [ ] **Step 3: Copiar as fontes**

```bash
mkdir -p public/fonts
cp "/c/DEV/brikz/Brikz Design System/dist/fonts/"*.ttf public/fonts/
ls public/fonts
```

Expected: 9 arquivos:
- `Inter-Italic-VariableFont_opsz_wght.ttf`
- `Inter-VariableFont_opsz_wght.ttf`
- `JetBrainsMono-Italic-VariableFont_wght.ttf`
- `JetBrainsMono-VariableFont_wght.ttf`
- `SpaceGrotesk-Bold.ttf`
- `SpaceGrotesk-Light.ttf`
- `SpaceGrotesk-Medium.ttf`
- `SpaceGrotesk-Regular.ttf`
- `SpaceGrotesk-SemiBold.ttf`

- [ ] **Step 4: Adicionar `@font-face` e a camada base em `src/index.css`**

Inserir **antes** de `@tailwind base;`:

```css
/* Brikz Design System: fontes self-hosted (public/fonts) */
@font-face { font-family: 'Inter'; src: url('/fonts/Inter-VariableFont_opsz_wght.ttf') format('truetype'); font-weight: 100 900; font-style: normal; font-display: swap; }
@font-face { font-family: 'Inter'; src: url('/fonts/Inter-Italic-VariableFont_opsz_wght.ttf') format('truetype'); font-weight: 100 900; font-style: italic; font-display: swap; }
@font-face { font-family: 'Space Grotesk'; src: url('/fonts/SpaceGrotesk-Light.ttf') format('truetype'); font-weight: 300; font-display: swap; }
@font-face { font-family: 'Space Grotesk'; src: url('/fonts/SpaceGrotesk-Regular.ttf') format('truetype'); font-weight: 400; font-display: swap; }
@font-face { font-family: 'Space Grotesk'; src: url('/fonts/SpaceGrotesk-Medium.ttf') format('truetype'); font-weight: 500; font-display: swap; }
@font-face { font-family: 'Space Grotesk'; src: url('/fonts/SpaceGrotesk-SemiBold.ttf') format('truetype'); font-weight: 600; font-display: swap; }
@font-face { font-family: 'Space Grotesk'; src: url('/fonts/SpaceGrotesk-Bold.ttf') format('truetype'); font-weight: 700; font-display: swap; }
@font-face { font-family: 'JetBrains Mono'; src: url('/fonts/JetBrainsMono-VariableFont_wght.ttf') format('truetype'); font-weight: 100 800; font-style: normal; font-display: swap; }
@font-face { font-family: 'JetBrains Mono'; src: url('/fonts/JetBrainsMono-Italic-VariableFont_wght.ttf') format('truetype'); font-weight: 100 800; font-style: italic; font-display: swap; }
```

Inserir **depois** de `@tailwind utilities;` e antes do `@layer utilities` existente:

```css
@layer base {
  body {
    @apply font-sans text-gray-900 bg-white antialiased;
  }

  h1, h2, h3 {
    @apply font-display;
    letter-spacing: -0.03em;
  }
}
```

- [ ] **Step 5: Rodar os testes e confirmar que passam**

Run: `npm test`
Expected: PASS em todos (Task 1 e Task 2).

- [ ] **Step 6: Confirmar o build**

Run: `npx vite build`
Expected: `✓ built`, sem aviso de `url(/fonts/...)` não resolvida. O Vite deixa URLs absolutas de `public/` intactas.

- [ ] **Step 7: Commit**

```bash
git add public/fonts src/index.css tests/fonts.test.mjs
git commit -m "feat: fontes self-hosted do brikz (Inter, Space Grotesk, JetBrains Mono)"
```

---

### Task 3: Cores de gráficos e remoção de hex arbitrário

**Files:**
- Create: `src/styles/chartColors.ts`
- Modify:
  - `src/components/ChargebackMonitoringModule.tsx`: linhas 25-34 (map), 261, 264, 269 e 306
  - `src/components/LiquidationProblemModule.tsx`: linhas 25-34, 275, 278, 283 e 320
  - `src/components/ContractDetail.tsx`: linhas 58-72, 448 e 468
  - `src/components/ReceivablesFlowChart.tsx`: linhas 133, 136, 140, 152, 160 e 162
  - `src/components/ClientRadar.tsx`: linhas 524, 532, 533, 546 e 561
  - `src/components/DailyMonitoringDashboard.tsx`: linhas 128, 142, 158 e 178
  - `src/components/GuaranteeProblemsBoard.tsx`: linha 227
- Test: `tests/chartColors.test.mjs`

**Interfaces:**
- Consumes: `dataViz` e `scales` de `src/styles/brikzTokens.js`, usados apenas no teste para conferir os valores.
- Produces, em `src/styles/chartColors.ts`:
  - `CHART_COLORS: readonly string[]` (6 cores);
  - `CHART_SEMANTIC: { accent; success; danger; warning; neutral }`;
  - `CHART_AXIS: { grid: string; tick: string }`;
  - `getAcquirerColor(name: string): string`.

- [ ] **Step 1: Escrever o teste que falha (`tests/chartColors.test.mjs`)**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CHART_COLORS, CHART_SEMANTIC, CHART_AXIS, getAcquirerColor } from '../src/styles/chartColors.ts';
import { dataViz, scales } from '../src/styles/brikzTokens.js';

test('CHART_COLORS e a paleta data do DS', () => {
  assert.deepEqual([...CHART_COLORS], dataViz);
});

test('semanticas batem com as escalas brikz', () => {
  assert.equal(CHART_SEMANTIC.accent, scales.accent['600']);
  assert.equal(CHART_SEMANTIC.success.toLowerCase(), scales.success['500']);
  assert.equal(CHART_SEMANTIC.danger.toLowerCase(), scales.danger['500']);
  assert.equal(CHART_SEMANTIC.warning.toLowerCase(), scales.warning['500']);
  assert.equal(CHART_SEMANTIC.neutral, scales.ink['400']);
  assert.equal(CHART_AXIS.grid, scales.ink['200']);
  assert.equal(CHART_AXIS.tick, scales.ink['400']);
});

test('getAcquirerColor: adquirentes conhecidas tem cores distintas', () => {
  const names = ['Cielo', 'Rede', 'Getnet', 'Stone', 'PagSeguro', 'Dock', 'MercadoPago'];
  const colors = names.map(getAcquirerColor);
  assert.equal(new Set(colors).size, names.length);
  assert.ok(!colors.includes(CHART_SEMANTIC.neutral));
});

test('getAcquirerColor normaliza nome', () => {
  assert.equal(getAcquirerColor('Mercado Pago'), getAcquirerColor('MercadoPago'));
  assert.equal(getAcquirerColor('CIELO S.A.'), getAcquirerColor('Cielo'));
  assert.equal(getAcquirerColor('  stone  '), getAcquirerColor('Stone'));
});

test('getAcquirerColor: desconhecida e vazia caem no neutro', () => {
  assert.equal(getAcquirerColor('Adquirente X'), CHART_SEMANTIC.neutral);
  assert.equal(getAcquirerColor(''), CHART_SEMANTIC.neutral);
});

test('nenhum hex literal nos arquivos de grafico', () => {
  const files = [
    'ChargebackMonitoringModule', 'ClientRadar', 'ContractDetail', 'DailyMonitoringDashboard',
    'GuaranteeProblemsBoard', 'LiquidationProblemModule', 'ReceivablesFlowChart',
  ];
  for (const f of files) {
    const src = readFileSync(new URL(`../src/components/${f}.tsx`, import.meta.url), 'utf8');
    const hits = src.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g) ?? [];
    assert.deepEqual(hits, [], `${f}.tsx ainda tem hex: ${hits.join(', ')}`);
  }
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test`
Expected: FAIL com `Cannot find module '.../src/styles/chartColors.ts'`.

- [ ] **Step 3: Criar `src/styles/chartColors.ts`**

Só sintaxe TS apagável (sem `enum`), porque o arquivo é importado pelo `node --test`.

```ts
// Cores de graficos do Brikz Design System (--data-1..6). Usar SO em graficos.
export const CHART_COLORS = ['#0891b2', '#5B7FFF', '#00A87E', '#EC7E00', '#E23B4A', '#8B5CF6'] as const;

export const CHART_SEMANTIC = {
  accent: '#0891b2',
  success: '#00A87E',
  danger: '#E23B4A',
  warning: '#EC7E00',
  neutral: '#a3a3a3',
};

export const CHART_AXIS = {
  grid: '#e5e7eb',
  tick: '#a3a3a3',
};

// Chaves normalizadas (minusculas, sem espacos/pontuacao). Casamento por `includes`.
const ACQUIRER_COLORS: Record<string, string> = {
  cielo: CHART_COLORS[1],
  rede: CHART_COLORS[4],
  getnet: CHART_COLORS[3],
  stone: CHART_COLORS[2],
  pagseguro: CHART_COLORS[5],
  dock: CHART_COLORS[0],
  mercadopago: '#525252',
};

export function getAcquirerColor(name: string): string {
  const key = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!key) return CHART_SEMANTIC.neutral;
  for (const [acquirer, color] of Object.entries(ACQUIRER_COLORS)) {
    if (key.includes(acquirer)) return color;
  }
  return CHART_SEMANTIC.neutral;
}
```

- [ ] **Step 4: Rodar só os testes de cor (exceto o de hex) e confirmar que passam**

Run: `node --test tests/chartColors.test.mjs`
Expected: PASS em 5 testes e FAIL apenas em `nenhum hex literal nos arquivos de grafico`, que lista os 7 arquivos.

- [ ] **Step 5: `ChargebackMonitoringModule.tsx`**

- Remover o bloco `const ACQUIRER_COLORS: Record<string, string> = { ... };` (linhas 25-34).
- Adicionar o import junto aos outros:

```ts
import { CHART_AXIS, getAcquirerColor } from '../styles/chartColors';
```

- Linha 261: `stroke="#f0f0f0"` vira `stroke={CHART_AXIS.grid}`.
- Linhas 264 e 269: `stroke="#94a3b8"` vira `stroke={CHART_AXIS.tick}`.
- Linha 306: `fill={ACQUIRER_COLORS[acquirer] ?? ACQUIRER_COLORS.default}` vira `fill={getAcquirerColor(acquirer)}`.

- [ ] **Step 6: `LiquidationProblemModule.tsx`**

As mesmas trocas do Step 5:
- remover o map nas linhas 25-34;
- importar `CHART_AXIS` e `getAcquirerColor` de `'../styles/chartColors'`;
- linha 275 passa a usar `CHART_AXIS.grid`;
- linhas 278 e 283 passam a usar `CHART_AXIS.tick`;
- linha 320: `fill={getAcquirerColor(acquirer)}`.

- [ ] **Step 7: `ContractDetail.tsx`**

- Remover `const ACQUIRER_COLORS` e a função local `getAcquirerColor` (linhas 58-72).
- Adicionar:

```ts
import { CHART_AXIS, CHART_SEMANTIC, getAcquirerColor } from '../styles/chartColors';
```

- Linha 448: `stroke="#e5e7eb"` vira `stroke={CHART_AXIS.grid}`.
- Linha 468: `stroke="#ef4444"` vira `stroke={CHART_SEMANTIC.danger}`.
- Os usos de `getAcquirerColor(entry.acquirer)` nas linhas 458, 463 e 468 continuam iguais, porque a assinatura é a mesma.

- [ ] **Step 8: `ReceivablesFlowChart.tsx`**

- Importar `CHART_AXIS` e `CHART_SEMANTIC` de `'../styles/chartColors'`.
- Linha 133: `stroke={CHART_AXIS.grid}`.
- Linhas 136 e 140: `stroke={CHART_AXIS.tick}`.
- Linha 152: `stroke="#3b82f6"` vira `stroke={CHART_SEMANTIC.accent}`.
- Linha 160: `stroke="#22c55e"` vira `stroke={CHART_SEMANTIC.success}`.
- Linha 162: `dot={{ fill: '#22c55e', ... }}` vira `dot={{ fill: CHART_SEMANTIC.success, strokeWidth: 2, r: 4 }}`.

- [ ] **Step 9: `ClientRadar.tsx`**

- Importar `CHART_AXIS` e `CHART_SEMANTIC` de `'../styles/chartColors'`.
- Linha 524: `scrollbarColor: '#9ca3af #e5e7eb'` vira ``scrollbarColor: `${CHART_AXIS.tick} ${CHART_AXIS.grid}` ``.
- Linhas 532 e 533: `stopColor="#10b981"` vira `stopColor={CHART_SEMANTIC.accent}`. No DS o emerald decorativo vira accent.
- Linhas 546 e 561: `"#10b981"` vira `{CHART_SEMANTIC.accent}`.

- [ ] **Step 10: `DailyMonitoringDashboard.tsx`**

Os hex aqui são classes arbitrárias de um teal antigo. Trocar por classes da escala remapeada:
- Linhas 128 e 142: `bg-[#0e4d64] text-white border-[#0e4d64]` vira `bg-blue-700 text-white border-blue-700`.
- Linha 158:
  - `focus:ring-[#137a8b]/40` vira `focus:ring-blue-600/40`;
  - `focus:border-[#137a8b]` vira `focus:border-blue-600`;
  - `border-[#137a8b] bg-[#137a8b]/5` vira `border-blue-600 bg-blue-600/5`.
- Linha 178: `focus:ring-[#137a8b]/40` vira `focus:ring-blue-600/40`, e `focus:border-[#137a8b]` vira `focus:border-blue-600`.

- [ ] **Step 11: `GuaranteeProblemsBoard.tsx`**

Linha 227: remover `style={{ backgroundColor: '#CC1717' }}`. A classe `bg-red-600` já existe e passa a resolver para o vermelho brikz.

- [ ] **Step 12: Rodar todos os testes**

Run: `npm test`
Expected: PASS em todos.

- [ ] **Step 13: Typecheck sem erros novos**

Run: `npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -c "error TS"`
Expected: `96` ou menos.

Se subir, rodar `npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -E "chartColors|ChargebackMonitoring|LiquidationProblem|ContractDetail|ReceivablesFlow|ClientRadar|DailyMonitoring|GuaranteeProblems"` e corrigir os erros novos.

- [ ] **Step 14: Commit**

```bash
git add src/styles/chartColors.ts tests/chartColors.test.mjs src/components/ChargebackMonitoringModule.tsx src/components/LiquidationProblemModule.tsx src/components/ContractDetail.tsx src/components/ReceivablesFlowChart.tsx src/components/ClientRadar.tsx src/components/DailyMonitoringDashboard.tsx src/components/GuaranteeProblemsBoard.tsx
git commit -m "feat: graficos usam a paleta data do brikz e remove hex hardcoded"
```

---

### Task 4: Marca (logo na Sidebar e `index.html`)

**Files:**
- Create: `public/brand/logo-on-light.png`, `public/brand/logo-on-dark.png`, `public/brand/logo-transparent.png` (cópias de `dist/logo/`)
- Modify:
  - `index.html`
  - `src/components/Sidebar.tsx`: linhas 263-273 (header da sidebar expandida)
- Test: `tests/brand.test.mjs`

**Interfaces:**
- Produces: as URLs públicas `/brand/logo-on-light.png`, `/brand/logo-on-dark.png` e `/brand/logo-transparent.png`. A Task 5 usa as duas primeiras.

- [ ] **Step 1: Escrever o teste que falha (`tests/brand.test.mjs`)**

```js
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
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test`
Expected: FAIL nos 3 testes de `brand.test.mjs`.

- [ ] **Step 3: Copiar os logos**

```bash
mkdir -p public/brand
cp "/c/DEV/brikz/Brikz Design System/dist/logo/"*.png public/brand/
```

- [ ] **Step 4: `index.html`**

Trocar `<html lang="en">` por `<html lang="pt-BR">`. Depois da meta `viewport`, adicionar:

```html
    <meta name="theme-color" content="#ffffff" />
    <link rel="icon" type="image/png" href="/brand/logo-transparent.png" />
```

- [ ] **Step 5: Logo no header da sidebar expandida (`Sidebar.tsx`)**

Substituir o bloco atual (linhas 263-273):

```tsx
        {/* Header */}
        <div className="flex items-center justify-end px-5 h-16 flex-shrink-0 border-b border-gray-100">
```

por:

```tsx
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-16 flex-shrink-0 border-b border-gray-100">
          <img src="/brand/logo-on-light.png" alt="brikz" className="h-7 w-auto" />
```

O `<button>` de recolher e o `</div>` de fechamento continuam iguais. A sidebar recolhida (linhas 159-170) não muda, porque o wordmark não cabe em 64px.

- [ ] **Step 6: Rodar os testes**

Run: `npm test`
Expected: PASS em todos.

- [ ] **Step 7: Commit**

```bash
git add public/brand index.html src/components/Sidebar.tsx tests/brand.test.mjs
git commit -m "feat: logo brikz na sidebar e index.html em pt-BR com favicon"
```

---

### Task 5: Login com painel `.ink`

**Files:**
- Modify: `src/components/Login.tsx`: linhas 42-48 (wrapper e cabeçalho), 152-154 (rodapé) e 170 (título com exclamação)
- Test: `tests/brand.test.mjs` (acrescentar testes)

**Interfaces:**
- Consumes: `/brand/logo-on-dark.png` e `/brand/logo-on-light.png` da Task 4; classes `font-display`, `text-accent-bright`, `text-fg-ink-2` e `text-fg-ink-3` da Task 1.
- Produces: nada novo. As props de `Login` (`onLogin`, `onSwitchToRegister`) não mudam.

- [ ] **Step 1: Acrescentar os testes que falham em `tests/brand.test.mjs`**

```js
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
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test`
Expected: FAIL em `login tem painel ink com logo on-dark` e em `copy do login segue o DS`. O segundo pega "E-mail enviado!".

- [ ] **Step 3: Wrapper em duas colunas e painel ink**

Substituir as linhas 42-48:

```tsx
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-white">
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Bem-vindo</h1>
            <p className="text-gray-600">Entre com suas credenciais para acessar o sistema</p>
          </div>
```

por:

```tsx
  return (
    <div className="min-h-screen flex bg-white">
      {/* Painel ink (Brikz DS: band preta, unico acento #00ffff) */}
      <aside className="hidden md:flex md:w-1/2 lg:w-[45%] bg-black text-white flex-col justify-between p-12">
        <img src="/brand/logo-on-dark.png" alt="brikz" className="h-9 w-auto self-start" />
        <div className="space-y-4 max-w-sm">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.25em] text-fg-ink-3">Registros de AP</p>
          <h2 className="font-display text-4xl font-semibold leading-tight text-white">
            Recebíveis registrados, travas sob controle<span className="text-accent-bright">.</span>
          </h2>
          <p className="text-sm leading-relaxed text-fg-ink-2">
            Contratos, agendas e liquidações na mesma operação.
          </p>
        </div>
        <p className="text-xs text-fg-ink-3">© 2026 brikz</p>
      </aside>

      <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-2xl p-8 space-y-6">
          <img src="/brand/logo-on-light.png" alt="brikz" className="h-8 w-auto md:hidden" />
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Bem-vindo</h1>
            <p className="text-gray-600">Entre com suas credenciais para acessar o sistema</p>
          </div>
```

- [ ] **Step 4: Fechar a coluna e ajustar o rodapé**

No rodapé (linhas 152-154):

```tsx
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>© 2025 Todos os direitos reservados</p>
        </div>
      </div>
```

substituir por:

```tsx
        <div className="mt-6 text-center text-sm text-gray-500 md:hidden">
          <p>© 2026 brikz</p>
        </div>
      </div>
      </div>
```

O `</div>` extra fecha o `<div className="flex-1 ...">` aberto no Step 3. O modal `showForgotPassword` continua filho do wrapper raiz, depois desse fechamento.

- [ ] **Step 5: Copy sem exclamação**

Linha 170: `<h2 className="text-xl font-bold text-gray-900">E-mail enviado!</h2>` vira `<h2 className="text-xl font-bold text-gray-900">E-mail enviado</h2>`.

- [ ] **Step 6: Rodar os testes e o typecheck**

Run: `npm test`
Expected: PASS em todos.

Run: `npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -c "error TS"`
Expected: `96` ou menos. Se o JSX ficar desbalanceado, aparece erro novo em `Login.tsx`.

- [ ] **Step 7: Commit**

```bash
git add src/components/Login.tsx tests/brand.test.mjs
git commit -m "feat: login brikz com painel ink e copy no padrao do DS"
```

---

### Task 6: Revisão de categorias e verificação visual

**Files:**
- Create: `docs/superpowers/specs/2026-10-01-brikz-revisao-categorias.md`

**Interfaces:**
- Consumes: o app completo das Tasks 1 a 5.

- [ ] **Step 1: Levantar onde purple, teal, violet, emerald ou indigo diferenciavam categorias**

```bash
grep -rnE "\b(bg|text|border)-(purple|violet|teal|emerald|indigo|fuchsia|sky)-[0-9]{2,3}" src --include=*.tsx | grep -vE "\.(bak|backup)" | grep -E "case |: '|\? '|=> '" | head -80
```

Isso pega mapas de status e tipo (`case 'x': return 'bg-purple-100 ...'`). Para cada ocorrência que mapeia **categoria → cor**, com outra categoria usando `blue` no mesmo mapa, registrar no documento: arquivo:linha, categorias afetadas e a sugestão para a fase B (ex.: badge neutro `gray` com ícone, ou outline).

- [ ] **Step 2: Escrever `docs/superpowers/specs/2026-10-01-brikz-revisao-categorias.md`**

Estrutura:

```markdown
# Brikz fase A: categorias que perderam distinção de cor

Após o remapeamento, purple/violet/teal/emerald/indigo/sky/fuchsia renderizam o mesmo cyan de `blue`.
Os mapas abaixo usavam essas cores para distinguir categorias. Revisar na fase B.

| Arquivo:linha | Categorias que colidem | Sugestão fase B |
|---|---|---|
| (uma linha por ocorrência do Step 1) | | |
```

Preencher a tabela com as ocorrências reais do Step 1. Se não houver nenhuma, escrever "Nenhum mapa de categoria afetado" e listar o comando usado.

- [ ] **Step 3: Verificação final automatizada**

```bash
npm test
npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -c "error TS"
npx vite build
```

Expected:
- testes todos PASS;
- `96` ou menos erros no `tsc`;
- `✓ built`.

- [ ] **Step 4: Verificação visual no navegador**

Rodar `npm run dev` em background e abrir `http://localhost:5173` com a skill `claude-in-chrome`. Capturar screenshot de:
1. Login em desktop e em largura < 768px. O painel ink deve sumir no mobile e o logo on-light deve aparecer.
2. A tela após o login (Cadastro).
3. Contratos (tabela).
4. Um modal, ex.: detalhe de contrato.
5. Uma tela com gráfico (Monitoramento → Chargeback, ou detalhe de contrato).

Conferir:
- a aba Network sem 404 em `/fonts/` e `/brand/`;
- os headings em Space Grotesk e o corpo em Inter (computed style);
- botões primários em `#0891b2`;
- o item ativo da sidebar em cyan;
- nenhum azul, roxo ou teal do Tailwind remanescente.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-10-01-brikz-revisao-categorias.md
git commit -m "docs: lista categorias que perderam distincao de cor no rebrand brikz"
```
