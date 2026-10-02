/** @type {import('tailwindcss').Config} */
// Colours, fonts and radii mirror design/tokens.json (the sea-chart design system).
// `ocean` and `slate` are remapped onto that palette so existing utility classes
// pick up the new look; new code should prefer the named tokens.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#f6f8f7',
        surface: '#ffffff',
        shallow: '#d6e9f2',
        land: '#efe2b3',
        line: '#cfdbe1',
        ink: { DEFAULT: '#0f2a3d', muted: '#4a6272' },
        deep: { DEFAULT: '#12354d', on: '#eaf3f7' },
        magenta: { DEFAULT: '#b0186f', dark: '#8e1259', light: '#f6e3ee' },
        band: {
          flat: '#9fd8c8',
          comfortable: '#c9d96a',
          uncomfortable: '#f2b33d',
          bucket: '#c2410c',
          ashore: '#8f1d2c',
        },
        // Navy ramp: 100 = shallow, 600 = deep, 700 = ink.
        ocean: {
          50:  '#eaf3f7',
          100: '#d6e9f2',
          200: '#bcd6e4',
          300: '#93b6c9',
          400: '#5b8199',
          500: '#2a5673',
          600: '#12354d',
          700: '#0f2a3d',
          800: '#0b2233',
          900: '#07131b',
        },
        // Cool greys biased toward ink. 50 = paper, 200 = line, 600 = ink-muted, 800 = ink.
        slate: {
          50:  '#f6f8f7',
          100: '#eaf0f2',
          200: '#cfdbe1',
          300: '#b3c3cc',
          400: '#5f7787',
          500: '#526b7b',
          600: '#4a6272',
          700: '#2b4557',
          800: '#0f2a3d',
          900: '#0b1f2d',
        },
      },
      fontFamily: {
        sans: ['"Hanken Grotesk"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
        display: ['"Bricolage Grotesque"', '"Arial Narrow"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 2px rgba(15,42,61,0.06), 0 8px 24px rgba(15,42,61,0.08)',
      },
    },
  },
  plugins: [],
};
