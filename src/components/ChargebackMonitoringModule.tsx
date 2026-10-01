import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingDown,
  Search,
  Download,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { UrIdLink } from './UrIdLink';
import { KpiCard, Tag } from './ui';
import { CHART_AXIS, getAcquirerColor } from '../styles/chartColors';
import type { Receivable } from '../types';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);

export const ChargebackMonitoringModule: React.FC = () => {
  const { receivables, contracts, clients } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [contractFilter, setContractFilter] = useState<string>('all');
  const [acquirerFilter, setAcquirerFilter] = useState<string>('all');
  const [chartExpanded, setChartExpanded] = useState(true);

  const chargebackReceivables = useMemo(
    () => receivables.filter((r): r is Receivable & { chargebackDate?: Date } =>
      r.status === 'chargeback'
    ),
    [receivables]
  );

  const contractMap = useMemo(
    () => new Map(contracts.map((c) => [c.id, c])),
    [contracts]
  );
  const clientMap = useMemo(
    () => new Map(clients.map((c) => [c.id, c.name])),
    [clients]
  );

  const filteredReceivables = useMemo(() => {
    return chargebackReceivables.filter((r) => {
      const contract = contractMap.get(r.contractId);
      const clientName = contract ? clientMap.get(contract.clientId) ?? '' : '';
      const contractNumber = contract?.contractNumber ?? '';
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        r.id.toLowerCase().includes(searchLower) ||
        contractNumber.toLowerCase().includes(searchLower) ||
        clientName.toLowerCase().includes(searchLower) ||
        r.acquirer.toLowerCase().includes(searchLower);
      const matchesContract =
        contractFilter === 'all' || contract?.contractNumber === contractFilter;
      const matchesAcquirer =
        acquirerFilter === 'all' || r.acquirer === acquirerFilter;
      return matchesSearch && matchesContract && matchesAcquirer;
    });
  }, [
    chargebackReceivables,
    searchTerm,
    contractFilter,
    acquirerFilter,
    contractMap,
    clientMap,
  ]);

  const uniqueContracts = useMemo(
    () =>
      Array.from(
        new Set(
          chargebackReceivables
            .map((r) => contractMap.get(r.contractId)?.contractNumber)
            .filter(Boolean) as string[]
        )
      ).sort(),
    [chargebackReceivables, contractMap]
  );

  const uniqueCredenciadoras = useMemo(
    () =>
      Array.from(new Set(chargebackReceivables.map((r) => r.acquirer))).sort(),
    [chargebackReceivables]
  );

  const totalReduction = filteredReceivables.reduce(
    (sum, r) => sum + (r.originalValue - r.encumberedValue),
    0
  );

  const affectedContractsCount = useMemo(
    () => new Set(filteredReceivables.map((r) => r.contractId)).size,
    [filteredReceivables]
  );

  const affectedAcquirersCount = useMemo(
    () => new Set(filteredReceivables.map((r) => r.acquirer)).size,
    [filteredReceivables]
  );

  const chartData = useMemo(() => {
    const withDate = filteredReceivables.filter(
      (r): r is Receivable & { chargebackDate: Date } =>
        !!r.chargebackDate
    );
    const byDateAcquirer = new Map<string, Map<string, number>>();

    for (const r of withDate) {
      const dateKey = r.chargebackDate!.toISOString().slice(0, 10);
      const reduction = r.originalValue - r.encumberedValue;
      if (!byDateAcquirer.has(dateKey)) {
        byDateAcquirer.set(dateKey, new Map());
      }
      const acquirerMap = byDateAcquirer.get(dateKey)!;
      acquirerMap.set(
        r.acquirer,
        (acquirerMap.get(r.acquirer) ?? 0) + reduction
      );
    }

    const sortedDates = Array.from(byDateAcquirer.keys()).sort();
    const acquirersInData = new Set<string>();
    for (const m of byDateAcquirer.values()) {
      for (const a of m.keys()) acquirersInData.add(a);
    }
    const acquirersSorted = Array.from(acquirersInData).sort();

    return sortedDates.map((dateKey) => {
      const d = new Date(dateKey + 'T12:00:00');
      const row: Record<string, string | number> = {
        date: formatDate(d),
        dateKey,
      };
      let total = 0;
      for (const acquirer of acquirersSorted) {
        const val = byDateAcquirer.get(dateKey)?.get(acquirer) ?? 0;
        row[acquirer] = val;
        total += val;
      }
      row.total = total;
      return row;
    });
  }, [filteredReceivables]);

  const chartAcquirers = useMemo(() => {
    const s = new Set<string>();
    for (const row of chartData) {
      for (const k of Object.keys(row)) {
        if (k !== 'date' && k !== 'dateKey' && k !== 'total') s.add(k);
      }
    }
    return Array.from(s).sort();
  }, [chartData]);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="URs com chargeback" value={filteredReceivables.length} />
        <KpiCard label="Redução total" tone="danger" value={formatCurrency(totalReduction)} />
        <KpiCard label="Contratos afetados" value={affectedContractsCount} />
        <KpiCard label="Credenciadoras" value={affectedAcquirersCount} />
      </section>

      {chartData.length > 0 && (
        <section className="panel">
          <button
            type="button"
            onClick={() => setChartExpanded((e) => !e)}
            className="panel-head w-full text-left hover:bg-gray-50 transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-gray-400" />
            <h2 className="panel-title">Valor de chargeback por dia</h2>
            <span className="panel-meta">
              {chartData[0].date} – {chartData[chartData.length - 1].date}
            </span>
            <span className="ml-auto">
              {chartExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </span>
          </button>
          {chartExpanded && (
            <div className="px-6 pb-6 pt-4">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 10, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_AXIS.grid} vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke={CHART_AXIS.tick}
                    tick={{ angle: -45, textAnchor: 'end', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fill: CHART_AXIS.tick }}
                  />
                  <YAxis
                    stroke={CHART_AXIS.tick}
                    tick={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fill: CHART_AXIS.tick }}
                    tickFormatter={(v) =>
                      v >= 1000 ? `R$ ${(v / 1000).toFixed(0)}k` : `R$ ${v}`
                    }
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), '']}
                    labelFormatter={(label) => `Data: ${label}`}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const p = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg text-sm">
                          <p className="font-mono font-medium text-gray-900 mb-2">
                            {p.date}
                          </p>
                          {chartAcquirers
                            .filter((a) => (p[a] as number) > 0)
                            .map((a) => (
                              <p key={a} className="text-gray-700">
                                {a}: <span className="font-mono">{formatCurrency(p[a] as number)}</span>
                              </p>
                            ))}
                          <p className="font-semibold text-red-500 mt-1 pt-1 border-t border-gray-100">
                            Total: <span className="font-mono">{formatCurrency(p.total as number)}</span>
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Legend
                    align="right"
                    verticalAlign="middle"
                    layout="vertical"
                    iconType="square"
                    wrapperStyle={{ fontSize: 12 }}
                  />
                  {chartAcquirers.map((acquirer) => (
                    <Bar
                      key={acquirer}
                      dataKey={acquirer}
                      stackId="chargeback"
                      fill={getAcquirerColor(acquirer)}
                      radius={[3, 3, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      )}

      <section className="panel">
        <div className="panel-head flex-wrap">
          <h2 className="panel-title">URs afetadas</h2>
          <span className="panel-meta">{filteredReceivables.length} registros</span>
          <div className="ml-auto flex flex-wrap gap-2 items-center">
            <select
              value={contractFilter}
              onChange={(e) => setContractFilter(e.target.value)}
              className="select-soft"
            >
              <option value="all">Todos os contratos</option>
              {uniqueContracts.map((cn) => (
                <option key={cn} value={cn}>
                  {cn}
                </option>
              ))}
            </select>
            <select
              value={acquirerFilter}
              onChange={(e) => setAcquirerFilter(e.target.value)}
              className="select-soft"
            >
              <option value="all">Todas as credenciadoras</option>
              {uniqueCredenciadoras.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar UR, contrato, credenciadora..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-soft pl-8 w-64"
              />
            </div>
            <button className="btn btn-primary" title="Exportar">
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table-brikz">
            <thead>
              <tr>
                <th>UR</th>
                <th>Contrato / Cliente</th>
                <th>Credenciadora</th>
                <th className="text-right">Valor original</th>
                <th className="text-right">Valor após chargeback</th>
                <th className="text-right">Redução</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {filteredReceivables.map((r) => {
                const contract = contractMap.get(r.contractId);
                const clientName = contract
                  ? clientMap.get(contract.clientId) ?? '-'
                  : '-';
                const reduction = r.originalValue - r.encumberedValue;
                return (
                  <tr key={r.id}>
                    <td>
                      <UrIdLink urId={r.id} />
                    </td>
                    <td>
                      <span className="font-mono text-[12.5px] text-gray-900">
                        {contract?.contractNumber ?? '-'}
                      </span>
                      <span className="block text-xs text-gray-500">{clientName}</span>
                    </td>
                    <td>
                      <Tag color={getAcquirerColor(r.acquirer)}>
                        {r.acquirer} {r.cardBrand}
                      </Tag>
                    </td>
                    <td className="text-right font-mono text-[12.5px]">
                      {formatCurrency(r.originalValue)}
                    </td>
                    <td className="text-right font-mono text-[12.5px]">
                      {formatCurrency(r.encumberedValue)}
                    </td>
                    <td className="text-right">
                      <span className="font-mono font-semibold text-red-500">
                        -{formatCurrency(reduction)}
                      </span>
                    </td>
                    <td className="font-mono text-[12.5px]">
                      {r.chargebackDate
                        ? formatDate(r.chargebackDate)
                        : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredReceivables.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <TrendingDown className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Nenhuma UR com chargeback encontrada com os filtros aplicados.</p>
          </div>
        )}
      </section>
    </div>
  );
};
