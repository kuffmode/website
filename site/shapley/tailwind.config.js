/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['selector', '[data-mode="dark"]'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#FBF9F3',
          cream: '#F4EFE4',
          dark: '#111113',
        },
        ink: {
          DEFAULT: '#18181A',
          soft: '#222224',
          muted: '#76736B',
          light: '#EFECE4',
        },
        riso: {
          magenta: '#F53A61',
          pink: '#FF48B0',
          cyan: '#0078BF',
          blue: '#3898EC',
          yellow: '#FFB511',
          gold: '#FFC436',
          green: '#407060',
        },
      },
      fontFamily: {
        display: ['"Faculty Glyphic"', 'Georgia', 'serif'],
        sans: ['"Asta Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'riso': '4px 4px 0px rgba(245, 58, 97, 0.32), -2px -2px 0px rgba(0, 120, 191, 0.25)',
        'riso-lg': '6px 6px 0px rgba(245, 58, 97, 0.36), -3px -3px 0px rgba(0, 120, 191, 0.28)',
        'riso-ink': '4px 4px 0px #18181A',
        'riso-magenta': '4px 4px 0px #F53A61',
        'riso-cyan': '4px 4px 0px #0078BF',
      }
    },
  },
  plugins: [],
};
