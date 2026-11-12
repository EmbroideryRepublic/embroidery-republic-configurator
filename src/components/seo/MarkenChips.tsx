/**
 * Reihe mit Links zu den Marken-Landingpages (config/seo/dtfSeiten.ts).
 *
 * Gedacht für Startseite und Kategorieseiten: Die Marken-Seiten sollen von den am
 * stärksten verlinkten Seiten aus erreichbar sein, sonst findet Google sie spät
 * (Search Console 2026-11-12: 139 von 166 Seiten „gefunden, aber nicht indexiert“).
 */
import Link from 'next/link';
import { alleMarkenSeiten } from '@/lib/seo/dtfAdresse';

export function MarkenChips({ ueberschrift, className }: { ueberschrift: string; className?: string }) {
  const marken = alleMarkenSeiten();
  if (marken.length === 0) return null;
  return (
    <nav aria-label={ueberschrift} className={className}>
      <p className="text-[11px] uppercase tracking-[0.3em] text-gold-dark">{ueberschrift}</p>
      <ul className="mt-4 flex flex-wrap gap-3">
        {marken.map((s) => (
          <li key={s.slug}>
            <Link
              href={`/${s.slug}`}
              className="inline-flex min-h-[44px] items-center rounded-full border border-brand/[0.12] bg-white/70 px-5 text-[14px] text-brand/80 transition-all duration-300 ease-out hover:border-gold/40 hover:bg-white hover:text-brand"
            >
              {s.marke}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
