# Brikz Design System, Fase B: Platform UI clara

**Data:** 2026-10-01
**Antecede:** `2026-10-01-brikz-design-system-design.md` (fase A, já implementada na branch `feat/brikz-design-system`)
**Mockup aprovado:** `C:\Users\rdeli\AppData\Local\Temp\claude\C--DEV-ap-ap-front\e7c43e22-f98a-47ac-a2c1-f375ed7729ba\scratchpad\mockup\chargeback.html` (tela de Chargeback). Os trechos relevantes estão reproduzidos aqui.

## Problema

A fase A trocou as cores, mas o app ficou "longe do DS". As causas:

1. O azul do Tailwind (o primário de fato) virou cyan, e o cyan passou a dominar botões, links, badges e ícones. No DS o primário é **preto (ink-1)**, e o cyan aparece pouco: no máximo um elemento saturado por viewport.
2. A forma dos componentes não mudou. O DS tem uma anatomia própria: botões primary/soft/ghost/chip, labels em mono maiúsculo, tags, status pills, painéis hairline, cabeçalho de página com eyebrow e linha cyan, e nav com marca de item ativo.

## Decisão de direção

**Platform UI clara** (opção A, escolhida pelo usuário):
- superfície branca e off-white;
- preto como cor primária;
- cyan reservado a estado ativo, focus, links de ID e seleção;
- mono como textura técnica.

## Design

### 1. Remapeamento de cor v2

Nova escala `primary` (ink para ação), em `src/styles/brikzTokens.js`:

| shade | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| hex | `#fafafa` | `#f4f4f5` | `#e5e7eb` | `#d4d4d8` | `#a3a3a3` | `#525252` | `#0a0a0a` | `#000000` | `#000000` | `#000000` | `#000000` |

`paletteMap`:
- `blue`, `sky`, `indigo`, `purple`, `violet`, `fuchsia`, `teal` e `emerald` passam para `primary`. Com isso, `bg-blue-600` vira o botão preto do DS, `bg-blue-50` vira off-white e `text-blue-600` vira quase preto.
- `cyan` fica como `accent`, que é a forma explícita de usar o cyan.
- `gray`/`slate`/`zinc`/`neutral`/`stone`, `green`/`lime`, `red`/`rose`/`pink` e `yellow`/`amber`/`orange` não mudam em relação à fase A.

**Focus e seleção continuam em cyan.** Para isso, há override só nos utilitários de anel e borda:
- `theme.extend.ringColor`: as 8 paletas `primary` usam a escala `accent` inteira.
- `theme.extend.borderColor`: as 8 paletas `primary` usam `accent` apenas nos shades 400, 500 e 600, que são os de focus e seleção (`focus:border-blue-500`, `border-blue-500` em item selecionado). Os shades claros de borda (100 a 300) seguem `primary` e ficam hairline neutros.

### 2. Camada de componentes do DS

**`src/styles/brikz-components.css`** (`@layer components`, importado por `src/index.css`), com as classes:

| Classe | Uso |
|---|---|
| `.btn` + `.btn-primary`, `.btn-soft`, `.btn-ghost`, `.btn-accent`, `.btn-sm` | Taxonomia de botões do DS. O `.btn-accent` é o CTA de destaque, no máximo 1 por tela. |
| `.chips` + `.chip`, `.chip-on` | Filtros segmentados. |
| `.input-soft`, `.select-soft` | Campos off-white com hairline e focus cyan. |
| `.panel`, `.panel-head`, `.panel-title`, `.panel-meta` | Painel hairline com raio de 12px. |
| `.table-brikz` | Cabeçalho mono maiúsculo em off-white e linhas hairline-soft. |
| `.label-mono` | Rótulos em mono, maiúsculas, tracking 0.12em, ink-4. |
| `.eyebrow`, `.line-accent` | Eyebrow do DS. |
| `.tag` | Tag de categoria neutra, com quadradinho colorido opcional via `--tag-color`. |
| `.status`, `.status-ready`, `.status-idle`, `.status-success`, `.status-warning`, `.status-danger` | Status pills. |

**Componentes React em `src/components/ui/`:**
- `PageHeader` (eyebrow + título + descrição + ações);
- `KpiCard`;
- `Tag`;
- `StatusPill`.

### 3. Shell

- **Layout (App):** o fundo cinza `bg-gray-50` dá lugar a branco, com um degradê cyan sutil no topo do conteúdo.
- **`PageHeader` global:** o App renderiza um `PageHeader` acima de cada seção, com eyebrow igual ao grupo da navegação (Principal, Monitoramento, Relatórios, Contestação, Configurações, Gestão de acessos) e título igual ao `pageTitle` existente.
- **Header:** o título deixa de existir e entra um breadcrumb mono no lugar (`Grupo / Página`). Busca passa a ser soft, e o badge de notificação vira um ponto cyan.
- **Sidebar:**
  - rótulos de grupo em mono maiúsculo `ink-5`;
  - item ativo com texto `ink-1`, fundo `paper` e marca cyan de 2px à esquerda;
  - subitens com guia hairline à esquerda;
  - hover em off-white.

### 4. Telas migradas nesta fase

As telas abaixo seguem o mockup aprovado:
- Chargeback (`ChargebackMonitoringModule`);
- Problemas de liquidação (`LiquidationProblemModule`);
- Contratos (`ClientTable`);
- Cadastro (`PartnerRegistrationModule`).

O que cada uma ganha:
- filtros com `.select-soft` e `.input-soft`;
- `Exportar` e ações principais com `.btn-primary`, e as secundárias com `.btn-soft`;
- KPIs com `KpiCard`, usando **somente métricas que já existem nos dados da tela** (sem inventar números);
- tabelas com `.table-brikz`;
- IDs e valores em mono;
- credenciadora como `Tag` com a cor do gráfico (`getAcquirerColor`);
- painéis com `.panel`.

As demais telas recebem só o efeito global: remapeamento de cor, `PageHeader`, Sidebar e Header.

### 5. Sucesso volta a ser verde

Com `emerald` passando para `primary`, os pontos onde `emerald` indicava status de sucesso trocam explicitamente para `green`, um ponto de cada vez, conforme `docs/superpowers/specs/2026-10-01-brikz-revisao-categorias.md`, seção "Observação: semântica de sucesso".

## Fora do escopo

- Migrar as outras ~90 telas e modais para a camada de componentes. Isso fica para a evolução contínua, tela a tela.
- Modais (anatomia de modal do DS).
- Dark mode.

## Riscos

- **Links de texto perdem a cor de affordance.** `text-blue-600` passa a ser quase preto. Os links de ID (`UrIdLink`) usam `text-cyan-*` explícito. Os demais links ficam pretos, como no DS, e o hover sublinha.
- **Badges coloridos** (`bg-blue-100 text-blue-800`) ficam neutros. As categorias que se apoiavam nessa cor já estão listadas na revisão de categorias.

## Verificação

1. `npm test` (testes de tokens e testes que compilam a camada de componentes via PostCSS), o número de erros de `tsc` (baseline 96) e `vite build`.
2. Checagem visual no navegador de Chargeback, Problemas de liquidação, Contratos e Cadastro, comparando com o mockup.
