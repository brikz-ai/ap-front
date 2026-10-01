// Valores do Brikz Design System (C:\DEV\brikz\Brikz Design System\dist\tokens.js),
// adaptados as posicoes de shade do Tailwind. Fonte unica para tailwind.config.js e testes.

const accent = {
  50: '#ecfeff', 100: '#cffafe', 200: '#a5f3fc', 300: '#67e8f9', 400: '#22d3ee', 500: '#06b6d4',
  600: '#0891b2', // accent do DS (--cyan-700)
  700: '#0e7490', // hover do DS (--cyan-600)
  800: '#155e75', 900: '#164e63', 950: '#083344',
};

const ink = {
  50: '#fafafa', 100: '#f4f4f5', 200: '#e5e7eb', 300: '#d4d4d8', 400: '#a3a3a3', 500: '#737373',
  600: '#525252', 700: '#404040', 800: '#1f1f1f', 900: '#0a0a0a', 950: '#000000',
};

// --data-3
const success = {
  50: '#e6f7f2', 100: '#c2ecdf', 200: '#8fdcc5', 300: '#52c8a6', 400: '#1fb68d', 500: '#00a87e',
  600: '#00956f', 700: '#007a5b', 800: '#005f47', 900: '#004533', 950: '#002a1f',
};

// --data-5
const danger = {
  50: '#fdecee', 100: '#fad4d8', 200: '#f5a9b0', 300: '#ee7b86', 400: '#e85865', 500: '#e23b4a',
  600: '#c92d3b', 700: '#a8232f', 800: '#851c26', 900: '#63151c', 950: '#3d0c11',
};

// --data-4
const warning = {
  50: '#fef4e6', 100: '#fde5c2', 200: '#fbcb8a', 300: '#f6ac4f', 400: '#f19322', 500: '#ec7e00',
  600: '#c96b00', 700: '#a35700', 800: '#7d4300', 900: '#5a3000', 950: '#361d00',
};

export const scales = { accent, ink, success, danger, warning };

// O DS tem um unico accent: todo matiz decorativo do Tailwind vira cyan.
export const paletteMap = {
  blue: 'accent', sky: 'accent', indigo: 'accent', cyan: 'accent', teal: 'accent', emerald: 'accent',
  purple: 'accent', violet: 'accent', fuchsia: 'accent',
  slate: 'ink', gray: 'ink', zinc: 'ink', neutral: 'ink', stone: 'ink',
  green: 'success', lime: 'success',
  red: 'danger', rose: 'danger', pink: 'danger',
  yellow: 'warning', amber: 'warning', orange: 'warning',
};

export const semantic = {
  accent: { DEFAULT: '#0891b2', hover: '#0e7490', subtle: '#ecfeff', bright: '#00ffff' },
  ink: { 1: '#0a0a0a', 2: '#1f1f1f', 3: '#525252', 4: '#737373', 5: '#a3a3a3' },
  paper: '#f4f4f5',
  hairline: '#e5e7eb',
  fg: { 1: '#0a0a0a', 2: '#1f1f1f', 3: '#525252', 4: '#737373' },
  // texto sobre fundo .ink (--fg-ink-2 / --fg-ink-3)
  'fg-ink': { 2: '#b3b3b3', 3: '#808080' },
};

export const dataViz = ['#0891b2', '#5B7FFF', '#00A87E', '#EC7E00', '#E23B4A', '#8B5CF6'];

export const fontFamily = {
  sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
  display: ['Space Grotesk', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'ui-monospace', 'Menlo', 'monospace'],
};

export const borderRadius = {
  none: '0px', sm: '4px', DEFAULT: '6px', md: '6px', lg: '8px', xl: '10px', '2xl': '12px', '3xl': '16px',
  full: '9999px',
};

const shadowCard = '0 1px 3px rgba(15,23,42,.06), 0 1px 2px rgba(15,23,42,.04)';
const shadowLift = '0 12px 32px rgba(15,23,42,.10)';
export const boxShadow = {
  sm: shadowCard, DEFAULT: shadowCard, md: shadowCard, lg: shadowLift, xl: shadowLift, '2xl': shadowLift,
  glow: '0 8px 24px rgba(8,145,178,.25), 0 0 0 1px rgba(8,145,178,.10)',
};

export const easeOut = 'cubic-bezier(0.16, 1, 0.3, 1)';
