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
        // Kontrast (WCAG 1.4.3, per WCAG-Formel gegen cream/white geprüft; Stand 2026-11-10: alle
        // text-brand/30…/60 sind auf /70 angehoben, kleine Goldtexte nutzen gold-dark):
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
          DEFAULT: '#aa864e', // war #b8935a (2,7:1) – jetzt 3,0–3,4:1 für große Schrift
          dark: '#7d6035', // war #8a6a3a (4,4–4,7:1) – jetzt 5,2–5,8:1 für kleinen Text
          light: '#f3e6cc',
          btn: '#8a6a3a', // Knopfhintergrund für weiße Schrift (5,0:1); hover: gold-dark
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
