/**
 * Eingangs-Validierung der Import-Verträge (ADR 0006).
 *
 * Ein Adapter liefert nur Rohdaten – bevor die Pipeline sie verarbeitet, werden
 * die Mindest-Invarianten geprüft, damit ein fehlerhafter Adapter FAIL-LOUD (mit
 * quellenscharfer Meldung) auffällt statt still Falsches zu erzeugen (z. B. leere
 * colors/sizes, unbekannte Farbe, fehlende Bild-URL). Reine Funktionen, im
 * Test-Gate abgesichert.
 */
import type { BildReferenz, ImportProduktRef } from './imageSource';
import type { RohProdukt } from './rohProdukt';

/** Mindest-Invarianten eines Roh-Produkts (Datenadapter). Leere Meldungsliste = ok. */
export function validiereRohProdukt(p: RohProdukt): string[] {
  const fehler: string[] = [];
  if (!p.url) fehler.push('url fehlt');
  if (!p.name) fehler.push('name fehlt');
  if (!p.brand) fehler.push('brand fehlt');
  if (!p.colors?.length) fehler.push('colors leer');
  else {
    for (const c of p.colors) {
      if (!c?.name) fehler.push('Farbe ohne name');
      if (!/^#?[0-9a-fA-F]{6}$/.test(c?.hex ?? '')) fehler.push(`Farbe "${c?.name ?? '?'}": ungültiger hex "${c?.hex ?? ''}"`);
    }
  }
  if (!p.sizes?.length) fehler.push('sizes leer');
  return fehler.map((f) => `${p.url || p.name || '?'}: ${f}`);
}

/** Invarianten der Bild-Referenzen eines Bildadapters gegen das Produkt. */
export function validiereBildReferenzen(refs: readonly BildReferenz[], produkt: ImportProduktRef): string[] {
  const bekannteFarben = new Set(produkt.colors.map((c) => c.id));
  const fehler: string[] = [];
  for (const r of refs) {
    if (!bekannteFarben.has(r.colorId)) fehler.push(`unbekannte colorId "${r.colorId}"`);
    if (!r.view) fehler.push(`${r.colorId}: view fehlt`);
    if (!r.quellUrl) fehler.push(`${r.colorId}/${r.view}: quellUrl fehlt`);
    if (r.herkunft !== 'original' && r.herkunft !== 'generiert') {
      fehler.push(`${r.colorId}/${r.view}: ungültige herkunft "${r.herkunft}"`);
    }
  }
  return fehler.map((f) => `${produkt.id}: ${f}`);
}
