/**
 * Kernversprechen des Bildimports: Im Shop gibt es keine Silhouetten mehr.
 *
 * Diese Tests sind der Wächter dafür. Sie prüfen nicht, wie viele Bilder es
 * gibt, sondern die Eigenschaft, die der Kunde erlebt: Jede Farbe, die er
 * anklicken kann, zeigt danach ein echtes Herstellerfoto.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTS } from '@/config/products';
import { waehlbareFarben } from '../farben';
import { sichtbareAnsichten } from '../ansichten';
import {
  assetVerfuegbarkeit,
  bildFuerAnsicht,
  repraesentativBildVon,
  PLATZHALTER_BILD,
} from '@/lib/assets';

test('jede wählbare Farbe hat echte Herstellerfotos', () => {
  const ohne: string[] = [];
  for (const p of PRODUCTS) {
    for (const f of waehlbareFarben(p.id, p.colors)) {
      if (assetVerfuegbarkeit(p.id, f.id) !== 'vorhanden') ohne.push(`${p.id}/${f.id}`);
    }
  }
  assert.deepEqual(ohne, [], 'Diese Farben wären anwählbar, zeigen aber die Platzhalter-Silhouette.');
});

test('jedes Produkt behält mindestens eine wählbare Farbe', () => {
  // Der Notnagel in waehlbareFarben() (alle Farben zeigen, wenn keine ein Foto
  // hat) darf im echten Katalog nie greifen – sonst stünden dort Silhouetten.
  const leer = PRODUCTS.filter((p) => waehlbareFarben(p.id, p.colors).length === 0);
  assert.deepEqual(leer.map((p) => p.id), []);
  const ohneFoto = PRODUCTS.filter((p) => assetVerfuegbarkeit(p.id) !== 'vorhanden');
  assert.deepEqual(ohneFoto.map((p) => p.id), [], 'Produkt ganz ohne echte Fotos');
});

test('die Vorderansicht jeder wählbaren Farbe ist kein Platzhalter', () => {
  // Schärfer als der Status: Das Manifest könnte eine Farbe als „real" führen
  // und trotzdem für front den Platzhalter eintragen.
  const schlecht: string[] = [];
  for (const p of PRODUCTS) {
    for (const f of waehlbareFarben(p.id, p.colors)) {
      const front = bildFuerAnsicht(p.id, f.id, 'front') ?? repraesentativBildVon(p.id, f.id);
      if (front === PLATZHALTER_BILD) schlecht.push(`${p.id}/${f.id}`);
    }
  }
  assert.deepEqual(schlecht, []);
});

test('die Ansichtenleiste springt beim Farbwechsel nicht', () => {
  // Was der Kunde erlebt: Er klickt sich durch die Farben, und die Reiter über
  // dem Bild bleiben dieselben. Eine Ansicht, die nur bei manchen Farben
  // auftaucht, sieht nach Fehler aus – nicht nach Datenlage.
  const springt: string[] = [];
  for (const p of PRODUCTS) {
    const farben = waehlbareFarben(p.id, p.colors);
    if (farben.length < 2) continue;
    const erste = sichtbareAnsichten(p, farben[0]!.id).join(',');
    for (const f of farben.slice(1)) {
      const jetzt = sichtbareAnsichten(p, f.id).join(',');
      if (jetzt !== erste) springt.push(`${p.id}: ${farben[0]!.id}=[${erste}] vs ${f.id}=[${jetzt}]`);
    }
  }
  assert.deepEqual(springt.slice(0, 10), []);
});

test('jede gezeigte Ansicht einer wählbaren Farbe hat ein Bild', () => {
  // Ausnahme mit Ansage: `back` darf der neutrale Platzhalter sein, damit
  // Rückendruck buchbar bleibt, auch wo der Händler kein Rückenfoto führt.
  const schlecht: string[] = [];
  for (const p of PRODUCTS) {
    for (const f of waehlbareFarben(p.id, p.colors)) {
      for (const v of sichtbareAnsichten(p, f.id)) {
        const bild = bildFuerAnsicht(p.id, f.id, v);
        if (!bild) schlecht.push(`${p.id}/${f.id}/${v}: kein Bild`);
        else if (bild === PLATZHALTER_BILD && v !== 'back') {
          schlecht.push(`${p.id}/${f.id}/${v}: Platzhalter`);
        }
      }
    }
  }
  assert.deepEqual(schlecht, []);
});
