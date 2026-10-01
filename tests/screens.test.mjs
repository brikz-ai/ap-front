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
