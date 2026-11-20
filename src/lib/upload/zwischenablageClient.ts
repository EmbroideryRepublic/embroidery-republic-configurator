/**
 * Zwischenablage für große Logo-Dateien – die Browserseite.
 *
 * Warum und wie: config/upload.ts. Vor dem Absenden einer Bestellung oder Anfrage werden alle Logo-Data-URLs, die größer als
 * DIREKT_MAX_ZEICHEN sind, in Teilen zu je höchstens 3 MB an `POST /api/upload/teil` geschickt. Die Bestellung trägt danach nur noch einen
 * kurzen Verweis (`staged:…`) statt der Datei. Der Warenkorb im Browser bleibt unverändert; nur die Kopie für den Aufruf wird ersetzt.
 */
import type { CartItem, ConfigElement } from '@/types';
import { DIREKT_MAX_ZEICHEN, MAX_TEILE, TEIL_MAX_BYTES } from '@/config/upload';
import { baueRef, tagVon } from './zwischenablageRef';

/** Wie viele Teile gleichzeitig unterwegs sind. Drei nutzen eine Mobilfunkverbindung aus, ohne sie zu verstopfen. */
const GLEICHZEITIG = 3;
const WIEDERHOLUNGEN = 3;

export class UebertragungFehler extends Error {
  constructor(nachricht = 'Die Datei konnte nicht übertragen werden. Bitte prüfen Sie Ihre Verbindung und versuchen Sie es erneut.') {
    super(nachricht);
    this.name = 'UebertragungFehler';
  }
}

/** Zerlegt eine Data-URL in Base64-Teil und Bytegröße (ohne zu dekodieren). `null`, wenn es keine Base64-Data-URL ist. */
export function zerlegeDataUrl(dataUrl: string): { base64Start: number; bytes: number } | null {
  const treffer = /^data:[^;,]+;base64,/.exec(dataUrl);
  if (!treffer) return null;
  const start = treffer[0].length;
  const laenge = dataUrl.length - start;
  if (laenge === 0) return null;
  const fuell = dataUrl.endsWith('==') ? 2 : dataUrl.endsWith('=') ? 1 : 0;
  return { base64Start: start, bytes: Math.floor((laenge * 3) / 4) - fuell };
}

/** Bytes des Teils `nr` einer Data-URL. Jeder Teil ist ein glatter Ausschnitt des Base64-Texts (TEIL_MAX_BYTES ist durch 3 teilbar). */
export function teilVonDataUrl(dataUrl: string, base64Start: number, nr: number): Uint8Array {
  const zeichenJeTeil = (TEIL_MAX_BYTES / 3) * 4;
  const von = base64Start + nr * zeichenJeTeil;
  const roh = atob(dataUrl.slice(von, von + zeichenJeTeil));
  const bytes = new Uint8Array(roh.length);
  for (let i = 0; i < roh.length; i++) bytes[i] = roh.charCodeAt(i);
  return bytes;
}

async function sendeTeil(tag: string, ticket: string, nr: number, daten: Uint8Array): Promise<void> {
  let letzterFehler: unknown;
  for (let versuch = 0; versuch < WIEDERHOLUNGEN; versuch++) {
    try {
      const antwort = await fetch('/api/upload/teil', {
        method: 'POST',
        headers: { 'content-type': 'application/octet-stream', 'x-tag': tag, 'x-ticket': ticket, 'x-nr': String(nr) },
        body: daten as unknown as BodyInit,
      });
      if (antwort.ok) return;
      // Eine klare Ablehnung (400/413/429) wird durch Wiederholen nicht besser.
      if (antwort.status >= 400 && antwort.status < 500) throw new UebertragungFehler();
      letzterFehler = new UebertragungFehler();
    } catch (fehler) {
      if (fehler instanceof UebertragungFehler) throw fehler;
      letzterFehler = fehler;
    }
    await new Promise((weiter) => setTimeout(weiter, 600 * (versuch + 1)));
  }
  console.warn('[upload] Teil nicht übertragen:', letzterFehler);
  throw new UebertragungFehler();
}

/** Lädt EINE Data-URL in Teilen hoch und gibt den Verweis zurück. */
export async function ladeDataUrlHoch(dataUrl: string): Promise<string> {
  const teile = zerlegeDataUrl(dataUrl);
  if (!teile) throw new UebertragungFehler('Diese Datei konnte nicht gelesen werden. Bitte laden Sie sie erneut hoch.');
  const anzahl = Math.ceil(teile.bytes / TEIL_MAX_BYTES);
  if (anzahl > MAX_TEILE) throw new UebertragungFehler('Das Bild ist nach der Aufbereitung zu groß. Bitte verwenden Sie eine Datei mit geringerer Auflösung.');

  const tag = tagVon();
  const ticket = crypto.randomUUID();
  let naechster = 0;
  const arbeiter = Array.from({ length: Math.min(GLEICHZEITIG, anzahl) }, async () => {
    for (;;) {
      const nr = naechster++;
      if (nr >= anzahl) return;
      await sendeTeil(tag, ticket, nr, teilVonDataUrl(dataUrl, teile.base64Start, nr));
    }
  });
  await Promise.all(arbeiter);
  return baueRef({ tag, ticket, teile: anzahl, bytes: teile.bytes });
}

/**
 * Ersetzt in einer KOPIE der Positionen alle großen Logo-Data-URLs durch Verweise. Kleine Dateien bleiben unverändert. Dieselbe Data-URL
 * (Original und Anzeigebild sind oft identisch) wird nur einmal hochgeladen. Der Warenkorb selbst wird nicht verändert.
 */
export async function uebertrageGrosseLogos(items: CartItem[], hochladen: (dataUrl: string) => Promise<string> = ladeDataUrlHoch): Promise<CartItem[]> {
  const bereits = new Map<string, Promise<string>>();
  const verweis = (url: string): Promise<string> => {
    let p = bereits.get(url);
    if (!p) {
      p = hochladen(url);
      bereits.set(url, p);
    }
    return p;
  };

  const ergebnis: CartItem[] = [];
  for (const item of items) {
    const elemente: ConfigElement[] = [];
    for (const element of item.elements) {
      if (element.type !== 'logo') {
        elemente.push(element);
        continue;
      }
      const gross = (url: string) => typeof url === 'string' && url.startsWith('data:') && url.length > DIREKT_MAX_ZEICHEN;
      if (!gross(element.fileUrl) && !gross(element.originalFileUrl)) {
        elemente.push(element);
        continue;
      }
      // Nacheinander je Element: so sind höchstens GLEICHZEITIG Teile unterwegs und der Speicher des Browsers bleibt klein.
      const original = gross(element.originalFileUrl) ? await verweis(element.originalFileUrl) : element.originalFileUrl;
      const anzeige = gross(element.fileUrl) ? await verweis(element.fileUrl) : element.fileUrl;
      elemente.push({ ...element, originalFileUrl: original, fileUrl: anzeige });
    }
    ergebnis.push({ ...item, elements: elemente });
  }
  return ergebnis;
}
