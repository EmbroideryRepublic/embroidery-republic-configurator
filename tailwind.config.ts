import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Designsystem 2026-11 (docs/redesign/DESIGN-VORSCHLAG.md): warmes Off-White, kräftiges Schwarz, Orange als einziger
        // Akzent. Die Token-NAMEN blieben bewusst erhalten (brand, gold, cream, sand): Sie sind an über 1.500 Stellen
        // im Einsatz, und ihre Rollen sind festgelegt – nur die Werte wurden getauscht, damit der ganze Shop in einem
        // Schritt einheitlich umgefärbt ist.
        //
        // Rollen und Kontrast (WCAG-Formel, gegen Papier #FAF7F2 bzw. Weiß gerechnet):
        //  - brand        Schrift und dunkle Flächen, 17,5:1. Nebentext mit /70 erreicht rund 7:1; darunter (/30…/60)
        //                 weiterhin NICHT für Fließtext oder Beschriftungen verwenden.
        //  - gold         Orange #E8590C nur für große Flächen und Grafiken (Unterstreichungen, Abzeichen, Symbole ab
        //                 24 px): 3,35:1 – genügt für Grafik (≥ 3:1), NICHT für kleinen Text.
        //  - gold-dark    Orange #B93A0A für kleinen Text und Links: 5,35:1.
        //  - gold-btn     Orange #C2410C als Knopfhintergrund mit weißer Schrift: 5,18:1 (Hover: gold-dark).
        //                 (bg-gold mit text-white läge bei 3,6:1 und scheitert – dafür gold-btn/gold-dark nehmen.)
        brand: {
          DEFAULT: '#141210', // kräftiges, warmes Schwarz für Text und dunkle Flächen
          light: '#faf7f2',   // Papier: Seitenhintergrund
          accent: '#c2410c',  // Orange für Knöpfe/aktive Elemente
        },
        gold: {
          DEFAULT: '#e8590c',
          dark: '#b93a0a',
          light: '#fde6d6',
          btn: '#c2410c',
        },
        bronze: {
          DEFAULT: '#b93a0a',
          dark: '#8f2d08',
        },
        cream: {
          DEFAULT: '#faf7f2', // Papier (Seitenhintergrund)
          dark: '#f0ebe3',    // Sand: Hero, Bänder, ruhige Flächen
        },
        sand: {
          DEFAULT: '#eae3d8',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        // „serif“ ist die Überschriftenschrift. Der Name blieb, weil 80 Stellen ihn nutzen; seit dem Redesign ist es
        // dieselbe Familie wie der Fließtext (Inter) in kräftigem Schnitt – siehe `.font-serif` in globals.css.
        serif: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        // Ruhige, fast flache Karten (statt des früheren warmen Goldschattens).
        elegant: '0 1px 2px rgba(20, 18, 16, 0.04), 0 10px 28px -14px rgba(20, 18, 16, 0.16)',
      },
    },
  },
  plugins: [],
};

export default config;
