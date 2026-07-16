import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Markenpalette: warme Beige-/Creme-Grundfarben, Gold/Bronze als
        // Akzent – orientiert am Firmenlogo (Tiger-Wappen in Gold/Bronze
        // auf Creme).
        brand: {
          DEFAULT: '#2b241c', // warmes Anthrazit-Braun für Text (kein reines Schwarz)
          light: '#faf7f1',   // Creme-Hintergrund
          accent: '#a8792f',  // Gold-Akzent für Buttons/aktive Elemente
        },
        gold: {
          DEFAULT: '#b8935a',
          dark: '#8a6a3a',
          light: '#f3e6cc',
        },
        bronze: {
          DEFAULT: '#8b5e34',
          dark: '#6b4526',
        },
        cream: {
          DEFAULT: '#f7f1e6',
          dark: '#ece0c9',
        },
        sand: {
          DEFAULT: '#e8ddc8',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
      boxShadow: {
        elegant: '0 4px 24px -4px rgba(139, 94, 52, 0.15)',
      },
    },
  },
  plugins: [],
};

export default config;
