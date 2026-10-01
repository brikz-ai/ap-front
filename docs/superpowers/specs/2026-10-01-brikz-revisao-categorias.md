# Brikz fase A: categorias que perderam distinção de cor

Após o remapeamento do Tailwind (`src/styles/brikzTokens.js`), as paletas abaixo passam a renderizar a mesma escala:

- **accent (cyan):** blue, sky, indigo, cyan, teal, emerald, purple, violet, fuchsia;
- **success:** green, lime;
- **danger:** red, rose, pink;
- **warning:** yellow, amber, orange;
- **ink:** gray, slate, zinc, neutral, stone.

Os mapas abaixo usavam essas cores para distinguir categorias (status, tipo, prioridade, papel). Revisar na fase B.

## Colisões

| Arquivo:linha | Categorias que colidem | Sugestão fase B |
|---|---|---|
| `src/components/ContractApprovalBoard.tsx:21-24` | Tipo de produto: `guarantee` (blue), `extra-limit` (purple) e `anticipation` (teal) | Badge neutro (ink) com ícone por produto, ou outline vs sólido |
| `src/components/ContractApprovalBoard.tsx:275-276` | Tipo de alteração: `term` (blue) vs `conditions` (purple) | Badge neutro com ícone; manter só `value` em cor |
| `src/components/ContractDetail.tsx:71-74` | Evento de conta corrente: `contrato_criado` (blue), `liquidacao_total` (emerald), `liquidacao_parcial` (teal) | `liquidacao_total` sólido, `liquidacao_parcial` outline, `contrato_criado` neutro |
| `src/components/ContractDetail.tsx:74-77` | `nao_liquidada_na_data` (orange) vs `liquidacao_prevista` (amber) | Usar warning vs danger, ou warning sólido vs outline |
| `src/components/DisputesModule.tsx:28-31` | Mesmos eventos de `ContractDetail`: `contrato_criado` / `liquidacao_total` / `liquidacao_parcial` | Extrair `getEventoBadge` compartilhado e aplicar a mesma solução |
| `src/components/DisputesModule.tsx:31,33` | `nao_liquidada_na_data` (orange) vs `liquidacao_prevista` (amber) | Idem acima |
| `src/components/ReceivablesLedgerModule.tsx:40-43` | Mesmos eventos: `contrato_criado` / `liquidacao_total` / `liquidacao_parcial` e `nao_liquidada_na_data` vs `liquidacao_prevista` | Idem; unificar os três `getEventoBadge` em um util |
| `src/components/DailyActionCard.tsx:24-39` | Prioridade: `high` (orange) vs `medium` (yellow); `low` (blue) fica distinto do warning | `high` como danger/warning sólido, `medium` warning outline, com rótulo visível |
| `src/components/GuaranteeProblemsBoard.tsx:83-84` | Tipo de problema: `onus_application` (blue) vs `ownership_transfer` (purple) | Badge neutro com ícone por tipo |
| `src/components/GuaranteeProblemsBoard.tsx:94-95` | Severidade: `high` (orange) vs `medium` (yellow) | `high` danger suave, `medium` warning; texto da severidade no badge |
| `src/components/FormalizationModule.tsx:171-175` | Fluxo de negócio: `onboarding` (blue) vs `credit_analysis` (purple); `contract_negotiation` (orange) segue warning | Badge neutro com ícone; reservar cor para status |
| `src/components/FormalizationDetail.tsx:428,437` | Botões de ação: "Solicitar Opt-in" (blue) vs "Fazer Upload de Contrato" (teal) | Ambos primários; diferenciar por ícone e rótulo |
| `src/components/RegistryProblemDetail.tsx:160,162` | Ícone do tipo de problema: `domicile_change_rejected` (orange) vs `lock_application_failed` (yellow) | Ícones distintos em ink, cor só para severidade |
| `src/utils/contratoCerc.ts:26-35` | Status CERC: `PENDENTE_CONCILIACAO` (orange) vs `AGUARDANDO_WEBHOOK`, `ATUALIZANDO`, `INATIVANDO`, `BAIXANDO`, `RESILINDO_*` (yellow) | `PENDENTE_CONCILIACAO` como warning sólido (precisa de ação), demais em outline |
| `src/components/AccessManagementModule.tsx:233-234` | Cor do papel: `blue` vs `emerald` (`red` e `gray` seguem distintos) | Badge neutro com ícone do papel, ou outline vs sólido |
| `src/components/ContractMonitoringCard.tsx:42` | Barra de progresso: `pct >= 100` (emerald) vs `pct >= 75` (blue); `amber` e `red` seguem distintos | Usar success vs accent, ou rótulo/percentual explícito |
| `src/components/ScheduleView.tsx:1272-1325` | Cards de operação: `recovery` (blue), `prepayment` (teal), `ownershipTransfer` (purple) | Ícones já distinguem; usar cor única (accent) nos três |
| `src/components/ScheduleView.tsx:1306-1335` | `anticipation` (orange) vs `preContractedAntecipation` (amber); `guarantees` (green) segue success | Idem: cor única de warning, diferenciar por ícone e título |
| `src/components/OverviewModule.tsx:71,149,227` | Cards de operação: `recovery` (blue), `prepayment` (teal), `ownershipTransfer` (purple); ícones, ajuda e hover usam a mesma cor | Idem `ScheduleView`: cor única e ícone como diferenciador |
| `src/components/AgentsActiveModule.tsx:359-360` | Ícone de KPI: "Tarefas Hoje" (blue) vs "Esta Semana" (violet). Impacto baixo, decorativo | Ink ou accent único; rótulo já distingue |

Total: 20 linhas de tabela (colisões em 15 arquivos). Os três `getEventoBadge` (`ContractDetail`, `DisputesModule`, `ReceivablesLedgerModule`) são duplicados e podem ser resolvidos juntos.

## Observação: semântica de sucesso

`emerald` era usado como "OK/sucesso" em alguns lugares, e agora renderiza cyan (accent), não o verde de `success`. Não é colisão entre categorias, mas o significado verde se perdeu. Locais: `ContractMonitoringCard.tsx:32` e `:42` (status `functional` e barra `pct >= 100`), `DailyMonitoringDashboard.tsx:101-105,137` (status `functional`), `liquidacao_total` nas três funções `getEventoBadge` (`ContractDetail.tsx:72`, `DisputesModule.tsx:29`, `ReceivablesLedgerModule.tsx:41`) e o papel `emerald` em `AccessManagementModule.tsx:60,235`.

A correção da fase B é **por ponto de uso**: trocar `emerald` por `green` apenas nesses pontos de status, e **NÃO alterar o `paletteMap`**, porque ~35 usos de `emerald` são botões primários, focus rings, abas ativas e o item ativo da Sidebar, que a spec exige em cyan.

## Como foi levantado

A busca do brief (`grep ... | grep -E "case |: '|\? '|=> '"`) foi o ponto de partida, mas só cobre `bg|text|border-(purple|violet|teal|emerald|indigo|fuchsia|sky)` e perde mapas em objeto, ternários e template literals. Foi usado um script (Python, sem alterar o código) que, para cada arquivo `.ts`/`.tsx` em `src` (excluindo `.bak`/`.backup`), lista linhas com classes `bg|text|border|ring-<cor>-<tom>` em contexto de mapeamento (`case`, `chave:`, ternário, `=>`) e agrupa janelas de 14 a 40 linhas onde duas ou mais paletas do mesmo grupo remapeado aparecem. Os candidatos foram então lidos manualmente, descartando gradientes, usos decorativos únicos e casos em que as categorias seguem distintas (ex.: red vs amber vs gray).
