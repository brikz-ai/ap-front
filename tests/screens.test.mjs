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
