'use client';

/**
 * Auflösungsrechner (Ratgeberseite /druckaufloesung-rechner): Bildbreite in Pixeln und Druckbreite in Zentimetern → dpi und
 * Bewertung. Dieselben Schwellen, dieselbe Rechnung und dieselben Texte wie die Qualitätsampel im Konfigurator
 * (lib/canvas/logoQualitaet.ts) – der Rechner kann also nie etwas anderes sagen als der Konfigurator.
 *
 * Rechnet ausschließlich im Browser; es wird nichts hochgeladen oder gespeichert.
 */
import { useState } from 'react';
import { berechneLogoDpi, logoQualitaetText, MIN_DPI, OK_DPI, stufeFuerDpi, type QualityLevel } from '@/lib/canvas/logoQualitaet';
import { zahl } from '@/lib/format';

const ZOLL_CM = 2.54;

const STUFEN: Record<QualityLevel, { name: string; klasse: string }> = {
  green: { name: 'Grün – optimal', klasse: 'bg-green-50 text-green-900 border-green-200' },
  yellow: { name: 'Gelb – akzeptabel', klasse: 'bg-amber-50 text-amber-900 border-amber-200' },
  red: { name: 'Rot – zu niedrig', klasse: 'bg-red-50 text-red-900 border-red-200' },
};

/** „2.000", „2000" oder „20,5" → Zahl; leer oder ungültig → NaN. */
function alsZahl(text: string): number {
  const t = text.trim().replace(/\./g, '').replace(',', '.');
  return t === '' ? Number.NaN : Number(t);
}

const FELD =
  'mt-2 w-full rounded-xl border border-brand/[0.15] bg-white px-4 py-3 text-[17px] tabular-nums text-brand outline-none transition-colors focus:border-gold focus-visible:ring-2 focus-visible:ring-gold/40';

export function AufloesungsRechner() {
  const [pixel, setPixel] = useState('2000');
  const [breite, setBreite] = useState('20');

  const px = alsZahl(pixel);
  const cm = alsZahl(breite);
  const gueltig = Number.isFinite(px) && Number.isFinite(cm) && px > 0 && cm > 0;
  const dpi = gueltig ? berechneLogoDpi(px, cm) : 0;
  const stufe = gueltig ? stufeFuerDpi(dpi) : null;
  // So breit darf der Druck bei dieser Bildbreite höchstens sein, damit die Schwelle gerade noch erreicht wird.
  const maxOptimal = gueltig ? (px / OK_DPI) * ZOLL_CM : 0;
  const maxAkzeptabel = gueltig ? (px / MIN_DPI) * ZOLL_CM : 0;

  return (
    <div className="mt-8 rounded-[24px] border border-brand/[0.08] bg-white p-6 sm:p-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="rechner-pixel" className="text-[15px] font-medium text-brand">
            Breite Ihres Bildes in Pixeln
          </label>
          <input
            id="rechner-pixel"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={pixel}
            onChange={(e) => setPixel(e.target.value)}
            className={FELD}
            aria-describedby="rechner-pixel-hinweis"
          />
          <p id="rechner-pixel-hinweis" className="mt-2 text-[13px] text-brand/70">
            In den Dateieigenschaften Ihres Bildes oder in einem Bildprogramm zu finden.
          </p>
        </div>
        <div>
          <label htmlFor="rechner-breite" className="text-[15px] font-medium text-brand">
            Gewünschte Druckbreite in Zentimetern
          </label>
          <input
            id="rechner-breite"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={breite}
            onChange={(e) => setBreite(e.target.value)}
            className={FELD}
            aria-describedby="rechner-breite-hinweis"
          />
          <p id="rechner-breite-hinweis" className="mt-2 text-[13px] text-brand/70">
            Die Breite, in der das Motiv später auf dem Textil stehen soll.
          </p>
        </div>
      </div>

      <div role="status" aria-live="polite" className="mt-8">
        {stufe ? (
          <div className={`rounded-2xl border p-5 sm:p-6 ${STUFEN[stufe].klasse}`}>
            <p className="font-serif text-[28px] leading-tight tabular-nums">≈ {zahl(Math.round(dpi), 0)} dpi</p>
            <p className="mt-1 text-[15px] font-semibold">{STUFEN[stufe].name}</p>
            <p className="mt-3 text-[15px] leading-relaxed">{logoQualitaetText(stufe, dpi)}</p>
            <p className="mt-3 text-[14px] leading-relaxed opacity-90">
              Bei {zahl(px, 0)} Pixeln Breite können Sie bis {zahl(maxOptimal)} cm optimal (ab {OK_DPI} dpi) und bis{' '}
              {zahl(maxAkzeptabel)} cm noch akzeptabel (ab {MIN_DPI} dpi) drucken.
            </p>
          </div>
        ) : (
          <p className="rounded-2xl border border-brand/[0.1] bg-brand-light p-5 text-[15px] text-brand/70">
            Bitte geben Sie beide Werte als Zahl größer als 0 ein.
          </p>
        )}
      </div>
    </div>
  );
}
