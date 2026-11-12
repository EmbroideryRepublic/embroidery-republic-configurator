'use client';

/**
 * Feste Bestellleiste am unteren Bildschirmrand der Produktseite – nur am Handy (unter md).
 *
 * Warum: Am Handy steht „Jetzt konfigurieren" erst unter Foto, Ansichtsknöpfen, Farbwahl, Titel und
 * Beschreibung – gemessen bei rund 1.280 px, also erst nach gut anderthalb Bildschirmen. Wer das Teil
 * mag, muss den Knopf suchen. Die Leiste zeigt Ab-Preis und Knopf von Anfang an und verschwindet, solange
 * die große Bestellkarte selbst im Bild ist (kein doppelter Knopf) und über der Fußzeile.
 *
 * Der Link trägt die gewählte Farbe weiter, genau wie `KonfiguratorCta` (ProduktFarbeContext).
 */
import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useProduktFarbe } from './ProduktFarbeContext';

export function ProduktKaufleiste({
  produktId,
  kartenId,
  children,
}: {
  produktId: string;
  /** id der großen Bestellkarte: Solange sie sichtbar ist, bleibt die Leiste weg. */
  kartenId: string;
  /** Der Ab-Preis (kommt als fertiges Element vom Server, damit die Währungsanzeige dieselbe bleibt). */
  children: ReactNode;
}) {
  const { farbeId } = useProduktFarbe();
  const [gemessen, setGemessen] = useState(false);
  const [kartenImBild, setKartenImBild] = useState(true);
  const [fussImBild, setFussImBild] = useState(false);

  useEffect(() => {
    const karte = document.getElementById(kartenId);
    const fuss = document.querySelector('footer');
    // Ohne IntersectionObserver (sehr alte Browser) bleibt die Leiste einfach weg – nichts geht verloren,
    // die Bestellkarte ist weiterhin da.
    if (!karte || typeof IntersectionObserver === 'undefined') return;
    const beobachterKarte = new IntersectionObserver(([e]) => {
      if (!e) return;
      setKartenImBild(e.isIntersecting);
      setGemessen(true);
    });
    beobachterKarte.observe(karte);
    const beobachterFuss = fuss
      ? new IntersectionObserver(([e]) => {
          if (e) setFussImBild(e.isIntersecting);
        })
      : null;
    if (fuss) beobachterFuss?.observe(fuss);
    return () => {
      beobachterKarte.disconnect();
      beobachterFuss?.disconnect();
    };
  }, [kartenId]);

  if (!gemessen || kartenImBild || fussImBild) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 flex animate-fade-in items-center justify-between gap-4 border-t border-gold/25 bg-white/95 px-4 pt-3 backdrop-blur md:hidden"
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      <p className="min-w-0 leading-tight">
        <span className="block text-[11px] text-brand/70">Ab</span>
        <span className="font-serif text-xl text-brand">{children}</span>
      </p>
      <Link
        href={`/konfigurator?produkt=${produktId}&farbe=${farbeId}`}
        className="inline-flex min-h-[44px] flex-shrink-0 items-center rounded-full bg-brand px-6 text-sm font-medium text-white transition-all duration-300 ease-out hover:bg-brand/90 active:scale-[0.98]"
      >
        Jetzt konfigurieren
      </Link>
    </div>
  );
}
