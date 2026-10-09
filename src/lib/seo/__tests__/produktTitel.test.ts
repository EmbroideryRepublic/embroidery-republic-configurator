/**
 * Titel der Produktseiten: Stufen, Kürzung und – wichtiger – der Wächter über
 * den echten Katalog. Der Anlass: Bei 22 von 154 Produkten wurde der Name
 * mitten im Wort abgeschnitten, und zwei verschiedene B&C-Shirts trugen
 * denselben Titel („T-Shirt #E150 Long Sleeve /…").
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { produktTitel, TITEL_ZIELLAENGE } from '../produktTitel';
import { kuerzenAufLaenge } from '../kuerzen';
import { alleProduktSlugs, ladeProduktseite } from '../../products/productPage';

// ── Stufen ───────────────────────────────────────────────────────────────

test('kurzer Name: volle Stufe mit Suchbegriffen und Marke', () => {
  assert.equal(produktTitel('Heavy T', 'Fruit of the Loom'), 'Heavy T bedrucken & besticken | Fruit of the Loom');
});

test('mittlerer Name: „bedrucken" statt „bedrucken & besticken", Marke bleibt', () => {
  assert.equal(
    produktTitel('Ladies Valueweight V-Neck T', 'Fruit of the Loom'),
    'Ladies Valueweight V-Neck T bedrucken | Fruit of the Loom'
  );
});

test('langer Name: nur Name und Marke', () => {
  const name = 'X'.repeat(45);
  assert.equal(produktTitel(name, 'B&C'), `${name} | B&C`);
});

test('Name und Marke passen zusammen nicht mehr: die Marke entfällt, der Suchbegriff bleibt', () => {
  // „… | Fruit of the Loom" wäre 61 Zeichen – eines zu viel.
  assert.equal(
    produktTitel('Iconic 195 Ringspun Premium Long Sleeve T', 'Fruit of the Loom'),
    'Iconic 195 Ringspun Premium Long Sleeve T bedrucken'
  );
});

test('Name so lang, dass auch „bedrucken" nicht mehr passt: nur der Name', () => {
  const name = 'Y'.repeat(55);
  assert.equal(produktTitel(name, 'B&C'), name);
});

test('erst wenn selbst der Name nicht passt, wird gekürzt – am Wortende, mit „…", innerhalb der Grenze', () => {
  const lang = 'Extrem langer Produktname mit sehr vielen einzelnen Wörtern der nie in einen Titel passt';
  const titel = produktTitel(lang, 'B&C');
  assert.ok(titel.length <= TITEL_ZIELLAENGE, `${titel.length} Zeichen`);
  assert.ok(titel.endsWith('…'));
  assert.ok(lang.startsWith(titel.slice(0, -1)), 'die Kürzung darf den Anfang nicht verändern');
});

test('jede Stufe ist höchstens so lang wie erlaubt – auch genau auf der Grenze', () => {
  for (let laenge = 1; laenge <= 90; laenge++) {
    const titel = produktTitel('N'.repeat(laenge), 'Marke');
    assert.ok(titel.length <= TITEL_ZIELLAENGE, `Name mit ${laenge} Zeichen → Titel mit ${titel.length}`);
  }
});

// ── Kürzen ───────────────────────────────────────────────────────────────

test('kuerzenAufLaenge: Text innerhalb der Grenze bleibt unverändert', () => {
  assert.equal(kuerzenAufLaenge('kurz', 10), 'kurz');
  assert.equal(kuerzenAufLaenge('genau zehn', 10), 'genau zehn');
});

test('kuerzenAufLaenge: schneidet an der Wortgrenze und hängt „…" an', () => {
  const gekuerzt = kuerzenAufLaenge('ein Satz mit mehreren Wörtern', 20);
  assert.ok(gekuerzt.length <= 20);
  assert.ok(gekuerzt.endsWith('…'));
  assert.ok(!/\s…$/.test(gekuerzt), 'kein Leerzeichen vor dem „…"');
});

test('kuerzenAufLaenge: ohne brauchbare Wortgrenze wird hart geschnitten', () => {
  const gekuerzt = kuerzenAufLaenge('Zusammengeschriebenerwortbandwurm', 12);
  assert.equal(gekuerzt.length, 12);
  assert.ok(gekuerzt.endsWith('…'));
});

// ── Wächter über den echten Katalog ──────────────────────────────────────

const katalog = alleProduktSlugs().map((slug) => {
  const daten = ladeProduktseite(slug);
  assert.ok(daten, `Produkt ${slug} nicht ladbar`);
  return { slug, name: daten.produkt.name, marke: daten.produkt.brand, titel: produktTitel(daten.produkt.name, daten.produkt.brand) };
});

test('Katalog: es gibt Produkte (sonst prüfen die folgenden Wächter nichts)', () => {
  assert.ok(katalog.length > 100, `nur ${katalog.length} Produkte geladen`);
});

test('Katalog: kein Titel ist länger als die Trefferliste zeigt', () => {
  const zuLang = katalog.filter((p) => p.titel.length > TITEL_ZIELLAENGE).map((p) => `${p.slug}: ${p.titel.length}`);
  assert.deepEqual(zuLang, []);
});

test('Katalog: kein Titel wird mitten im Namen abgeschnitten', () => {
  const gekuerzt = katalog.filter((p) => p.titel.endsWith('…')).map((p) => `${p.slug}: ${p.titel}`);
  assert.deepEqual(gekuerzt, [], 'ein Produktname ist so lang geworden, dass er gekürzt werden müsste – Namen prüfen');
});

test('Katalog: jeder Titel enthält den vollständigen Produktnamen', () => {
  const fehlt = katalog.filter((p) => !p.titel.includes(p.name)).map((p) => p.slug);
  assert.deepEqual(fehlt, []);
});

test('Katalog: alle Titel sind verschieden (Google wertet doppelte Titel als Duplikat-Signal)', () => {
  const gesehen = new Map<string, string>();
  const doppelt: string[] = [];
  for (const p of katalog) {
    const vorher = gesehen.get(p.titel);
    if (vorher) doppelt.push(`„${p.titel}": ${vorher} und ${p.slug}`);
    else gesehen.set(p.titel, p.slug);
  }
  assert.deepEqual(doppelt, []);
});

test('Katalog: der überwiegende Teil der Titel trägt den Suchbegriff „bedrucken"', () => {
  const mit = katalog.filter((p) => p.titel.includes('bedrucken')).length;
  assert.ok(mit / katalog.length > 0.8, `nur ${mit} von ${katalog.length}`);
});
