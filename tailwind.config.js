import { scales, paletteMap, semantic, fontFamily, borderRadius, boxShadow, easeOut } from './src/styles/brikzTokens.js';

// Brikz Design System, fase A: os nomes de paleta do Tailwind (blue, gray, purple...) sao
// ALIASES das escalas brikz. `bg-blue-600` renderiza o accent cyan #0891b2. Mapeamento em
// src/styles/brikzTokens.js (paletteMap). Codigo novo deve preferir accent / ink / fg / paper / hairline.
const remappedPalettes = Object.fromEntries(
  Object.entries(paletteMap).map(([palette, scale]) => [palette, scales[scale]]),
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
    },
  },
  plugins: [],
};
