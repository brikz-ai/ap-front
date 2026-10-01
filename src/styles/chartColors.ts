// Cores de graficos do Brikz Design System (--data-1..6). Usar SO em graficos.
export const CHART_COLORS = ['#0891b2', '#5B7FFF', '#00A87E', '#EC7E00', '#E23B4A', '#8B5CF6'] as const;

export const CHART_SEMANTIC = {
  accent: '#0891b2',
  success: '#00A87E',
  danger: '#E23B4A',
  warning: '#EC7E00',
  neutral: '#a3a3a3',
};

export const CHART_AXIS = {
  grid: '#e5e7eb',
  tick: '#a3a3a3',
};

// Chaves normalizadas (minusculas, sem espacos/pontuacao). Casamento por `includes`.
const ACQUIRER_COLORS: Record<string, string> = {
  cielo: CHART_COLORS[1],
  rede: CHART_COLORS[4],
  getnet: CHART_COLORS[3],
  stone: CHART_COLORS[2],
  pagseguro: CHART_COLORS[5],
  dock: CHART_COLORS[0],
  mercadopago: '#525252',
};

export function getAcquirerColor(name: string): string {
  const key = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!key) return CHART_SEMANTIC.neutral;
  for (const [acquirer, color] of Object.entries(ACQUIRER_COLORS)) {
    if (key.includes(acquirer)) return color;
  }
  return CHART_SEMANTIC.neutral;
}
