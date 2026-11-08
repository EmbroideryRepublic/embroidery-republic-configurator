/**
 * Lädt EIN Text-Element einer Bestellung für den Download als JPG (siehe
 * app/api/admin/bestellungen/[id]/texte/[elementId]/route.ts und
 * lib/rendering/renderTextJpg.ts).
 *
 * ── Warum über die Element-Kennung ─────────────────────────────────────
 * Weder order_items noch configuration_elements haben eine Reihenfolge-Spalte
 * (nur eine zufällige UUID); "Position N" und "Text N" auf der Admin-Seite
 * beruhen auf der Rückgabereihenfolge der Datenbank (siehe kundendateien.ts).
 * Ein Link mit "Position 1, Text 1" könnte bei geänderter Reihenfolge den
 * falschen Text liefern – die Kennung des Elements ist eindeutig. Die
 * Nummern fließen nur in den vorgeschlagenen Dateinamen ein, genauso gezählt
 * wie in ProductionPreview.tsx.
 *
 * Es wird geprüft, dass das Element wirklich zu der Bestellung der Adresse
 * gehört – sonst ließe sich über eine fremde Bestellkennung jeder Text laden.
 */
import { createAdminClient } from '@/lib/supabase/server';
import { buildOrderNumber } from '@/lib/actions/orderTypes';
import { zuElementRecord } from '@/lib/orders/orderCompletion';
import { toRenderableElement } from '@/lib/rendering/mapOrderElements';
import type { TextJpgEingabe } from '@/lib/rendering/renderTextJpg';
import { ansichtLabel } from '@/lib/admin/ansichten';
import { saeubereFuerDateisystem } from '@/lib/admin/kundendateien';
import type { PrintMethod, PrintView } from '@/types';

/** Umlaute lesbar umschreiben ("Rückseite" → "Rueckseite"); die allgemeine
 *  Bereinigung (saeubereFuerDateisystem) würde sonst "Ruckseite" daraus machen. */
function ohneUmlaute(wert: string): string {
  const ersatz: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue', Ä: 'Ae', Ö: 'Oe', Ü: 'Ue', ß: 'ss' };
  return wert.replace(/[äöüÄÖÜß]/g, (zeichen) => ersatz[zeichen] ?? zeichen);
}

export interface TextFuerJpg {
  eingabe: TextJpgEingabe;
  /** Vorgeschlagener Dateiname, z. B. "ER-2026-F5EE03_Position-1_Rueckseite_Text-1.jpg". */
  dateiname: string;
}

export async function ladeTextFuerJpg(orderId: string, elementId: string): Promise<TextFuerJpg | null> {
  const db = createAdminClient();

  const { data: zeile, error: elementFehler } = await db.from('configuration_elements').select('*').eq('id', elementId).maybeSingle();
  if (elementFehler) console.error('[admin] Text-Element nicht ladbar:', elementFehler.message);
  if (!zeile || zeile.element_type !== 'text') return null;

  const { data: positionen, error: positionenFehler } = await db
    .from('order_items')
    .select('id, product_id, color_id, print_method, size_quantities')
    .eq('order_id', orderId);
  if (positionenFehler) console.error('[admin] Positionen nicht ladbar:', positionenFehler.message);

  // Gehört das Element zu dieser Bestellung?
  const positionIndex = (positionen ?? []).findIndex((p) => p.id === zeile.order_item_id);
  const position = positionIndex >= 0 ? positionen?.[positionIndex] : undefined;
  if (!position) return null;

  const renderbar = await toRenderableElement(zuElementRecord(zeile as Record<string, unknown>));
  if (renderbar.type !== 'text') return null;

  // "Text N" je Ansicht wie in ProductionPreview.tsx: nur Texte zählen, in
  // Datenbank-Reihenfolge, je Position × Ansicht neu ab 1.
  const { data: geschwister } = await db
    .from('configuration_elements')
    .select('id, element_type, view')
    .eq('order_item_id', zeile.order_item_id as string);
  const texteDieserAnsicht = (geschwister ?? []).filter((el) => el.element_type === 'text' && el.view === zeile.view);
  const textNummer = Math.max(1, texteDieserAnsicht.findIndex((el) => el.id === elementId) + 1);

  const { data: bestellung } = await db.from('orders').select('order_number').eq('id', orderId).maybeSingle();
  const bestellnummer = (bestellung?.order_number as string | null) ?? buildOrderNumber(orderId);

  const ansicht = zeile.view as PrintView;
  const dateiname =
    `${saeubereFuerDateisystem(bestellnummer)}_Position-${positionIndex + 1}_` +
    `${saeubereFuerDateisystem(ohneUmlaute(ansichtLabel(ansicht)))}_Text-${textNummer}.jpg`;

  return {
    dateiname,
    eingabe: {
      productId: position.product_id as string,
      colorId: position.color_id as string,
      view: ansicht,
      printMethod: ((position.print_method as string | null) ?? 'dtf') as PrintMethod,
      sizeQuantities: (position.size_quantities ?? {}) as Record<string, number>,
      element: renderbar,
    },
  };
}
