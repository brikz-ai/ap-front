# Brikz Fase B: Platform UI clara (plano de implementação)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deixar o app visualmente fiel ao Brikz DS na variação Platform UI clara: preto como primário, cyan raro, anatomia de componentes do DS, e shell e telas principais iguais ao mockup aprovado.

**Architecture:**
- Remapeamento v2 das paletas Tailwind: `blue` e as paletas de destaque passam para a escala `primary` (ink). Focus e seleção continuam cyan, via override de `ringColor` e `borderColor`.
- Uma camada de componentes CSS (`src/styles/brikz-components.css`, com `@layer components`) e 4 componentes React em `src/components/ui/`.
- O shell (App, Header, Sidebar) e 4 telas são migrados para essa camada.

**Tech Stack:** Vite 5, React 18, TS 5.5, Tailwind 3.4, recharts, Node 25 `node:test`, PostCSS (já instalado).

**Spec:** `docs/superpowers/specs/2026-10-01-brikz-fase-b-platform-ui-design.md`. A fase A está em `docs/superpowers/specs/2026-10-01-brikz-design-system-design.md`.

**Mockup de referência visual:** `C:\Users\rdeli\AppData\Local\Temp\claude\C--DEV-ap-ap-front\e7c43e22-f98a-47ac-a2c1-f375ed7729ba\scratchpad\mockup\chargeback.html`. Abra e leia o CSS dele quando a tarefa mandar seguir o mockup.

## Global Constraints

- Branch: `feat/brikz-design-system`. Não criar branch nova.
- Nenhuma dependência nova.
- Baselines: `tsc` com 96 erros (não pode subir), `npx vite build` passa e `npm test` passa.
- Cyan saturado (`#0891b2`) **só** em:
  - estado ativo (marca da Sidebar, chip ativo);
  - focus;
  - links de ID;
  - `status-ready`;
  - eyebrow e linha de destaque;
  - no máximo 1 `.btn-accent` por tela.
- Primário é preto: `.btn-primary` = `#0a0a0a`, hover `#000`.
- Fontes:
  - mono (JetBrains Mono) para rótulos técnicos, IDs, valores monetários em tabela, datas e cabeçalhos de tabela;
  - Space Grotesk para títulos;
  - Inter para o resto.
- Não inventar dados: KPIs e colunas só com informação que a tela já tem.
- Copy em PT-BR, sem exclamação, nome `brikz` minúsculo.
- Não mudar lógica, estado, props públicas nem chamadas de API das telas. A mudança é só de marcação e classes.
- Commits terminam com uma linha em branco seguida de `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Focus invisível.** Depois do remap, um `focus:ring-blue-500` ainda tem que mostrar anel cyan, e não preto ou cinza. Teste na Task 1: `ring e border de focus continuam cyan`.
2. **Classe de componente sem regra.** Usar `btn-primary` sem que a regra seja gerada daria um botão sem estilo. O esperado é que todas as classes da camada compilem via Tailwind. Teste na Task 2: `todas as classes da camada sao geradas`.
3. **Seção sem grupo.** Um `activeSection` desconhecido não pode deixar o eyebrow vazio nem quebrar a tela. O esperado é um fallback "Operação". Teste na Task 3: `getSectionGroup tem fallback`.
4. **Tela migrada com cor antiga de ação.** Se sobrar um `bg-emerald-600` no Exportar, o botão fica preto por acaso, mas fora da camada. O esperado é que as telas migradas usem `btn-primary`/`btn-soft`. Teste nas Tasks 4 e 5: `telas migradas usam a camada`.
5. **Sucesso virando preto.** `emerald` em status de sucesso passaria a renderizar preto. O esperado é verde nos pontos listados. Teste na Task 6: `status de sucesso usam green`.

---

### Task 1: Remapeamento de cor v2 (primary ink, focus cyan)

**Files:**
- Modify: `src/styles/brikzTokens.js`
- Modify: `tailwind.config.js`
- Modify: `tests/theme.test.mjs`
- Modify: `src/components/UrIdLink.tsx` (linha 22)

**Interfaces:**
- Produces:
  - `scales.primary` (11 shades);
  - `paletteMap` v2;
  - novo export `focusPalettes` (array dos nomes de paleta que passam a `primary`).

- [ ] **Step 1: Atualizar os testes em `tests/theme.test.mjs` (eles devem falhar)**

Substituir o teste `accent do DS na posicao 600 e hover na 700` por:

```js
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
```

O teste existente `todas as paletas default do Tailwind sao brikz` continua valendo, porque compara com `scales[paletteMap[p]]`.

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test`
Expected: FAIL em `primario e ink` (blue-600 é `#0891b2`) e em `ring e border de focus`.

- [ ] **Step 3: `src/styles/brikzTokens.js`**

Depois de `const ink = {...}`, adicionar:

```js
// Primario de acao do DS: ink-1 (#0a0a0a) na posicao 600, preto puro no hover (700+).
const primary = {
  50: '#fafafa', 100: '#f4f4f5', 200: '#e5e7eb', 300: '#d4d4d8', 400: '#a3a3a3', 500: '#525252',
  600: '#0a0a0a', 700: '#000000', 800: '#000000', 900: '#000000', 950: '#000000',
};
```

Trocar `export const scales = { accent, ink, success, danger, warning };` por `export const scales = { accent, primary, ink, success, danger, warning };`.

Substituir o `paletteMap` inteiro por:

```js
// Platform UI clara: o "azul" do app (e demais matizes de acao) vira o primario preto do DS.
// O cyan so aparece onde for pedido explicitamente (`cyan-*` / `accent`).
export const focusPalettes = ['blue', 'sky', 'indigo', 'purple', 'violet', 'fuchsia', 'teal', 'emerald'];

export const paletteMap = {
  ...Object.fromEntries(focusPalettes.map(p => [p, 'primary'])),
  cyan: 'accent',
  slate: 'ink', gray: 'ink', zinc: 'ink', neutral: 'ink', stone: 'ink',
  green: 'success', lime: 'success',
  red: 'danger', rose: 'danger', pink: 'danger',
  yellow: 'warning', amber: 'warning', orange: 'warning',
};
```

- [ ] **Step 4: `tailwind.config.js`**

Trocar o import para incluir `focusPalettes`:

```js
import { scales, paletteMap, focusPalettes, semantic, fontFamily, borderRadius, boxShadow, easeOut } from './src/styles/brikzTokens.js';
```

Atualizar o comentário de cabeçalho:

```js
// Brikz Design System, Platform UI clara: os nomes de paleta do Tailwind (blue, gray, purple...) sao
// ALIASES das escalas brikz. `bg-blue-600` renderiza o primario preto (#0a0a0a); cyan so via `cyan-*` /
// `accent`. Focus/selecao (ring-*, border-*-400..600) dessas paletas continuam cyan. Ver src/styles/brikzTokens.js.
```

Depois de `remappedPalettes`, adicionar:

```js
const focusRing = Object.fromEntries(focusPalettes.map(p => [p, scales.accent]));
const focusBorder = Object.fromEntries(
  focusPalettes.map(p => [p, { 400: scales.accent['400'], 500: scales.accent['500'], 600: scales.accent['600'] }]),
);
```

Em `extend`, adicionar `ringColor: focusRing,` e `borderColor: focusBorder,`.

- [ ] **Step 5: `UrIdLink.tsx` usa o cyan explícito**

Na linha 22, trocar `text-blue-600 hover:text-blue-800` por `text-cyan-600 hover:text-cyan-700`. O `focus:ring-blue-500` continua cyan pelo override.

- [ ] **Step 6: Rodar os testes e o build**

Run: `npm test`. Expected: PASS em todos.
Run: `npx vite build`. Expected: `✓ built`.

- [ ] **Step 7: Commit**

```bash
git add src/styles/brikzTokens.js tailwind.config.js tests/theme.test.mjs src/components/UrIdLink.tsx
git commit -m "feat: primario preto do DS (blue e matizes de acao viram ink), focus segue cyan"
```

---

### Task 2: Camada de componentes do DS

**Files:**
- Create: `src/styles/brikz-components.css`
- Modify: `src/index.css` (import)
- Create: `src/components/ui/PageHeader.tsx`, `src/components/ui/KpiCard.tsx`, `src/components/ui/Tag.tsx`, `src/components/ui/StatusPill.tsx`, `src/components/ui/index.ts`
- Test: `tests/components.test.mjs`

**Interfaces:**
- Produces:
  - **Classes CSS:** `.btn`, `.btn-primary`, `.btn-soft`, `.btn-ghost`, `.btn-accent`, `.btn-sm`, `.chips`, `.chip`, `.chip-on`, `.input-soft`, `.select-soft`, `.panel`, `.panel-head`, `.panel-title`, `.panel-meta`, `.table-brikz`, `.label-mono`, `.eyebrow`, `.line-accent`, `.tag`, `.status`, `.status-ready`, `.status-idle`, `.status-success`, `.status-warning`, `.status-danger`, `.app-canvas`.
  - **React (de `src/components/ui`):**
    - `PageHeader({ eyebrow: string; title: string; description?: string; actions?: React.ReactNode })`;
    - `KpiCard({ label: string; value: React.ReactNode; hint?: React.ReactNode; tone?: 'default' | 'danger' | 'success' })`;
    - `Tag({ children: React.ReactNode; color?: string })`;
    - `StatusPill({ tone: 'ready' | 'idle' | 'success' | 'warning' | 'danger'; children: React.ReactNode })`.

- [ ] **Step 1: Escrever o teste que falha (`tests/components.test.mjs`)**

```js
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
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test`. Expected: FAIL com ENOENT em `brikz-components.css`.

- [ ] **Step 3: Criar `src/styles/brikz-components.css`**

```css
/* Brikz Design System: camada de componentes (Platform UI clara).
   Fonte: C:\DEV\brikz\Brikz Design System\preview\components-*.html e mockup aprovado. */

:root {
  --white: #ffffff; --off-white: #fafafa; --paper: #f4f4f5;
  --hairline: #e5e7eb; --hairline-soft: #f1f1f3;
  --ink-1: #0a0a0a; --ink-2: #1f1f1f; --ink-3: #525252; --ink-4: #737373; --ink-5: #a3a3a3;
  --cyan-700: #0891b2; --cyan-600: #0e7490; --cyan-400: #22d3ee; --cyan-100: #cffafe; --cyan-50: #ecfeff;
  --data-1: #0891b2; --data-2: #5B7FFF; --data-3: #00A87E; --data-4: #EC7E00; --data-5: #E23B4A; --data-6: #8B5CF6;
  --font-display: 'Space Grotesk', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, Menlo, monospace;
  --shadow-card: 0 1px 3px rgba(15,23,42,.06), 0 1px 2px rgba(15,23,42,.04);
  --shadow-lift: 0 12px 32px rgba(15,23,42,.10);
  --shadow-glow: 0 8px 24px rgba(8,145,178,.25), 0 0 0 1px rgba(8,145,178,.10);
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}

@layer components {
  /* fundo do conteudo: branco com veu cyan sutil no topo */
  .app-canvas {
    background-color: var(--white);
    background-image: linear-gradient(180deg, rgba(236,254,255,.55) 0%, rgba(255,255,255,0) 260px);
    background-repeat: no-repeat;
  }

  /* ---------- botoes ---------- */
  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    font-family: var(--font-body); font-weight: 600; font-size: 13px; line-height: 1;
    padding: 10px 16px; border-radius: 6px; border: 0; cursor: pointer; white-space: nowrap;
    transition: background-color .2s var(--ease-out), box-shadow .2s var(--ease-out), color .2s var(--ease-out);
  }
  .btn:active { transform: translateY(1px); }
  .btn:disabled { opacity: .5; cursor: not-allowed; transform: none; }
  .btn svg { width: 15px; height: 15px; }
  .btn-sm { font-size: 12px; padding: 7px 12px; }
  .btn-primary { background-color: var(--ink-1); color: var(--white); box-shadow: var(--shadow-card); }
  .btn-primary:hover:not(:disabled) { background-color: #000; box-shadow: var(--shadow-lift); }
  .btn-soft { background-color: var(--off-white); color: var(--ink-2); box-shadow: inset 0 0 0 1px var(--hairline); }
  .btn-soft:hover:not(:disabled) { background-color: var(--paper); }
  .btn-ghost { background-color: transparent; color: var(--ink-3); padding: 8px 12px; }
  .btn-ghost:hover:not(:disabled) { color: var(--ink-1); background-color: var(--off-white); }
  .btn-accent { background-color: var(--cyan-700); color: var(--white); box-shadow: var(--shadow-glow); }
  .btn-accent:hover:not(:disabled) { background-color: var(--cyan-600); }
  .btn:focus-visible { outline: 2px solid var(--cyan-700); outline-offset: 2px; }

  /* ---------- chips ---------- */
  .chips { display: inline-flex; gap: 2px; padding: 3px; background-color: var(--paper); border-radius: 999px; }
  .chip {
    font-size: 12px; font-weight: 500; padding: 6px 12px; border-radius: 999px; color: var(--ink-3);
    cursor: pointer; border: 0; background: transparent; transition: color .2s var(--ease-out);
  }
  .chip:hover { color: var(--ink-1); }
  .chip-on { background-color: var(--white); color: var(--cyan-700); box-shadow: var(--shadow-card); font-weight: 600; }

  /* ---------- campos ---------- */
  .input-soft, .select-soft {
    font-family: var(--font-body); font-size: 13px; color: var(--ink-2);
    background-color: var(--off-white); border: 0; border-radius: 6px;
    box-shadow: inset 0 0 0 1px var(--hairline); padding: 8px 12px; outline: none;
    transition: box-shadow .2s var(--ease-out), background-color .2s var(--ease-out);
  }
  .input-soft::placeholder { color: var(--ink-5); }
  .input-soft:focus, .select-soft:focus { background-color: var(--white); box-shadow: inset 0 0 0 1px var(--cyan-700), 0 0 0 3px rgba(8,145,178,.12); }
  .select-soft {
    appearance: none; padding-right: 30px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23737373' fill='none' stroke-width='1.5'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 10px center;
  }

  /* ---------- paineis ---------- */
  .panel { background-color: var(--white); border: 1px solid var(--hairline); border-radius: 12px; box-shadow: var(--shadow-card); overflow: hidden; }
  .panel-head { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 16px 20px; border-bottom: 1px solid var(--hairline); }
  .panel-title { font-family: var(--font-display); font-size: 15px; font-weight: 600; letter-spacing: -0.01em; color: var(--ink-1); margin: 0; }
  .panel-meta { font-family: var(--font-mono); font-size: 11px; color: var(--ink-4); }

  /* ---------- tabela ---------- */
  .table-brikz { width: 100%; border-collapse: collapse; }
  .table-brikz th {
    text-align: left; font-family: var(--font-mono); font-size: 10.5px; font-weight: 500;
    letter-spacing: .12em; text-transform: uppercase; color: var(--ink-4);
    padding: 12px 20px; background-color: var(--off-white); border-bottom: 1px solid var(--hairline); white-space: nowrap;
  }
  .table-brikz td { padding: 14px 20px; border-bottom: 1px solid var(--hairline-soft); font-size: 13.5px; color: var(--ink-2); vertical-align: middle; }
  .table-brikz tbody tr { transition: background-color .2s var(--ease-out); }
  .table-brikz tbody tr:hover { background-color: var(--off-white); }
  .table-brikz tbody tr:last-child td { border-bottom: 0; }

  /* ---------- tipografia tecnica ---------- */
  .label-mono { font-family: var(--font-mono); font-size: 10.5px; font-weight: 500; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-4); }
  .eyebrow { font-family: var(--font-body); font-size: 10.5px; font-weight: 600; letter-spacing: .25em; text-transform: uppercase; color: var(--cyan-700); }
  .line-accent { display: inline-block; width: 32px; height: 1.5px; border-radius: 2px; background-color: var(--cyan-700); }

  /* ---------- tag e status ---------- */
  .tag {
    display: inline-flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 600;
    letter-spacing: .05em; text-transform: uppercase; padding: 4px 8px; border-radius: 3px;
    background-color: var(--white); color: var(--ink-2); border: 1px solid var(--hairline); white-space: nowrap;
  }
  .tag > i { width: 6px; height: 6px; border-radius: 2px; background-color: var(--tag-color, var(--ink-5)); }
  .status { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; padding: 3px 9px; border-radius: 999px; white-space: nowrap; }
  .status::before { content: ""; width: 6px; height: 6px; border-radius: 999px; background-color: currentColor; }
  .status-ready { background-color: rgba(8,145,178,.08); color: var(--cyan-700); box-shadow: inset 0 0 0 1px rgba(8,145,178,.25); }
  .status-idle { background-color: rgba(0,0,0,.03); color: var(--ink-4); box-shadow: inset 0 0 0 1px rgba(0,0,0,.08); }
  .status-success { background-color: rgba(0,168,126,.08); color: #007a5b; box-shadow: inset 0 0 0 1px rgba(0,168,126,.25); }
  .status-warning { background-color: rgba(236,126,0,.08); color: #a35700; box-shadow: inset 0 0 0 1px rgba(236,126,0,.25); }
  .status-danger { background-color: rgba(226,59,74,.08); color: #a8232f; box-shadow: inset 0 0 0 1px rgba(226,59,74,.25); }
}
```

- [ ] **Step 4: Importar no `src/index.css`**

Na **primeira linha** do arquivo, antes dos `@font-face`, adicionar `@import './styles/brikz-components.css';`. O PostCSS exige `@import` no topo. Se o build reclamar do `@layer components` sem `@tailwind components` no arquivo importado, mova o import para logo depois de `@tailwind components;`. O teste aceita qualquer posição.

- [ ] **Step 5: Componentes React**

`src/components/ui/PageHeader.tsx`:

```tsx
import React from 'react';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ eyebrow, title, description, actions }) => (
  <div className="mb-8">
    <div className="flex items-center gap-3 mb-3.5">
      <span className="line-accent" />
      <span className="eyebrow">{eyebrow}</span>
    </div>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-3xl sm:text-[2.25rem] font-semibold leading-[1.08] tracking-[-0.03em] text-gray-900 truncate">
          {title}
        </h1>
        {description && <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-gray-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  </div>
);
```

`src/components/ui/KpiCard.tsx`:

```tsx
import React from 'react';

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: 'default' | 'danger' | 'success';
}

const toneClass = { default: 'text-gray-900', danger: 'text-red-500', success: 'text-green-600' };

export const KpiCard: React.FC<KpiCardProps> = ({ label, value, hint, tone = 'default' }) => (
  <div className="panel px-5 py-[18px]">
    <div className="label-mono">{label}</div>
    <div className={`mt-2.5 font-display text-[1.75rem] font-semibold leading-none tracking-[-0.03em] ${toneClass[tone]}`}>
      {value}
    </div>
    {hint && <div className="mt-2 text-xs text-gray-500">{hint}</div>}
  </div>
);
```

`src/components/ui/Tag.tsx`:

```tsx
import React from 'react';

interface TagProps {
  children: React.ReactNode;
  color?: string;
}

export const Tag: React.FC<TagProps> = ({ children, color }) => (
  <span className="tag" style={color ? ({ '--tag-color': color } as React.CSSProperties) : undefined}>
    {color && <i />}
    {children}
  </span>
);
```

`src/components/ui/StatusPill.tsx`:

```tsx
import React from 'react';

export type StatusTone = 'ready' | 'idle' | 'success' | 'warning' | 'danger';

interface StatusPillProps {
  tone: StatusTone;
  children: React.ReactNode;
}

export const StatusPill: React.FC<StatusPillProps> = ({ tone, children }) => (
  <span className={`status status-${tone}`}>{children}</span>
);
```

`src/components/ui/index.ts`:

```ts
export { PageHeader } from './PageHeader';
export { KpiCard } from './KpiCard';
export { Tag } from './Tag';
export { StatusPill } from './StatusPill';
export type { StatusTone } from './StatusPill';
```

- [ ] **Step 6: Rodar testes, tsc e build**

Run: `npm test`. Expected: PASS em todos.
Run: `npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -c "error TS"`. Expected: `96` ou menos.
Run: `npx vite build`. Expected: `✓ built`.

- [ ] **Step 7: Commit**

```bash
git add src/styles/brikz-components.css src/index.css src/components/ui tests/components.test.mjs
git commit -m "feat: camada de componentes do brikz DS (botoes, chips, campos, painel, tabela, tag, status)"
```

---

### Task 3: Shell (App, Header, Sidebar)

**Files:**
- Create: `src/navigation/sectionGroups.ts`
- Test: `tests/sectionGroups.test.mjs`
- Modify:
  - `src/App.tsx` (wrapper de layout por volta da linha 493 e área de conteúdo por volta da linha 515);
  - `src/components/Header.tsx`;
  - `src/components/Sidebar.tsx`.

**Interfaces:**
- Consumes: `PageHeader` (Task 2) e as classes `.app-canvas`, `.label-mono`, `.input-soft`.
- Produces: `getSectionGroup(section: string): string`, exportado de `src/navigation/sectionGroups.ts`.

- [ ] **Step 1: Teste que falha (`tests/sectionGroups.test.mjs`)**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getSectionGroup } from '../src/navigation/sectionGroups.ts';

test('secoes mapeiam para o grupo da navegacao', () => {
  assert.equal(getSectionGroup('partner-registration'), 'Principal');
  assert.equal(getSectionGroup('contracts'), 'Principal');
  assert.equal(getSectionGroup('chargeback-monitoring'), 'Monitoramento');
  assert.equal(getSectionGroup('liquidation-problems'), 'Monitoramento');
  assert.equal(getSectionGroup('settlement-control'), 'Relatórios');
  assert.equal(getSectionGroup('disputes'), 'Contestação');
  assert.equal(getSectionGroup('financial'), 'Configurações');
  assert.equal(getSectionGroup('access-logs'), 'Gestão de acessos');
});

test('getSectionGroup tem fallback', () => {
  assert.equal(getSectionGroup('secao-inexistente'), 'Operação');
  assert.equal(getSectionGroup(''), 'Operação');
});
```

- [ ] **Step 2: Rodar e confirmar que falha.** Run: `npm test`. Expected: FAIL por módulo não encontrado.

- [ ] **Step 3: `src/navigation/sectionGroups.ts`**

```ts
// Grupo de navegacao de cada secao (eyebrow do PageHeader e breadcrumb do Header).
const SECTION_GROUPS: Record<string, string> = {
  'partner-registration': 'Principal',
  'schedule-view': 'Principal',
  'contracts': 'Principal',
  'clients': 'Principal',
  'clients-test': 'Principal',
  'client-detail': 'Principal',
  'client-detail-test': 'Principal',
  'client-radar': 'Principal',
  'contract-detail': 'Principal',
  'contracts-monitoring': 'Monitoramento',
  'liquidation-problems': 'Monitoramento',
  'chargeback-monitoring': 'Monitoramento',
  'settlement-control': 'Relatórios',
  'receivables-ledger': 'Relatórios',
  'reports': 'Relatórios',
  'disputes': 'Contestação',
  'financial': 'Configurações',
  'settlement-domicile': 'Configurações',
  'notifications': 'Configurações',
  'menu-setup': 'Configurações',
  'user-management': 'Gestão de acessos',
  'role-permissions': 'Gestão de acessos',
  'access-logs': 'Gestão de acessos',
};

export function getSectionGroup(section: string): string {
  return SECTION_GROUPS[section] ?? 'Operação';
}
```

- [ ] **Step 4: App: canvas e PageHeader global**

Em `src/App.tsx`:
- Importar `PageHeader` de `./components/ui` e `getSectionGroup` de `./navigation/sectionGroups`.
- Linha ~493: `<div className="bg-gray-50 min-h-screen">` vira `<div className="bg-white min-h-screen">`.
- Div de conteúdo (linha ~515):
  - acrescentar `app-canvas` ao className;
  - trocar o padding `px-3 sm:px-4 md:px-6 pb-6 pt-[72px] sm:pt-[88px]` por `px-4 sm:px-6 md:px-8 pb-16 pt-[88px] sm:pt-[104px]`;
  - logo dentro dele, antes do `<React.Suspense>`, renderizar `<PageHeader eyebrow={getSectionGroup(activeSection)} title={pageTitle} />`.

- [ ] **Step 5: Header: breadcrumb mono**

Em `src/components/Header.tsx`:
- Adicionar a prop opcional `sectionGroup?: string` em `HeaderProps`. O App passa `sectionGroup={getSectionGroup(activeSection)}`.
- Container: `bg-white border-b border-gray-100` vira `bg-white/85 backdrop-blur-xl border-b border-gray-200`.
- O `<h1>` do título (linha ~84) é substituído por:

```tsx
<div className="font-mono text-[11.5px] tracking-[0.02em] text-gray-500 truncate ml-10 lg:ml-0">
  {sectionGroup && <>{sectionGroup} / </>}<span className="text-gray-900 font-medium">{pageTitle}</span>
</div>
```

- O botão de busca recebe o estilo soft: `rounded-md bg-gray-50 shadow-[inset_0_0_0_1px_#e5e7eb]`, sem `border`, e `hover:bg-gray-100`. O `kbd` fica `font-mono`.
- O badge numérico vermelho de notificações vira um ponto cyan: `<span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-cyan-600 ring-2 ring-white" />`. O número continua no `aria-label`.
- Nos menus dropdown (notificações e usuário), `rounded-lg shadow-lg` vira `rounded-xl shadow-lg`.

Não mude handlers nem estado.

- [ ] **Step 6: Sidebar no padrão DS** (siga `.side`/`.nav-item`/`.sub`/`.group-label` do mockup)

Em `src/components/Sidebar.tsx`:
- **Rótulos de grupo** (ex.: `<p className="px-3 mb-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">`): trocar por `px-3 mb-2 mt-5 first:mt-0 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400`.
- **`btnClass(active)` e `expandBtnClass(active)`:**
  - ativo: `relative bg-gray-100 text-gray-900 font-medium before:content-[''] before:absolute before:-left-3 before:top-2 before:bottom-2 before:w-0.5 before:rounded before:bg-cyan-600`;
  - inativo: `text-gray-500 hover:bg-gray-50 hover:text-gray-900`;
  - base: `rounded-md py-2 text-[13.5px]`, mantendo layout e ícone.
- **`subBtnClass`:** os subitens ficam dentro de um wrapper com `ml-6 pl-2.5 border-l border-gray-200`. O ativo usa o mesmo `before:` com `-left-[11px]`.
- **`iconClass(active)`:** ativo `text-gray-900`, inativo `text-gray-400`.
- **Sidebar recolhida:** item ativo `bg-gray-100 text-gray-900`, inativo `text-gray-400 hover:text-gray-900 hover:bg-gray-50`.
- **Borda da sidebar:** `border-gray-100` vira `border-gray-200`.

Leia as funções `btnClass`, `expandBtnClass`, `subBtnClass` e `iconClass` antes de editar e preserve as assinaturas.

- [ ] **Step 7: Testes, tsc e build.** Mesmos comandos e mesmas expectativas da Task 2.

- [ ] **Step 8: Commit**

```bash
git add src/navigation tests/sectionGroups.test.mjs src/App.tsx src/components/Header.tsx src/components/Sidebar.tsx
git commit -m "feat: shell brikz (page header com eyebrow, breadcrumb mono, sidebar com marca ativa cyan)"
```

---

### Task 4: Telas de Monitoramento (Chargeback e Problemas de liquidação)

**Files:**
- Modify: `src/components/ChargebackMonitoringModule.tsx`, `src/components/LiquidationProblemModule.tsx`
- Test: `tests/screens.test.mjs` (criar)

**Interfaces:**
- Consumes: `KpiCard`, `Tag` (Task 2), `getAcquirerColor` e `CHART_AXIS` (`src/styles/chartColors.ts`), e as classes da Task 2.

Siga o mockup (`chargeback.html`). As duas telas têm estrutura quase igual. Aplique o mesmo tratamento nas duas.

- [ ] **Step 1: Teste que falha (`tests/screens.test.mjs`)**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = f => readFileSync(new URL(`../src/components/${f}.tsx`, import.meta.url), 'utf8');

for (const f of ['ChargebackMonitoringModule', 'LiquidationProblemModule']) {
  test(`telas migradas usam a camada: ${f}`, () => {
    const src = read(f);
    assert.match(src, /btn btn-primary/, 'Exportar como btn-primary');
    assert.match(src, /select-soft/);
    assert.match(src, /input-soft/);
    assert.match(src, /table-brikz/);
    assert.match(src, /<KpiCard/);
    assert.match(src, /<Tag/);
    assert.match(src, /className="panel/);
    assert.doesNotMatch(src, /bg-emerald-600|text-emerald-600|focus:ring-emerald/, 'sem emerald de acao');
  });
}
```

- [ ] **Step 2: Rodar e confirmar que falha.**

- [ ] **Step 3: Migrar `ChargebackMonitoringModule.tsx`**

Sem mexer em estado, memos nem handlers:
1. **Raiz:** `<div className="space-y-6">` passa a conter, nesta ordem, os KPIs, o painel do gráfico e o painel da tabela. O PageHeader já vem do App.
2. **KPIs:** `<section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">` só com métricas que já existem:
   - `KpiCard label="URs com chargeback" value={filteredReceivables.length}`;
   - `KpiCard label="Redução total" tone="danger" value={formatCurrency(totalReduction)}`;
   - "Contratos afetados": nº de `contractId` distintos em `filteredReceivables`, calculado com `useMemo`;
   - "Credenciadoras": nº de `acquirer` distintos em `filteredReceivables`.

   A barra de resumo antiga (`{n} URs com chargeback` / `Redução total`) é removida, porque os KPIs a substituem.
3. **Barra de filtros:** vira o `panel-head` do painel da tabela.
   - Título `<h2 className="panel-title">URs afetadas</h2>`.
   - Meta `<span className="panel-meta">{filteredReceivables.length} registros</span>`.
   - À direita (`ml-auto flex flex-wrap gap-2 items-center`): os dois `<select>` com `className="select-soft"`, o input de busca com `className="input-soft pl-8 w-64"` (ícone `Search` posicionado com `text-gray-400`) e o botão Exportar com `className="btn btn-primary"`.
4. **Painel do gráfico:** `<section className="panel">`.
   - O botão de expandir/recolher vira `panel-head`, mantendo o `onClick`.
   - Ícone `BarChart3` em `text-gray-400`.
   - Título `panel-title` "Valor de chargeback por dia".
   - `panel-meta` com o intervalo de datas: primeiro e último `chartData[i].date`, quando houver.
   - O chevron fica à direita.
   - No recharts: `XAxis`/`YAxis` com `tick={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fill: CHART_AXIS.tick }}`, mantendo o `angle` existente; `CartesianGrid` com `vertical={false}`; `Bar` com `radius={[3,3,0,0]}` apenas na série do topo, ou em todas se for mais simples; `Legend` com `iconType="square"` e `wrapperStyle={{ fontSize: 12 }}`.
   - O tooltip customizado ganha `rounded-lg border-gray-200 shadow-lg` e valores com `font-mono`.
5. **Tabela:**
   - `<table className="table-brikz">`, removendo as classes de `th` e `td` (a camada cuida delas); `th` numérico com `className="text-right"`.
   - Contrato em `font-mono text-[12.5px] text-gray-900`, e cliente abaixo em `block text-xs text-gray-500` (manter o ícone `Building2` é opcional; remova se poluir).
   - Credenciadora: `<Tag color={getAcquirerColor(r.acquirer)}>{r.acquirer} {r.cardBrand}</Tag>`.
   - Valores e datas em `font-mono text-[12.5px]`. Redução em `font-mono font-semibold text-red-500` com o sinal `−`, se o código já formatar negativo; mantenha a lógica atual.
   - Linha da tabela sem classes próprias.
6. **Estado vazio:** se existir, ícone `text-gray-300` e texto `text-gray-500`.

- [ ] **Step 4: Migrar `LiquidationProblemModule.tsx`**

O mesmo tratamento, com títulos adequados ("Problemas de liquidação por dia" e "URs com problema"). Os KPIs são só os que a tela já calcula. Leia o arquivo e use os totais existentes, mais distintos de contrato e credenciadora. Se houver coluna de status ou motivo, use `StatusPill`:
- tone `danger` para falha ou erro;
- `warning` para pendente;
- `idle` para os demais.

- [ ] **Step 5: Testes, tsc e build.**

- [ ] **Step 6: Commit**

```bash
git add src/components/ChargebackMonitoringModule.tsx src/components/LiquidationProblemModule.tsx tests/screens.test.mjs
git commit -m "feat: telas de monitoramento no padrao brikz (kpis, paineis, tabela mono, tags de credenciadora)"
```

---

### Task 5: Contratos e Cadastro

**Files:**
- Modify: `src/components/ClientTable.tsx`, `src/components/PartnerRegistrationModule.tsx`
- Modify: `tests/screens.test.mjs` (acrescentar testes)

**Interfaces:**
- Consumes: as classes e componentes da Task 2, mais `StatusPill`.

- [ ] **Step 1: Acrescentar os testes que falham em `tests/screens.test.mjs`**

```js
for (const f of ['ClientTable', 'PartnerRegistrationModule']) {
  test(`telas migradas usam a camada: ${f}`, () => {
    const src = read(f);
    assert.match(src, /input-soft/);
    assert.match(src, /className="panel/);
    assert.match(src, /btn btn-(primary|soft)|chips|table-brikz/);
  });
}

test('ClientTable usa tabela brikz', () => {
  assert.match(read('ClientTable'), /table-brikz/);
});
```

- [ ] **Step 2: Rodar e confirmar que falha.**

- [ ] **Step 3: `ClientTable.tsx` (tela "Contratos")**

- O card de busca vira `panel` com `p-5`, e o label vira `label-mono`.
- O input usa `input-soft w-full pl-9`.
- O contador "x de y clientes" fica `font-mono text-xs text-gray-500`.
- A tabela vira `panel` + `table-brikz`. Os cabeçalhos ordenáveis mantêm os botões e ícones de ordenação; tire as classes de cor e tipografia que conflitam (a camada define o `th`).
- Documento (CNPJ/CPF) e valores ficam em `font-mono`.
- A coluna Status usa `StatusPill`, mapeando os valores reais do arquivo:
  - ativo/ok: `ready`;
  - pendente: `warning`;
  - bloqueado/inativo: `idle`;
  - erro: `danger`.

  Leia o mapeamento atual de cores de status e traduza.
- Estado vazio: ícone `text-gray-300` e textos `text-gray-900`/`text-gray-500`.

- [ ] **Step 4: `PartnerRegistrationModule.tsx` (tela "Cadastro")**

- As abas (Clientes / Opt-in) viram `chips`. Aba ativa: `chip chip-on`; inativas: `chip`. Ícones `w-3.5 h-3.5` dentro, e o `onClick` atual preservado.
- O card da lista vira `panel`, e a busca usa `input-soft`.
- O botão de ação principal (ex.: "Novo cliente"), se existir, usa `btn btn-primary`. Ações secundárias (importar etc.) usam `btn btn-soft`.
- Se houver tabela, ela vira `table-brikz`, com IDs e documentos em mono.

- [ ] **Step 5: Testes, tsc e build.**

- [ ] **Step 6: Commit**

```bash
git add src/components/ClientTable.tsx src/components/PartnerRegistrationModule.tsx tests/screens.test.mjs
git commit -m "feat: contratos e cadastro no padrao brikz (chips, painel, tabela mono, status pill)"
```

---

### Task 6: Sucesso volta a ser verde (emerald de status para green)

**Files:**
- Modify: os pontos listados em `docs/superpowers/specs/2026-10-01-brikz-revisao-categorias.md`, seção "Observação: semântica de sucesso":
  - `DailyMonitoringDashboard.tsx:101-105,137`;
  - `ContractMonitoringCard.tsx:32,42`;
  - `liquidacao_total` em `ContractDetail.tsx:72`, `DisputesModule.tsx:29` e `ReceivablesLedgerModule.tsx:41`;
  - `AccessManagementModule.tsx:60,235`.
- Test: `tests/screens.test.mjs` (acrescentar)

- [ ] **Step 1: Teste que falha**

```js
test('status de sucesso usam green', () => {
  for (const f of ['DailyMonitoringDashboard', 'ContractMonitoringCard']) {
    assert.doesNotMatch(read(f), /emerald/, `${f} ainda usa emerald`);
  }
  for (const f of ['ContractDetail', 'DisputesModule', 'ReceivablesLedgerModule']) {
    const src = read(f);
    const line = src.split('\n').find(l => l.includes('liquidacao_total'));
    assert.ok(line && !/emerald/.test(line), `${f}: liquidacao_total ainda emerald`);
  }
});
```

- [ ] **Step 2: Rodar e confirmar que falha.**

- [ ] **Step 3: Trocar `emerald-` por `green-`** apenas nesses pontos de status, preservando os shades. Em `AccessManagementModule.tsx`, troque só o papel ou status que significa "ativo/ok" (linhas 60 e 235). Os botões emerald desse arquivo ficam como estão, porque já renderizam preto pelo remap.

- [ ] **Step 4: Testes, tsc e build.**

- [ ] **Step 5: Commit**

```bash
git add -A src/components tests/screens.test.mjs
git commit -m "fix: status de sucesso voltam a ser verdes apos primario preto"
```
