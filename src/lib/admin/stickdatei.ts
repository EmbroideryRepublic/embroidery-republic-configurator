/**
 * Stickdatei (DST) für EIN Text- oder Logo-Element einer Bestellung – Grundlage der Admin-Route
 * app/api/admin/bestellungen/[id]/stickdatei/[elementId]/route.ts.
 *
 * Die Datei entsteht auf Abruf aus den gespeicherten Bestelldaten (nichts wird gespeichert, ein späterer Abruf liefert
 * dasselbe): Text wie beim PNG-Download gerastert (Schrift, Größe, Farbe, Zeilenumbrüche), Logo aus dem gespeicherten
 * Anzeigebild in der vom Kunden gewählten Größe. Daraus rechnet lib/embroidery/digitalisieren die Stichfolge.
 *
 * Wie bei den Text-Downloads (lib/admin/textDateien.ts) wird die Element-Kennung geprüft: Das Element muss zu der
 * Bestellung der Adresse gehören, sonst ließe sich über eine fremde Bestellkennung jedes Motiv laden.
 */
import { Resvg } from '@resvg/resvg-js';
import { createAdminClient } from '@/lib/supabase/server';
import { buildOrderNumber } from '@/lib/actions/orderTypes';
import { zuElementRecord } from '@/lib/orders/orderCompletion';
import { toRenderableElement } from '@/lib/rendering/mapOrderElements';
import { renderTextAlsPixel } from '@/lib/rendering/renderTextJpg';
import { ansichtLabel } from '@/lib/admin/ansichten';
import { saeubereFuerDateisystem } from '@/lib/admin/kundendateien';
import { ladeTextFuerJpg } from '@/lib/admin/textDateien';
import { digitalisiereLogo, digitalisiereText } from '@/lib/embroidery/digitalisieren/digitalisiere';
import { renderStickvorschau } from '@/lib/embroidery/digitalisieren/vorschau';
import { STANDARD_PARAMETER } from '@/lib/embroidery/digitalisieren/parameter';
import type { Raster } from '@/lib/embroidery/digitalisieren/maske';
import type { GarnZuordnung } from '@/lib/embroidery/digitalisieren/formate';
import type { PrintView } from '@/types';

/** Auflösung des Rasters: 254 dpi = 10 Bildpunkte je Millimeter (passt zu STANDARD_PARAMETER.pxProMm). */
const RASTER_DPI = STANDARD_PARAMETER.pxProMm * 25.4;
/** Größere Logos (längste Kante) werden gar nicht erst gerastert: Die Stickgrenze liegt bei 300 mm. */
const MAX_LOGO_KANTE_CM = STANDARD_PARAMETER.maxKanteMm / 10 + 5;

export interface StickdateiKennzahlen {
  breiteMm: number;
  hoeheMm: number;
  stiche: number;
  sprunge: number;
  /** Fadenschnitte in der Datei (vor jedem Sprung ab 3 mm). */
  schnitte: number;
  farben: number;
  /** Garnfarbe des Motivs und nächstliegender Palettenplatz bei Brother (PES) und Janome (JEF). */
  garne: GarnZuordnung[];
  hinweise: string[];
}

export type StickdateiErgebnis =
  | { ok: true; dateien: { dst: Buffer; pes: Buffer; jef: Buffer }; vorschauPng: Buffer; dateiname: string; kennzahlen: StickdateiKennzahlen }
  | { ok: false; status: 404 | 422; grund: string };

function ohneUmlaute(wert: string): string {
  const ersatz: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue', Ä: 'Ae', Ö: 'Oe', Ü: 'Ue', ß: 'ss' };
  return wert.replace(/[äöüÄÖÜß]/g, (zeichen) => ersatz[zeichen] ?? zeichen);
}

function bilderkennung(bytes: Buffer): string | null {
  if (bytes.length > 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg';
  if (bytes.length > 12 && bytes.toString('latin1', 0, 4) === 'RIFF' && bytes.toString('latin1', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

/**
 * Rastert ein Logobild in Stickgröße (10 Bildpunkte je Millimeter), mit der Drehung aus dem Konfigurator.
 * Das Bild wird auf die vom Kunden gewählte Breite × Höhe gestreckt, die Fläche außerhalb bleibt transparent.
 */
export function rastereLogo(bild: Buffer, breiteCm: number, hoeheCm: number, drehungGrad: number): Raster | { fehler: string } {
  const mime = bilderkennung(bild);
  if (!mime) return { fehler: 'Das Logo hat ein unbekanntes Bildformat.' };
  const pxProCm = RASTER_DPI / 2.54;
  const b = Math.max(1, Math.round(breiteCm * pxProCm));
  const h = Math.max(1, Math.round(hoeheCm * pxProCm));
  const w = (drehungGrad * Math.PI) / 180;
  const gesamtB = Math.max(1, Math.ceil(Math.abs(b * Math.cos(w)) + Math.abs(h * Math.sin(w))));
  const gesamtH = Math.max(1, Math.ceil(Math.abs(b * Math.sin(w)) + Math.abs(h * Math.cos(w))));
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${gesamtB}" height="${gesamtH}" viewBox="0 0 ${gesamtB} ${gesamtH}">` +
    `<g transform="translate(${gesamtB / 2} ${gesamtH / 2}) rotate(${drehungGrad}) translate(${-b / 2} ${-h / 2})">` +
    `<image width="${b}" height="${h}" preserveAspectRatio="none" xlink:href="data:${mime};base64,${bild.toString('base64')}"/>` +
    `</g></svg>`;
  const gerendert = new Resvg(svg).render();
  return { breite: gerendert.width, hoehe: gerendert.height, rgba: new Uint8Array(gerendert.pixels) };
}

export interface StickdateiOptionen {
  /**
   * Bei Logos: einfarbigen Hintergrund am Rand (meist weiß) entfernen (Standard: ja). Bei "nein" wird das ORIGINAL des Kunden
   * (vor jeder Hintergrundentfernung) verwendet und ein deckender Hintergrund als eigene Garnfarbe mitgestickt.
   */
  hintergrundEntfernen?: boolean;
}

/**
 * Welche Bilddatei eines Logos gestickt wird. Hintergrund AN: das Anzeigebild des Kunden (ggf. schon freigestellt), danach die
 * automatische Randentfernung. Hintergrund AUS: das Original des Kunden, unverändert (fehlt es, bleibt das Anzeigebild).
 */
export function logoQuelle<T extends { logoStoragePath?: string; logoDisplayStoragePath?: string }>(record: T, hintergrundEntfernen: boolean): T {
  if (hintergrundEntfernen) return record;
  return { ...record, logoDisplayStoragePath: record.logoStoragePath ?? record.logoDisplayStoragePath };
}

export async function erzeugeStickdatei(orderId: string, elementId: string, optionen: StickdateiOptionen = {}): Promise<StickdateiErgebnis> {
  const hintergrundEntfernen = optionen.hintergrundEntfernen !== false;
  const db = createAdminClient();
  const { data: zeile, error: elementFehler } = await db.from('configuration_elements').select('*').eq('id', elementId).maybeSingle();
  if (elementFehler) console.error('[admin] Stick-Element nicht ladbar:', elementFehler.message);
  const nichtGefunden: StickdateiErgebnis = { ok: false, status: 404, grund: 'Dieses Motiv gehört nicht zu der Bestellung oder existiert nicht (mehr).' };
  if (!zeile || (zeile.element_type !== 'text' && zeile.element_type !== 'logo')) return nichtGefunden;

  // Gehört das Element zu dieser Bestellung? (Position und Zählung wie in ProductionPreview.tsx)
  const { data: positionen } = await db.from('order_items').select('id, product_id, color_id, print_method, size_quantities').eq('order_id', orderId);
  const positionIndex = (positionen ?? []).findIndex((p) => p.id === zeile.order_item_id);
  if (positionIndex < 0) return nichtGefunden;

  const { data: geschwister } = await db.from('configuration_elements').select('id, element_type, view').eq('order_item_id', zeile.order_item_id as string);
  const gleicheArt = (geschwister ?? []).filter((el) => el.element_type === zeile.element_type && el.view === zeile.view);
  const nummer = Math.max(1, gleicheArt.findIndex((el) => el.id === elementId) + 1);
  const { data: bestellung } = await db.from('orders').select('order_number').eq('id', orderId).maybeSingle();
  const bestellnummer = (bestellung?.order_number as string | null) ?? buildOrderNumber(orderId);
  const art = zeile.element_type === 'text' ? 'Text' : 'Logo';
  const dateiname =
    `${saeubereFuerDateisystem(bestellnummer)}_Position-${positionIndex + 1}_` +
    `${saeubereFuerDateisystem(ohneUmlaute(ansichtLabel(zeile.view as PrintView)))}_${art}-${nummer}_Stickdatei`;
  // Im Kopf der Dateien steht ein kurzer Name (nur ASCII; PES zeigt 8 Zeichen): Art+Nummer, dann das Ende der Bestellnummer.
  const kopfName = `${art[0]}${nummer}${bestellnummer.replace(/[^A-Za-z0-9]/g, '').slice(-6)}`;

  let ergebnis;
  if (zeile.element_type === 'text') {
    const text = await ladeTextFuerJpg(orderId, elementId);
    if (!text) return nichtGefunden;
    // Schatten und Kontur sind Druck-Effekte; gestickt wird nur die Schrift selbst, in Stickauflösung.
    const raster = await renderTextAlsPixel({ ...text.eingabe, dpi: RASTER_DPI, element: { ...text.eingabe.element, hasShadow: false, hasOutline: false } });
    if (!raster.ok) return { ok: false, status: 422, grund: raster.grund };
    if (Math.abs(raster.dpi - RASTER_DPI) > 1) {
      return { ok: false, status: 422, grund: 'Der Text ist für die automatische Digitalisierung zu groß (Stickgrenze 300 mm).' };
    }
    ergebnis = digitalisiereText({ breite: raster.breitePx, hoehe: raster.hoehePx, rgba: raster.pixel }, text.eingabe.element.color, kopfName);
  } else {
    const record = zuElementRecord(zeile as Record<string, unknown>);
    const renderbar = await toRenderableElement(logoQuelle(record, hintergrundEntfernen));
    if (renderbar.type !== 'logo') return nichtGefunden;
    if (Math.max(renderbar.widthCm, renderbar.heightCm) > MAX_LOGO_KANTE_CM) {
      return { ok: false, status: 422, grund: `Das Logo ist mit ${Math.max(renderbar.widthCm, renderbar.heightCm).toFixed(0)} cm zu groß für die automatische Digitalisierung (Grenze ${STANDARD_PARAMETER.maxKanteMm / 10} cm).` };
    }
    const raster = rastereLogo(renderbar.imageBuffer, renderbar.widthCm, renderbar.heightCm, renderbar.rotationDeg ?? 0);
    if ('fehler' in raster) return { ok: false, status: 422, grund: raster.fehler };
    ergebnis = digitalisiereLogo(raster, kopfName, undefined, { hintergrundEntfernen });
  }

  if (!ergebnis.ok) return { ok: false, status: 422, grund: ergebnis.grund };
  return {
    ok: true,
    dateien: { dst: ergebnis.dateien.dst, pes: ergebnis.dateien.pes, jef: ergebnis.dateien.jef },
    vorschauPng: renderStickvorschau(ergebnis.plan, { pxProMm: 8, zeigeSpruenge: true }),
    dateiname,
    kennzahlen: {
      breiteMm: Math.round(ergebnis.plan.breiteMm * 10) / 10,
      hoeheMm: Math.round(ergebnis.plan.hoeheMm * 10) / 10,
      stiche: ergebnis.plan.stichzahl,
      sprunge: ergebnis.plan.sprungzahl,
      schnitte: ergebnis.dateien.schnitte,
      farben: ergebnis.plan.bloecke.length,
      garne: ergebnis.dateien.garne,
      hinweise: ergebnis.hinweise,
    },
  };
}
