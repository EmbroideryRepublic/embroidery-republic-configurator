import type { ProductConfig } from '@/config/products/types';
import type { PrintView } from '@/types';
import { PRINT_AREA_DATA } from '@/config/printAreaData';
import { sortierePositionen, istGueltigeView } from '@/config/decorationPositions';
import { resolveColorImages } from '@/lib/assets';
import { waehlbareFarben } from './farben';

/**
 * EINZIGE Laufzeit-Quelle „welche Druckansichten hat dieses Produkt".
 *
 * Bevorzugt die explizite Konfiguration (`product.views`); ist sie nicht
 * gesetzt, werden die Ansichten aus den hinterlegten Druckflächen abgeleitet
 * (`PRINT_AREA_DATA` – bereits pro Produkt gepflegt, inkl. Klassen-Alias).
 * Das Ergebnis ist immer:
 *   - auf in der View-Registry (decorationPositions.ts) bekannte Views gefiltert,
 *   - in fachlicher Reihenfolge sortiert.
 *
 * Konfigurator, Produktbrowser, Produktionsdaten, Canvas und Validierung sollen
 * ausschließlich hierüber ermitteln, welche Ansichten existieren – niemals über
 * feste front/back/sleeve-Listen. Siehe docs/adr/0001-generische-druckansichten.md.
 */
// Ergebnis je Produkt memoisieren: ansichtenVon läuft in Render-Pfaden und lieferte
// sonst bei jedem Aufruf ein NEUES Array (Object.keys + filter + Spread/Sort), obwohl
// es nur vom (stabilen) Produktobjekt abhängt. WeakMap = stabile Referenz + keine
// Wiederberechnung; kein Leak, da an die Produktlebensdauer gebunden. Ergebnis wird
// ausschließlich lesend genutzt.
const ansichtenCache = new WeakMap<ProductConfig, PrintView[]>();

export function ansichtenVon(product: ProductConfig): PrintView[] {
  const gecacht = ansichtenCache.get(product);
  if (gecacht) return gecacht;
  const roh = product.views ?? Object.keys(PRINT_AREA_DATA[product.id] ?? {});
  const ergebnis = sortierePositionen(roh.filter(istGueltigeView));
  ansichtenCache.set(product, ergebnis);
  return ergebnis;
}

/**
 * Ansichten, die dem Kunden für DIESE Farbe gezeigt werden dürfen.
 *
 * `ansichtenVon()` sagt, wo das Produkt bedruckbar IST (fachliche Fähigkeit).
 * Zeigen können wir eine Ansicht aber nur, wenn dafür auch ein Bild existiert.
 * Früher füllte das Manifest jede fehlende Ansicht mit dem VORDERBILD – dadurch
 * zeigten „Rückseite" und beide Ärmel dasselbe Frontfoto. Seitdem gilt:
 *   - front: immer echt,
 *   - back:  echt oder neutraler Platzhalter (Rückendruck bleibt buchbar),
 *   - Ärmel: nur mit eigenem Bild – sonst hier ausgefiltert.
 */
export function sichtbareAnsichten(product: ProductConfig, colorId: string | null | undefined): PrintView[] {
  const gefuehrt = ansichtenVon(product);
  if (!colorId) return gefuehrt;
  const vorhanden = resolveColorImages(product.id, colorId);
  const sichtbar = gefuehrt.filter((v) => vorhanden[v] && (!AERMEL.has(v) || aermelVollstaendig(product, v)));
  // Ohne jedes Bild (Farbe ganz ohne Fotos) lieber die geführten Ansichten
  // zeigen als eine leere Ansichtenleiste.
  return sichtbar.length ? sichtbar : gefuehrt;
}

const AERMEL = new Set<string>(['sleeve_left', 'sleeve_right']);

/**
 * Ärmelansichten werden nur produktweit angeboten – entweder für JEDE wählbare
 * Farbe oder für keine.
 *
 * Grund: Die Händler fotografieren Ärmel unsystematisch. Ohne diese Regel führte
 * z.B. das Neutral Ladies' Fit T-Shirt bei genau 1 von 31 Farben einen Reiter
 * „Ärmel links", der beim Weiterklicken wieder verschwand. Für den Kunden sieht
 * das nicht nach Datenlage aus, sondern nach einem Fehler. Lieber eine Ansicht
 * weniger als eine, die springt; sobald der Bildimport die Lücke schließt,
 * erscheint sie von selbst wieder für alle Farben.
 */
const aermelCache = new WeakMap<ProductConfig, Map<string, boolean>>();

function aermelVollstaendig(product: ProductConfig, view: PrintView): boolean {
  let proProdukt = aermelCache.get(product);
  if (!proProdukt) aermelCache.set(product, (proProdukt = new Map()));
  const gecacht = proProdukt.get(view);
  if (gecacht !== undefined) return gecacht;
  const farben = waehlbareFarben(product.id, product.colors);
  const alle = farben.length > 0 && farben.every((c) => resolveColorImages(product.id, c.id)[view]);
  proProdukt.set(view, alle);
  return alle;
}
