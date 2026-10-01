import { scales, paletteMap, focusPalettes, semantic, fontFamily, borderRadius, boxShadow, easeOut } from './src/styles/brikzTokens.js';

// Brikz Design System, Platform UI clara: os nomes de paleta do Tailwind (blue, gray, purple...) sao
// ALIASES das escalas brikz. `bg-blue-600` renderiza o primario preto (#0a0a0a); cyan so via `cyan-*` /
// `accent`. Focus/ring (ring-*, border-*-400..500) dessas paletas continuam cyan. Ver src/styles/brikzTokens.js.
const remappedPalettes = Object.fromEntries(
  Object.entries(paletteMap).map(([palette, scale]) => [palette, scales[scale]]),
);

const focusRing = { DEFAULT: scales.accent['500'], ...Object.fromEntries(focusPalettes.map(p => [p, scales.accent])) };
const focusBorder = Object.fromEntries(
  focusPalettes.map(p => [p, { 400: scales.accent['400'], 500: scales.accent['500'] }]),
);

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    fontFamily,
    borderRadius,
    extend: {
      colors: { ...remappedPalettes, ...semantic },
      boxShadow,
      transitionTimingFunction: { DEFAULT: easeOut, out: easeOut },
      ringColor: focusRing,
      borderColor: focusBorder,
    },
  },
  plugins: [],
};
