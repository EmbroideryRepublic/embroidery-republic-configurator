/**
 * Reihe mit Links zu den Anlass- und Ratgeberseiten (config/seo/anlassSeiten.ts).
 *
 * Gedacht für die Startseite: Die Seiten sollen von der am stärksten verlinkten Seite aus erreichbar sein, sonst findet
 * Google sie spät (Search Console 2026-11-12: 139 von 166 Seiten „gefunden, aber nicht indexiert“). Gegenstück zu MarkenChips.
 */
import Link from 'next/link';
import { ANLASS_SEITEN } from '@/config/seo/anlassSeiten';

export function AnlassChips({ ueberschrift, className }: { ueberschrift: string; className?: string }) {
  return (
    <nav aria-label={ueberschrift} className={className}>
      <p className="text-[11px] uppercase tracking-[0.3em] text-gold-dark">{ueberschrift}</p>
      <ul className="mt-4 flex flex-wrap gap-3">
        {ANLASS_SEITEN.map((s) => (
          <li key={s.slug}>
            <Link
              href={`/${s.slug}`}
              className="inline-flex min-h-[44px] items-center rounded-full border border-brand/[0.12] bg-white/70 px-5 text-[14px] text-brand/80 transition-all duration-300 ease-out hover:border-gold/40 hover:bg-white hover:text-brand"
            >
              {s.kurzname}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
