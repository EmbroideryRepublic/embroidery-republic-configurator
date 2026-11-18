// ESLint 9 (flache Konfiguration). Ersetzt .eslintrc.json (`extends: next/core-web-vitals`)
// beim Upgrade auf Next.js 16: `eslint-config-next@16` unterstützt nur noch ESLint >= 9.
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

export default defineConfig([
  ...nextVitals,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),

  // Die bisherige Regelmenge bleibt bewusst unverändert (Upgrade ≠ Stilumbau):
  // ESLint 8 meldete ungenutzte Disable-Kommentare nie, ESLint 9 meldet sie als Warnung.
  { linterOptions: { reportUnusedDisableDirectives: 'off' } },

  {
    // eslint-plugin-react-hooks 7 (in eslint-config-next 16 enthalten) bringt
    // React-Compiler-Hinweisregeln mit, die es in der alten Konfiguration nicht gab
    // (nur rules-of-hooks + exhaustive-deps). Sie bemängeln Muster in Konfigurator-
    // und Admin-Code (setState in Effekten, Date.now() im Render, Refs im Render),
    // die funktionieren und nicht Teil dieses Sicherheits-Upgrades sind. Aus, bis der
    // Code gezielt dafür überarbeitet wird (z. B. bei einer Umstellung auf den
    // React Compiler). rules-of-hooks und exhaustive-deps bleiben unverändert aktiv.
    rules: {
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/refs': 'off',
    },
  },

  {
    // global-error.tsx ersetzt das gesamte Root-Layout (eigenes <html>), dort ist
    // kein Router-Kontext garantiert – ein einfacher <a>-Link ist Absicht, <Link> nicht.
    files: ['src/app/global-error.tsx'],
    rules: { '@next/next/no-html-link-for-pages': 'off' },
  },
]);
