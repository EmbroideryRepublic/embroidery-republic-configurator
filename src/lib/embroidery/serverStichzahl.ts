/**
 * ══════════════════════════════════════════════════════════════════════
 * VERTRAUENSWÜRDIGE STICHZAHL – serverseitig aus den Motivdaten bestimmt
 * ══════════════════════════════════════════════════════════════════════
 *
 * ── Warum ─────────────────────────────────────────────────────────────
 * Der Stichaufpreis (1,20 € je 1.000 Stiche) ist seit 2026-09-03 der
 * einzige Preisunterschied zwischen Stickerei und DTF. Die Stichzahl kam
 * bis dahin allein aus dem Browser (`estimatedStitches`) – und der Server
 * rechnete mit ihr. Ein manipulierter Request konnte ein großes Motiv mit
 * einer Mini-Stichzahl einreichen und den Aufpreis nahezu abschalten; die
 * Untergrenzen in orderValidation.ts (500/150) fangen nur Unsinn ab, keine
 * „plausibel kleine" Lüge.
 *
 * ── Was hier passiert ─────────────────────────────────────────────────
 * Der Server schätzt die Stichzahl SELBST – mit demselben Rechenkern wie
 * der Browser (stichschaetzung.ts), aber aus Daten, die er selbst in der
 * Hand hat:
 *   - Logo: aus dem übermittelten Display-PNG (dieselbe Datei, die auch
 *     gespeichert und für das Produktionsblatt gerendert wird). Die Pixel
 *     liefert resvg – dieselbe Bibliothek, die das Produktionsblatt rendert.
 *   - Text: aus einem serverseitigen Rendering des Textes mit den
 *     gebündelten Ersatzschriften (fonts.ts), wie beim Produktionsblatt.
 *
 * ── Warum nicht einfach IMMER der Serverwert ──────────────────────────
 * Browser (Canvas-Skalierung) und Server (resvg-Skalierung) rastern minimal
 * unterschiedlich; bei Text kommen Ersatzschriften hinzu. Der Serverwert
 * weicht deshalb um wenige Prozent vom Browserwert ab. Würde der Server
 * stur seinen Wert nehmen, zahlte eine ehrliche Kundin Cent-Beträge mehr
 * oder weniger, als der Warenkorb zeigte. Deshalb:
 *
 *   vertraut = Clientwert, wenn er den Serverwert nicht um mehr als die
 *              Messtoleranz unterschreitet – sonst der Serverwert.
 *
 * Ein ehrlicher Browserwert liegt innerhalb der Toleranz → Anzeige und
 * Rechnung stimmen exakt überein. Ein manipulierter Wert unterhalb wird
 * durch den Serverwert ersetzt → kein Preisvorteil. Die Toleranz begrenzt
 * den maximal erreichbaren „Rabatt" durch Manipulation auf wenige Prozent
 * des Stichaufpreises; darunter kann niemand kommen.
 *
 * Kein Datenzugriff, keine Nebenwirkungen; das Ergebnis ist eine KOPIE der
 * Positionen mit ersetzter Stichzahl. Aufrufer: lib/actions/orders.ts –
 * Preisberechnung UND Speicherung arbeiten anschließend nur noch mit den
 * vertrauenswürdigen Werten.
 */
import { Resvg } from '@resvg/resvg-js';
import type { CartItem, ConfigElement, LogoElement, TextElement } from '@/types';
import { pruefeDataUrl } from '@/lib/upload/pruefeUpload';
import { getFontFiles, resolveFontFamily } from '@/lib/rendering/fonts';
import {
  dekodierMasse,
  schaetzeLogoStiche,
  schaetzeLogoSticheOhneBild,
  schaetzeTextStiche,
  type PixelDaten,
} from './stichschaetzung';

/**
 * Zulässige Unterschreitung des Serverwerts durch den Clientwert.
 *
 * Logo: Browser und Server dekodieren das PNG in Originalgröße und
 * verkleinern es mit demselben deterministischen Box-Filter
 * (stichschaetzung.ts) – gemessen 0,00 % Abweichung auf identischen
 * Dateien. Die 5 % sind ein Sicherheitsnetz für Bilder über MAX_NATIV_PX
 * (Plattform-Skalierung) und Rundung beim Entmultiplizieren; zugleich die
 * Obergrenze dessen, was ein manipulierter Wert höchstens „sparen" kann.
 * Text: Ersatzschriften (Arial → Arimo usw., Impact → Anton deutlich
 * anders), daher weiter gefasst.
 */
export const STICH_TOLERANZ = { logo: 0.05, text: 0.25 } as const;

/**
 * resvg liefert RGBA mit VORMULTIPLIZIERTEM Alpha (geprüft: Weiß bei 50 %
 * Deckkraft kommt als 128/128/128/128). Der Rechenkern erwartet – wie die
 * Browser-Canvas (getImageData) – gerade Farbwerte; sonst zählten
 * halbtransparente weiße Kanten als „Motiv" und der Serverwert läge bis zu
 * 12 % über dem des Browsers.
 */
function entmultipliziere(pixels: Buffer): Uint8ClampedArray {
  const out = new Uint8ClampedArray(pixels.length);
  for (let i = 0; i < pixels.length; i += 4) {
    const a = pixels[i + 3]!;
    if (a === 0) continue;
    out[i] = Math.round((pixels[i]! * 255) / a);
    out[i + 1] = Math.round((pixels[i + 1]! * 255) / a);
    out[i + 2] = Math.round((pixels[i + 2]! * 255) / a);
    out[i + 3] = a;
  }
  return out;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function istEndlicheZahl(wert: unknown): wert is number {
  return typeof wert === 'number' && Number.isFinite(wert);
}

/**
 * Stichzahl eines Logos aus seinem Display-PNG (Data-URL), wie sie der
 * Browser für dieselbe Datei ermittelt: PNG in Originalgröße dekodieren
 * (resvg), Alpha entmultiplizieren, dann der gemeinsame Rechenkern
 * (deterministische Verkleinerung + Füll-/Kantenanteil). Nicht lesbare
 * Daten → Rückfall auf die bildlose Schätzung (mittlere Füllung) – niemals
 * 0 oder ein Clientwert.
 */
export function schaetzeLogoSticheAusPng(dataUrl: string, widthCm: number, heightCm: number): number {
  const areaCm2 = widthCm * heightCm;
  if (!(areaCm2 > 0)) return 0;

  const pruefung = pruefeDataUrl(dataUrl);
  if (!pruefung.ok) return schaetzeLogoSticheOhneBild(areaCm2);

  try {
    const { width, height } = dekodierMasse(pruefung.breitePx, pruefung.hoehePx);
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
      `<image href="data:image/png;base64,${pruefung.bytes.toString('base64')}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="none"/>` +
      `</svg>`;
    const gerendert = new Resvg(svg, { fitTo: { mode: 'original' } }).render();
    const px: PixelDaten = { data: entmultipliziere(gerendert.pixels), width: gerendert.width, height: gerendert.height };
    return schaetzeLogoStiche(px, areaCm2);
  } catch {
    return schaetzeLogoSticheOhneBild(areaCm2);
  }
}

/**
 * Tintenanteil eines Textes, serverseitig gemessen – dasselbe Prinzip wie
 * measureInkCoverageRatio() im Browser: Text rendern, Glyphenpixel zählen,
 * durch die umgebende Box teilen. Die Box entspricht der Browser-Box
 * (Konva: Textbreite bzw. Schriftgröße, jeweils plus 0,15 × Schriftgröße
 * Abstand) näherungsweise über die gerenderte Glyphen-Bounding-Box.
 * Begrenzt auf 0,1–0,9 wie im Browser.
 */
export function messeTintenanteilServer(element: Pick<TextElement, 'content' | 'fontFamily' | 'fontSizePx' | 'bold' | 'italic' | 'letterSpacing'>): number {
  const FALLBACK_RATIO = 0.35;
  const inhalt = element.content ?? '';
  if (!inhalt.trim() || !(element.fontSizePx > 0)) return FALLBACK_RATIO;

  try {
    const fs = element.fontSizePx;
    const breite = Math.ceil(fs * 0.9 * inhalt.length + fs * 2);
    const hoehe = Math.ceil(fs * 2);
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${breite}" height="${hoehe}" viewBox="0 0 ${breite} ${hoehe}">` +
      `<text x="${fs}" y="${hoehe / 2}" dominant-baseline="central" font-family="${escapeXml(resolveFontFamily(element.fontFamily))}" ` +
      `font-size="${fs}" font-weight="${element.bold ? 700 : 400}" font-style="${element.italic ? 'italic' : 'normal'}" ` +
      `letter-spacing="${element.letterSpacing ?? 0}" fill="#000">${escapeXml(inhalt)}</text></svg>`;
    const gerendert = new Resvg(svg, {
      fitTo: { mode: 'original' },
      font: { fontFiles: getFontFiles(), loadSystemFonts: false, defaultFontFamily: 'Arimo' },
    }).render();

    const { pixels, width, height } = gerendert;
    let tinte = 0;
    let minX = width, maxX = -1;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if ((pixels[(y * width + x) * 4 + 3] ?? 0) > 40) {
          tinte++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        }
      }
    }
    if (tinte === 0 || maxX < minX) return FALLBACK_RATIO;
    const boxBreite = maxX - minX + 1 + fs * 0.25;
    const boxHoehe = fs + fs * 0.15;
    const ratio = tinte / (boxBreite * boxHoehe);
    return Math.min(0.9, Math.max(0.1, ratio));
  } catch {
    return FALLBACK_RATIO;
  }
}

/** Serverseitige Stichzahl eines Textelements. */
export function schaetzeTextSticheServer(element: TextElement): number {
  const areaCm2 = element.widthCm * element.heightCm;
  if (!(areaCm2 > 0)) return 0;
  return schaetzeTextStiche(areaCm2, messeTintenanteilServer(element));
}

/**
 * Preisrelevante Stichzahl eines Elements: der Clientwert, wenn er den
 * Serverwert nicht um mehr als die Toleranz unterschreitet – sonst der
 * Serverwert. Nicht-Zahlen, negative und unendliche Werte zählen als
 * Unterschreitung.
 */
export function vertrauenswuerdigeStichzahl(
  clientWert: unknown,
  serverWert: number,
  toleranz: number
): { wert: number; ersetzt: boolean } {
  const untergrenze = serverWert * (1 - toleranz);
  if (istEndlicheZahl(clientWert) && clientWert >= untergrenze) {
    return { wert: clientWert, ersetzt: false };
  }
  return { wert: serverWert, ersetzt: true };
}

export interface StichzahlKorrektur {
  itemId: string;
  elementId: string;
  typ: ConfigElement['type'];
  clientWert: unknown;
  serverWert: number;
  verwendet: number;
}

export interface VertrauenswuerdigeStichzahlen {
  /** Kopie der Positionen; bei Stickerei mit ersetzter Stichzahl je Element. */
  items: CartItem[];
  /** Elemente, deren Clientwert durch den Serverwert ersetzt wurde. */
  korrekturen: StichzahlKorrektur[];
}

/**
 * Ersetzt in allen Stickerei-Positionen die vom Browser übermittelte
 * Stichzahl durch den vertrauenswürdigen Wert (siehe Kopfkommentar).
 * DTF-Positionen bleiben unverändert – dort wird nicht nach Stichen
 * abgerechnet.
 */
export function mitVertrauenswuerdigerStichzahl(items: CartItem[]): VertrauenswuerdigeStichzahlen {
  const korrekturen: StichzahlKorrektur[] = [];
  const geprueft = items.map((item) => {
    if (item.printMethod !== 'embroidery' || !Array.isArray(item.elements)) return item;
    const elements = item.elements.map((element): ConfigElement => {
      const serverWert =
        element.type === 'text'
          ? schaetzeTextSticheServer(element)
          : schaetzeLogoSticheAusPng((element as LogoElement).fileUrl, element.widthCm, element.heightCm);
      const toleranz = element.type === 'text' ? STICH_TOLERANZ.text : STICH_TOLERANZ.logo;
      const { wert, ersetzt } = vertrauenswuerdigeStichzahl(element.estimatedStitches, serverWert, toleranz);
      if (ersetzt) {
        korrekturen.push({
          itemId: item.id,
          elementId: element.id,
          typ: element.type,
          clientWert: element.estimatedStitches,
          serverWert,
          verwendet: wert,
        });
      }
      return { ...element, estimatedStitches: wert };
    });
    return { ...item, elements };
  });
  return { items: geprueft, korrekturen };
}
