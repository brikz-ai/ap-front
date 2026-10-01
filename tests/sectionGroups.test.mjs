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
