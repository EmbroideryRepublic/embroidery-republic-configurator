/**
 * WÄCHTER für die Facetten.
 *
 * Diese Tests sind der Grund, warum die Filter „automatisch mitwachsen"
 * dürfen, ohne dass etwas still danebengeht: Bringt ein neues Produkt einen
 * Materialtext, eine Passform, ein Geschlecht oder eine Farbe mit, die in
 * den Zuordnungstabellen fehlt, schlägt hier ein Test an – und die Einordnung
 * wird EINMAL bewusst getroffen, statt dass das Produkt unauffindbar bleibt.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { PRODUCTS } from '@/config/products';
import {
  FARBGRUPPEN, GESCHLECHTER, MATERIAL_GRUPPEN, PASSFORMEN,
  geschlechterVon, materialGruppen, passformVon,
} from '@/config/products/facetten';
import { farbgruppenVon } from '../filter';
import { loeseAuf } from '../verfuegbarkeit';

test('jedes Produkt hat eine Materialgruppe', () => {
  const ohne = PRODUCTS.filter((p) => materialGruppen(p).length === 0);
  assert.deepEqual(
    ohne.map((p) => `${p.id} → ${p.material}`),
    [],
    'Materialtext fehlt in MATERIAL_GRUPPEN (facetten.ts). Einmal einordnen, dann ist das Produkt filterbar.'
  );
});

test('jedes Produkt hat eine Passform', () => {
  const ohne = PRODUCTS.filter((p) => passformVon(p) === undefined);
  assert.deepEqual(
    ohne.map((p) => `${p.id} → ${p.fit}`),
    [],
    'Passformtext fehlt in PASSFORMEN (facetten.ts).'
  );
});

test('jedes Produkt hat mindestens ein Geschlecht', () => {
  const ohne = PRODUCTS.filter((p) => geschlechterVon(p).length === 0);
  assert.deepEqual(
    ohne.map((p) => `${p.id} → ${p.detailedDescription?.gender ?? '(kein gender)'}`),
    [],
    'Geschlecht fehlt in GESCHLECHTER (facetten.ts) oder detailedDescription.gender ist nicht gesetzt.'
  );
});

test('jede Farbe ist einer Grundfarbe zugeordnet', () => {
  const fehlend = new Set<string>();
  for (const p of PRODUCTS) for (const f of p.colors) if (!FARBGRUPPEN[f.name]) fehlend.add(f.name);
  assert.deepEqual([...fehlend], [], 'Farbname fehlt in FARBGRUPPEN (facetten.ts).');
});

test('jedes Produkt liefert mindestens eine Farbgruppe', () => {
  const ohne = PRODUCTS.filter((p) => farbgruppenVon(p).length === 0);
  assert.deepEqual(ohne.map((p) => p.id), []);
});

test('die Zuordnungstabellen enthalten keine toten Einträge', () => {
  const materialien = new Set(PRODUCTS.map((p) => p.material));
  const passformen = new Set(PRODUCTS.map((p) => p.fit));
  const geschlechter = new Set(PRODUCTS.map((p) => p.detailedDescription?.gender).filter(Boolean));
  const farben = new Set(PRODUCTS.flatMap((p) => p.colors.map((f) => f.name)));

  // Tote Einträge sind kein Fehler, aber ein Hinweis auf Sortimentsreste.
  // Der Test hält sie sichtbar, statt sie unbemerkt anwachsen zu lassen.
  assert.deepEqual(Object.keys(MATERIAL_GRUPPEN).filter((m) => !materialien.has(m)), []);
  assert.deepEqual(Object.keys(PASSFORMEN).filter((f) => !passformen.has(f)), []);
  assert.deepEqual(Object.keys(GESCHLECHTER).filter((g) => !geschlechter.has(g)), []);
  assert.deepEqual(Object.keys(FARBGRUPPEN).filter((f) => !farben.has(f)), []);
});

// ── Verfügbarkeit ──────────────────────────────────────────────────────

test('Vorrangregel: ausgelaufen gewinnt immer', () => {
  assert.equal(loeseAuf('ausgelaufen', 'lieferbar'), 'ausgelaufen');
});

test('Vorrangregel: Lieferantenmeldung schlägt den manuellen Status', () => {
  assert.equal(loeseAuf('lieferbar', 'voruebergehend_nicht_lieferbar'), 'voruebergehend_nicht_lieferbar');
  assert.equal(loeseAuf('voruebergehend_nicht_lieferbar', 'lieferbar'), 'lieferbar');
});

test('Vorrangregel: ohne Angaben gilt lieferbar', () => {
  assert.equal(loeseAuf(undefined, undefined), 'lieferbar');
  assert.equal(loeseAuf('voruebergehend_nicht_lieferbar', undefined), 'voruebergehend_nicht_lieferbar');
});

// ── Keine hartkodierten Optionslisten in der Oberfläche ────────────────

function quelldateien(verzeichnis: string, gesammelt: string[] = []): string[] {
  for (const eintrag of readdirSync(verzeichnis)) {
    if (eintrag === 'node_modules' || eintrag === '__tests__') continue;
    const pfad = join(verzeichnis, eintrag);
    if (statSync(pfad).isDirectory()) quelldateien(pfad, gesammelt);
    else if (/\.tsx?$/.test(eintrag)) gesammelt.push(pfad);
  }
  return gesammelt;
}

/**
 * Entfernt Kommentare. Der Wächter soll CODE prüfen, nicht Prosa: Ein
 * Kommentar, der das Wort „Weiß" erklärt, ist kein hartkodierter Farbwert.
 */
function ohneKommentare(quelltext: string): string {
  return quelltext
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

test('kein Filterbaustein zählt Marken oder Farbnamen fest auf', () => {
  const marken = [...new Set(PRODUCTS.map((p) => p.brand))];
  const farbnamen = [...new Set(PRODUCTS.flatMap((p) => p.colors.map((f) => f.name)))];
  const treffer: string[] = [];

  for (const datei of quelldateien(join('src', 'components', 'shop'))) {
    const inhalt = ohneKommentare(readFileSync(datei, 'utf8'));
    for (const wert of [...marken, ...farbnamen]) {
      if (inhalt.includes(wert)) treffer.push(`${datei}: ${wert}`);
    }
  }

  assert.deepEqual(
    treffer,
    [],
    'Marken- und Farbnamen gehören nicht in die Oberfläche – die Werte kommen aus den Facetten.'
  );
});

test('die Facettenwerte werden nirgends außerhalb von facetten.ts aufgezählt', () => {
  // Ein zweiter Ort mit derselben Werteliste wäre eine zweite Quelle.
  const verdaechtig = quelldateien(join('src', 'app'))
    .concat(quelldateien(join('src', 'components')))
    .filter((datei) => {
      const inhalt = readFileSync(datei, 'utf8');
      return /MATERIAL_GRUPPEN|PASSFORMEN\s*=|FARBGRUPPEN\s*=/.test(inhalt);
    });
  assert.deepEqual(verdaechtig, []);
});
