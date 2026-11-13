'use client';

/**
 * Browser-Anbindung des Hochskalierens (Rechnung: lib/upload/hochskalieren.ts): Data-URL → Canvas → Pixel → Rechnung → PNG-Data-URL.
 *
 * Wendet das Verfahren auf BEIDE Dateien eines Logos an – die angezeigte (ggf. freigestellte) und die Original-Version –, damit
 * das spätere Umschalten der Freistellung nicht auf die kleine Datei zurückfällt. Alles läuft im Browser; es wird nichts hochgeladen.
 *
 * Größenwächter: Die Bestellung geht als EIN Aufruf an den Server (Grenze 15 MB, next.config.js), und das Logo reist doppelt mit
 * (Original + Anzeige). Wird das Ergebnis zu groß (ein Foto mit Rauschen ergibt große PNG-Dateien), geht es mit dem nächstkleineren
 * Faktor erneut; reicht auch Faktor 2 nicht, gibt es `HochskalierenZuGross` (verständliche Meldung) statt einer später abgelehnten Bestellung.
 */
import { loadImage } from '@/lib/browser/loadImage';
import { hochskaliereRgba, MIN_FAKTOR } from '@/lib/upload/hochskalieren';
import type { LogoElement } from '@/types';

/** Höchstgröße beider Dateien zusammen (Bytes; Base64 in der Bestellung ≈ +33 %). Die Bestellung insgesamt darf 15 MB nicht überschreiten. */
export const MAX_ERGEBNIS_BYTES = 5 * 1024 * 1024;

const pause = () => new Promise<void>((r) => setTimeout(r, 0));

/** Ungefähre Größe der dekodierten Datei hinter einer Base64-Data-URL. */
function bytesVon(dataUrl: string): number {
  const i = dataUrl.indexOf(',');
  return Math.floor(((dataUrl.length - i - 1) * 3) / 4);
}

export async function hochskaliereDataUrl(dataUrl: string, faktor: number): Promise<{ dataUrl: string; breite: number; hoehe: number }> {
  const img = await loadImage(dataUrl);
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const quelle = document.createElement('canvas');
  quelle.width = w;
  quelle.height = h;
  const ctx = quelle.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Das Bild konnte nicht verarbeitet werden.');
  ctx.drawImage(img, 0, 0);
  const pixel = ctx.getImageData(0, 0, w, h);
  const ergebnis = await hochskaliereRgba({ daten: pixel.data, breite: w, hoehe: h }, faktor, { pause });
  const ziel = document.createElement('canvas');
  ziel.width = ergebnis.breite;
  ziel.height = ergebnis.hoehe;
  const zctx = ziel.getContext('2d');
  if (!zctx) throw new Error('Das Bild konnte nicht verarbeitet werden.');
  const bild = zctx.createImageData(ergebnis.breite, ergebnis.hoehe);
  bild.data.set(ergebnis.daten);
  zctx.putImageData(bild, 0, 0);
  return { dataUrl: ziel.toDataURL('image/png'), breite: ergebnis.breite, hoehe: ergebnis.hoehe };
}

export interface LogoAenderung {
  fileUrl: string;
  originalFileUrl: string;
  originalWidthPx: number;
  originalHeightPx: number;
  hochskaliertFaktor: number;
  urspruenglicheBreitePx: number;
}

/** Vorheriger Stand je Logo für „Original wiederherstellen“ – bewusst NICHT im Element (wäre sonst Teil von Warenkorb und Bestellung). */
const VORHER = new Map<string, Pick<LogoElement, 'fileUrl' | 'originalFileUrl' | 'originalWidthPx' | 'originalHeightPx' | 'backgroundRemoved'>>();
export const merkeVorHochskalierung = (logo: LogoElement) =>
  VORHER.set(logo.id, {
    fileUrl: logo.fileUrl,
    originalFileUrl: logo.originalFileUrl,
    originalWidthPx: logo.originalWidthPx,
    originalHeightPx: logo.originalHeightPx,
    backgroundRemoved: logo.backgroundRemoved,
  });
export const vorHochskalierung = (id: string) => VORHER.get(id);
export const vergissVorHochskalierung = (id: string) => VORHER.delete(id);

/**
 * Hochskaliert beide Dateien eines Logos. Gibt die Änderungen für das Element zurück; das Element selbst wird hier nicht angefasst.
 * Wirft eine Fehlermeldung für die Oberfläche, wenn auch der kleinste Faktor ein zu großes Ergebnis ergäbe.
 */
export async function hochskaliereLogo(logo: LogoElement, faktor: number): Promise<LogoAenderung> {
  for (let f = faktor; f >= MIN_FAKTOR; f--) {
    const anzeige = await hochskaliereDataUrl(logo.fileUrl, f);
    // Ohne Freistellung sind Anzeige- und Originaldatei dieselbe Datei: nur einmal rechnen.
    const original = logo.originalFileUrl === logo.fileUrl ? anzeige : await hochskaliereDataUrl(logo.originalFileUrl, f);
    const bytes = bytesVon(anzeige.dataUrl) + (original === anzeige ? bytesVon(anzeige.dataUrl) : bytesVon(original.dataUrl));
    if (bytes <= MAX_ERGEBNIS_BYTES) {
      return {
        fileUrl: anzeige.dataUrl,
        originalFileUrl: original.dataUrl,
        originalWidthPx: original.breite,
        originalHeightPx: original.hoehe,
        hochskaliertFaktor: f,
        urspruenglicheBreitePx: logo.urspruenglicheBreitePx ?? logo.originalWidthPx,
      };
    }
  }
  throw new HochskalierenZuGross();
}

/** Auch mit dem kleinsten Faktor wäre das Ergebnis für die Bestellung zu groß (typisch: verrauschtes Foto). Die Oberfläche übersetzt. */
export class HochskalierenZuGross extends Error {
  constructor() {
    super('Das hochskalierte Bild wäre zu groß für die Bestellung.');
    this.name = 'HochskalierenZuGross';
  }
}
