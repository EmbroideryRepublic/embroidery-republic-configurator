/**
 * Kundenstimmen und Referenzen – erscheinen NUR, wenn echte Daten vorliegen.
 *
 * Rendert bewusst `null`, solange `config/referenzen.ts` leer ist: kein leerer
 * „Was Kunden sagen"-Block, keine Platzhalter. Sobald echte, freigegebene
 * Einträge existieren, erscheint der Abschnitt automatisch im Stil der übrigen
 * Startseite (Serif, warme Palette, viel Weißraum).
 */
import { Star } from 'lucide-react';
import { KUNDENSTIMMEN, REFERENZEN } from '@/config/referenzen';

export function Kundenstimmen() {
  if (KUNDENSTIMMEN.length === 0 && REFERENZEN.length === 0) return null;

  return (
    <section className="border-y border-brand/[0.08] bg-white/50">
      <div className="mx-auto max-w-[1500px] px-4 py-24 sm:px-8">
        <p className="text-[11px] uppercase tracking-[0.3em] text-gold">Vertrauen</p>
        <h2 className="mt-6 max-w-2xl font-serif text-[clamp(2rem,3.6vw,3.25rem)] font-normal leading-[1.05] tracking-[-0.02em] text-brand">
          Was unsere Kundschaft sagt.
        </h2>

        {KUNDENSTIMMEN.length > 0 && (
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {KUNDENSTIMMEN.map((s) => (
              <figure
                key={`${s.autor}-${s.text.slice(0, 24)}`}
                className="rounded-[24px] border border-brand/[0.08] bg-white p-8"
              >
                {typeof s.bewertung === 'number' && (
                  <div className="mb-4 flex gap-0.5" aria-label={`${s.bewertung} von 5 Sternen`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={i < s.bewertung! ? 'h-4 w-4 fill-gold text-gold' : 'h-4 w-4 text-brand/15'}
                        aria-hidden
                      />
                    ))}
                  </div>
                )}
                <blockquote className="font-serif text-[19px] leading-relaxed text-brand">
                  {`„${s.text}"`}
                </blockquote>
                <figcaption className="mt-5 text-[13px] text-brand/50">
                  <span className="font-medium text-brand/70">{s.autor}</span>
                  {s.rolle ? ` · ${s.rolle}` : ''}
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        {REFERENZEN.length > 0 && (
          <ul className="mt-16 flex flex-wrap items-center gap-x-12 gap-y-6">
            {REFERENZEN.map((r) => (
              <li key={r.name} className="text-[15px] font-medium tracking-wide text-brand/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {r.logo ? <img src={r.logo} alt={r.name} className="h-8 w-auto opacity-70" /> : r.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
