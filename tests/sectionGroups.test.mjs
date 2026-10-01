import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getSectionGroup, hasOwnHeader } from '../src/navigation/sectionGroups.ts';

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

test('telas de detalhe tem cabecalho proprio', () => {
  for (const s of ['client-detail', 'client-detail-test', 'client-radar', 'contract-detail']) {
    assert.equal(hasOwnHeader(s), true, s);
  }
  for (const s of ['contracts', 'clients', 'chargeback-monitoring']) assert.equal(hasOwnHeader(s), false, s);
});
