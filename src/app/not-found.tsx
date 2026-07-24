/**
 * Eigene 404-Seite.
 *
 * Vorher zeigte Next seine schwarz-weiße Standardseite: markenfremd und eine
 * Sackgasse – kein Weg zurück in den Shop. Der Fall tritt real auf, denn
 * `notFound()` wird von der Produktseite bei unbekanntem Slug aufgerufen
 * (alte Links, Tippfehler, ausgelistete Artikel).
 *
 * Statt einer Entschuldigung bietet sie die drei Wege an, die hier
 * weiterhelfen: stöbern, gestalten, fragen.
 */
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Seite nicht gefunden',
  // Eine 404 gehört nicht in den Index – der Statuscode allein genügt manchen
  // Crawlern nicht, wenn sie die Seite über einen alten Link erreichen.
  robots: { index: false, follow: true },
};

const WEGE = [
  { href: '/produkt', titel: 'Sortiment ansehen', text: 'Alle Textilien mit Filtern nach Marke, Farbe und Größe.' },
  { href: '/konfigurator', titel: 'Selbst gestalten', text: 'Motiv platzieren und den Preis sofort sehen.' },
  { href: '/kontakt', titel: 'Uns fragen', text: 'Wir suchen das passende Produkt gemeinsam heraus.' },
];

export default function NichtGefunden() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col px-4 py-20">
      <p className="text-[11px] uppercase tracking-[0.3em] text-gold">Fehler 404</p>
      <h1 className="mt-5 font-serif text-[clamp(2.25rem,5vw,3.5rem)] font-normal leading-tight tracking-tight text-brand">
        Diese Seite gibt es nicht.
      </h1>
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-brand/60">
        Vielleicht wurde der Artikel ausgelistet oder die Adresse hat sich geändert.
        Hier geht es weiter:
      </p>

      <ul className="mt-10 space-y-3">
        {WEGE.map((w) => (
          <li key={w.href}>
            <Link
              href={w.href}
              className="group flex items-center justify-between gap-4 rounded-xl border border-gold/20 bg-white px-5 py-4 shadow-elegant transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-gold/40"
            >
              <span>
                <span className="block text-[15px] font-medium text-brand">{w.titel}</span>
                <span className="mt-0.5 block text-[13px] text-brand/55">{w.text}</span>
              </span>
              <ArrowRight
                className="h-4 w-4 flex-shrink-0 text-gold-dark transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
