/** @type {import('tailwindcss').Config} */
// Colours, fonts and radii mirror design/tokens.json (the sea-chart design system).
// Colour values are CSS variables defined per theme (Dag/Natt) in src/theme.css.
// `ocean` and `slate` are remapped onto that palette so existing utility classes
// pick up the new look; new code should prefer the named tokens.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'rgb(var(--c-paper) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        shallow: 'rgb(var(--c-shallow) / <alpha-value>)',
        land: 'rgb(var(--c-land) / <alpha-value>)',
        line: 'rgb(var(--c-line) / <alpha-value>)',
        ink: { DEFAULT: 'rgb(var(--c-ink) / <alpha-value>)', muted: 'rgb(var(--c-ink-muted) / <alpha-value>)' },
        deep: { DEFAULT: 'rgb(var(--c-deep) / <alpha-value>)', on: 'rgb(var(--c-deep-on) / <alpha-value>)', hover: 'rgb(var(--c-deep-hover) / <alpha-value>)' },
        magenta: { DEFAULT: 'rgb(var(--c-magenta) / <alpha-value>)', dark: 'rgb(var(--c-magenta-dark) / <alpha-value>)', light: 'rgb(var(--c-magenta-light) / <alpha-value>)', on: 'rgb(var(--c-on-magenta) / <alpha-value>)' },
        // Same in both themes; text on them via bandInk() in components/passage/bands.js.
        band: {
          flat: '#9fd8c8',
          comfortable: '#c9d96a',
          uncomfortable: '#f2b33d',
          bucket: '#c2410c',
          ashore: '#8f1d2c',
        },
        // Navy ramp: 100 = shallow, 600 = deep, 700 = ink. Flips direction in Natt.
        ocean: {
          50: 'rgb(var(--c-ocean-50) / <alpha-value>)',
          100: 'rgb(var(--c-ocean-100) / <alpha-value>)',
          200: 'rgb(var(--c-ocean-200) / <alpha-value>)',
          300: 'rgb(var(--c-ocean-300) / <alpha-value>)',
          400: 'rgb(var(--c-ocean-400) / <alpha-value>)',
          500: 'rgb(var(--c-ocean-500) / <alpha-value>)',
          600: 'rgb(var(--c-ocean-600) / <alpha-value>)',
          700: 'rgb(var(--c-ocean-700) / <alpha-value>)',
          800: 'rgb(var(--c-ocean-800) / <alpha-value>)',
          900: 'rgb(var(--c-ocean-900) / <alpha-value>)',
        },
        // Cool greys biased toward ink. 50 = paper, 200 = line, 600 = ink-muted, 800 = ink. Flips in Natt.
        slate: {
          50: 'rgb(var(--c-slate-50) / <alpha-value>)',
          100: 'rgb(var(--c-slate-100) / <alpha-value>)',
          200: 'rgb(var(--c-slate-200) / <alpha-value>)',
          300: 'rgb(var(--c-slate-300) / <alpha-value>)',
          400: 'rgb(var(--c-slate-400) / <alpha-value>)',
          500: 'rgb(var(--c-slate-500) / <alpha-value>)',
          600: 'rgb(var(--c-slate-600) / <alpha-value>)',
          700: 'rgb(var(--c-slate-700) / <alpha-value>)',
          800: 'rgb(var(--c-slate-800) / <alpha-value>)',
          900: 'rgb(var(--c-slate-900) / <alpha-value>)',
        },
      },
      // Families are variables (src/theme.css) so a page can swap them for its
      // subtree; the landing page does (src/pages/landing.css).
      fontFamily: {
        sans: ['var(--font-sans)'],
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)'],
      },
      boxShadow: {
        panel: 'var(--shadow-panel)',
      },
    },
  },
  plugins: [],
};
