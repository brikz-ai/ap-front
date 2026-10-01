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
