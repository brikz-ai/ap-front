# Aplicação do Brikz Design System no ap-front — Fase A (rebrand via tokens)

**Data:** 2026-10-01
**Fonte do design system:** `C:\DEV\brikz\Brikz Design System` (`dist/`, `colors_and_type.css`, `README.md`, `SKILL.md`)

## Objetivo

O app passa a ter a identidade visual brikz (cor, tipografia, logo, sensação geral) seguindo estritamente o design system, sem alterar funcionalidade nem layout operacional (sidebar, tabelas, modais continuam).

## Contexto

- ap-front: Vite + React 18 + TS + Tailwind 3.4, `theme.extend` vazio, sem tokens, fontes, logo ou componentes base.
- ~8.500 classes de cor Tailwind hardcoded em 97 arquivos (gray 4.867, blue 1.580, green 632, red 461, purple 213, yellow 198, amber 154, orange 108, teal 103, emerald 98, violet 31, rose 15, indigo 9).
- 54 hex literais em gráficos recharts em 7 arquivos.
- O DS tem um único accent (cyan `#0891b2`), neutros "ink", fontes self-hosted (Space Grotesk / Inter / JetBrains Mono), raios pequenos (até 16px), sombras discretas, paleta `--data-1..6` para gráficos. Não tem dark mode.

## Decisões

1. **Abordagem A:** remapear as escalas do Tailwind no `tailwind.config.js` em vez de editar os arquivos de feature. O app inteiro muda de uma vez com risco baixo.
2. **Seguir o DS estritamente:** todo matiz decorativo vira o accent cyan; cores de status usam a paleta `--data` do DS.
3. **Sidebar clara** (default do DS). Item ativo em cyan-50 / cyan-700.
4. **Login** usa painel `.ink` (preto, logo on-dark, cyan neon), que é o vocabulário de bands do DS.

## Design

### 1. Assets e fontes

- Copiar `dist/fonts/*.ttf` para `public/fonts/` e `dist/logo/*.png` para `public/brand/`.
- `src/index.css` ganha `@font-face` para:
  - Space Grotesk 300/400/500/600/700;
  - Inter variável (normal e itálico);
  - JetBrains Mono variável (normal e itálico).
  - Todos com `font-display: swap` e URLs absolutas `/fonts/...`.
- `@layer base`:
  - `body` usa Inter com cor `gray-900` e antialiasing;
  - `h1, h2, h3` usam Space Grotesk com `letter-spacing: -0.03em`.

### 2. Paletas no `tailwind.config.js`

As escalas abaixo **substituem** as do Tailwind em `theme.extend.colors`. Elas sobrescrevem as chaves default de mesmo nome.

| Nome Tailwind | Mapeado para | Escala |
|---|---|---|
| `blue`, `sky`, `indigo`, `emerald`, `teal`, `purple`, `violet`, `cyan` | **brikz cyan** | 50 `#ecfeff` · 100 `#cffafe` · 200 `#a5f3fc` · 300 `#67e8f9` · 400 `#22d3ee` · 500 `#06b6d4` · **600 `#0891b2` (accent)** · **700 `#0e7490` (hover)** · 800 `#155e75` · 900 `#164e63` · 950 `#083344` |
| `gray`, `slate`, `zinc`, `neutral` | **ink** | 50 `#fafafa` · 100 `#f4f4f5` · 200 `#e5e7eb` · 300 `#d4d4d8` · 400 `#a3a3a3` · 500 `#737373` · 600 `#525252` · 700 `#404040` · 800 `#1f1f1f` · 900 `#0a0a0a` · 950 `#000000` |
| `green`, `lime` | **sucesso** (`--data-3`) | 50 `#e6f7f2` · 100 `#c2ecdf` · 200 `#8fdcc5` · 300 `#52c8a6` · 400 `#1fb68d` · **500 `#00a87e`** · 600 `#00956f` · 700 `#007a5b` · 800 `#005f47` · 900 `#004533` · 950 `#002a1f` |
| `red`, `rose`, `pink` | **erro** (`--data-5`) | 50 `#fdecee` · 100 `#fad4d8` · 200 `#f5a9b0` · 300 `#ee7b86` · 400 `#e85865` · **500 `#e23b4a`** · 600 `#c92d3b` · 700 `#a8232f` · 800 `#851c26` · 900 `#63151c` · 950 `#3d0c11` |
| `yellow`, `amber`, `orange` | **alerta** (`--data-4`) | 50 `#fef4e6` · 100 `#fde5c2` · 200 `#fbcb8a` · 300 `#f6ac4f` · 400 `#f19322` · **500 `#ec7e00`** · 600 `#c96b00` · 700 `#a35700` · 800 `#7d4300` · 900 `#5a3000` · 950 `#361d00` |

**Nota sobre o accent.** No app o "botão primário" é `bg-blue-600` e o hover é `bg-blue-700`. Por isso o accent do DS (`#0891b2`, chamado `cyan-700` no DS) fica na posição 600, e o hover (`#0e7490`) fica na 700. Isso preserva a direção "hover = mais escuro".

**Aliases semânticos para código novo:**

| Alias | Valor |
|---|---|
| `accent` | `DEFAULT #0891b2`, `hover #0e7490`, `subtle #ecfeff`, `bright #00ffff` |
| `ink` | `1..5` |
| `paper` | `#f4f4f5` |
| `hairline` | `#e5e7eb` |
| `fg` | `1..4` |

O config leva um comentário de cabeçalho explicando que nomes como `blue` e `purple` são aliases do brikz. Os valores ficam em `src/styles/brikzTokens.js`, uma cópia adaptada de `dist/tokens.js`, que é importada pelo config.

### 3. Tipografia, raios e sombras no config

- `fontFamily`:
  - `sans` = Inter + system;
  - `display` = Space Grotesk;
  - `mono` = JetBrains Mono.
- `borderRadius`:
  - `sm 4px`, `DEFAULT 6px`, `md 6px`, `lg 8px`, `xl 10px`, `2xl 12px`, `3xl 16px`, `full 9999px`.
  - Em relação ao default do Tailwind, `xl` cai de 12 para 10px, `2xl` de 16 para 12px e `3xl` de 24 para 16px.
- `boxShadow`:
  - `sm` = DS `card`;
  - `DEFAULT` e `md` = `card`;
  - `lg` e `xl` = DS `lift`;
  - `2xl` = `lift`;
  - adiciona `glow` (reservado para CTA principal).
- `transitionTimingFunction.DEFAULT` = `cubic-bezier(0.16,1,0.3,1)`, que é o `--ease-out` do DS.

### 4. Gráficos

- Criar `src/styles/chartColors.ts`:
  - `CHART_COLORS = ['#0891b2', '#5B7FFF', '#00A87E', '#EC7E00', '#E23B4A', '#8B5CF6']`;
  - `CHART_SEMANTIC = { success, danger, warning, accent, neutral }`.
- Substituir os hex literais nos 7 arquivos pelo token equivalente, mantendo a semântica existente (verde → `success`, vermelho → `danger` etc.):
  - `ChargebackMonitoringModule.tsx`
  - `ClientRadar.tsx`
  - `ContractDetail.tsx`
  - `DailyMonitoringDashboard.tsx`
  - `GuaranteeProblemsBoard.tsx`
  - `LiquidationProblemModule.tsx`
  - `ReceivablesFlowChart.tsx`
- `--data-*` é usado **só** em gráficos, conforme o DS.

### 5. Shell e marca

- **Header e Sidebar:** usam o logo oficial `public/brand/logo-on-light.png`, sem logo inventado e com `brikz` sempre minúsculo em textos. A Sidebar fica clara, e o estado ativo (hoje `emerald`) passa automaticamente a cyan pelo remapeamento.
- **Login:** layout em duas colunas.
  - À esquerda, o painel `.ink`: fundo `#000`, `logo-on-dark.png`, título curto em Space Grotesk e acento `#00ffff` usado uma única vez.
  - À direita, o formulário claro existente.
  - Abaixo de `md`, só o formulário, com o logo on-light.
  - Copy em PT-BR, sem exclamação e sem os padrões proibidos pelo DS.
- **`index.html`:** `lang="pt-BR"`, favicon a partir do logo e título mantido ("Registros de AP").

## Fora do escopo

- **Fase B:** componentes base (`Button`, `Input`, `Modal`, `Badge`, `Card`, `Table`).
- **Fase C:** codemod de classes para tokens semânticos (`bg-blue-600` → `bg-accent`).
- Dark mode, que o DS não define.
- Mudanças de layout ou comportamento em telas de feature.

## Riscos

- **Perda de distinção por categoria.** Onde purple, teal ou violet diferenciavam categorias (badges, tipos), elas passam a ter a mesma cor do accent. Mitigação: durante a implementação, listar os arquivos onde isso acontece em `docs/superpowers/specs/2026-10-01-brikz-revisao-categorias.md` para revisão; a correção fica para a fase B.
- **Nomes enganosos.** `blue` passa a ser cyan, o que fica documentado no config. A fase C elimina isso.
- **Raios menores** podem mudar a sensação de cards e modais. É intencional, para seguir o DS.
- **Contraste do accent como texto.** O accent do DS `#0891b2` usado como cor de texto (`text-blue-600`, `text-purple-600`, `text-teal-600`, `text-emerald-600`, ~430 ocorrências) tem contraste 3,68:1 sobre branco (3,54:1 sobre `bg-blue-50`), abaixo do WCAG AA 4,5:1 para texto normal; o mesmo vale para texto branco sobre `bg-blue-600`. Aceito na fase A por ser o valor oficial `--fg-accent` do DS. Para a fase C, avaliar um token `text-accent-strong` com `#0e7490` (5,36:1) para usos de texto.

## Verificação

1. `npm run build` e `npx tsc --noEmit` sem erros novos.
2. App rodando (`npm run dev`) e screenshots antes/depois de:
   - Login;
   - Dashboard;
   - uma tela de tabela;
   - um modal;
   - uma tela com gráficos.
3. Conferir no navegador que:
   - as fontes carregam (aba Network sem 404 em `/fonts`);
   - o logo aparece em Header, Sidebar e Login.
4. `grep` confirmando que não restam hex de gráfico fora de `chartColors.ts` nos 7 arquivos.
