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
        //
        // Kontrast (WCAG 1.4.3, per WCAG-Formel gegen cream/white geprüft):
        // text-brand ab Opacity 70 erreicht 4.5:1 (5.53–5.71:1), darunter
        // (30–60) nicht – auch eine dunklere DEFAULT-Farbe kann das bei so
        // niedriger Deckkraft rechnerisch nicht auffangen, ohne fast Schwarz
        // zu werden (erst ab ca. 65% der jetzigen Helligkeit läge /60 knapp
        // über 4.5:1 – zu große, ungeprüfte Farbänderung für alle rund 266
        // Fundstellen auf einmal). Für Fließtext/Labels daher mindestens
        // text-brand/70 verwenden, nicht niedriger. bg-gold mit text-white
        // liegt bei 2.85:1 (fehlschlägt); bg-gold-dark mit text-white bei
        // 5.00:1 (besteht) – für Buttons/Badges mit weißer Schrift
        // gold-dark statt gold als Hintergrund verwenden.
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
