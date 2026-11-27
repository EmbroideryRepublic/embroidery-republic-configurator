'use client';

/**
 * Hintergrund-Freistellung im Browser: lädt das Bild in ein Canvas, übergibt die Pixel an die reine Rechenfunktion (freistellen.ts – dort stehen
 * Verfahren, Begründung und Grenzen) und liefert das Ergebnis als PNG mit Transparenz.
 *
 * Fassung vom 2026-11-27 (Betreiberwunsch: die bisherige Freistellung arbeitete „sehr schlecht“). Der Aufruf blieb gleich; neu ist, dass bei nicht
 * einfarbigem Hintergrund (Foto, Muster) `HintergrundNichtEinfarbig` geworfen wird, statt das Motiv zu zerstören.
 */

import { loadImage } from '@/lib/browser/loadImage';
import { freistelle, HintergrundNichtEinfarbig } from './freistellen';

export { HintergrundNichtEinfarbig };

/** Größere Bilder werden für die Rechnung auf diese Pixelzahl verkleinert (Speicher und Zeit im Browser); alles darunter bleibt in Originalgröße. */
const MAX_PIXEL = 12_000_000;

/**
 * `hochskaliertFaktor`: War das Bild vorher im Konfigurator hochgerechnet (lib/upload/hochskalieren.ts), sind die Kantenverläufe um diesen Faktor
 * breiter; der Kantenstreifen wächst mit.
 * `innenflaechen`: 'auto' entfernt eingeschlossene Flächen in Hintergrundfarbe nur bei kleinen Formen (Buchstaben), 'alle' jede (siehe freistellen.ts).
 */
export async function removeSimpleBackground(
  dataUrl: string,
  hochskaliertFaktor = 1,
  innenflaechen: 'auto' | 'alle' = 'auto'
): Promise<string> {
  const img = await loadImage(dataUrl);
  const fullW = img.naturalWidth || img.width;
  const fullH = img.naturalHeight || img.height;
  const skala = Math.min(1, Math.sqrt(MAX_PIXEL / Math.max(1, fullW * fullH)));
  const w = Math.max(1, Math.round(fullW * skala));
  const h = Math.max(1, Math.round(fullH * skala));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, w, h);
  const eingabe = ctx.getImageData(0, 0, w, h);

  const { rgba, schonFrei } = freistelle(eingabe.data, w, h, { hochskaliertFaktor, innenflaechen });
  if (schonFrei) return dataUrl;

  const ausgabe = ctx.createImageData(w, h);
  ausgabe.data.set(rgba);
  ctx.putImageData(ausgabe, 0, 0);
  return canvas.toDataURL('image/png');
}
