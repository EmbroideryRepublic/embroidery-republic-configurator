/**
 * Stickdatei (DST) – Format, Digitalisierung und Grenzen.
 *
 * Gesichert wird, was dem Betreiber zugesagt ist: Die Datei ist ein gültiges Tajima-DST (Kopf, Stichkodierung, Ende), jeder
 * zulässige Versatz überlebt Schreiben und Lesen, die Füllung bleibt in der Form, Logos werden von ihrem einfarbigen
 * Hintergrund befreit und in Garnfarben zerlegt, zu große Motive werden abgelehnt statt falsch erzeugt, und die
 * Admin-Route ist nur für angemeldete Admins erreichbar und nur für Stickerei-Positionen verlinkt.
 *
 * Der DST-Leser (dekodiereEintrag/leseDst) rechnet unabhängig vom Schreiber: Summe der gesetzten Stellenwerte statt
 * derselben Tabelle in Gegenrichtung.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { dekodiereEintrag, kodiereEintrag, leseDst } from '../dst';
import { digitalisiereLogo, digitalisiereText } from '../digitalisiere';
import { rastereLogo } from '@/lib/admin/stickdatei';
import type { Raster } from '../maske';

const PX = 10;

function leeresRaster(breiteMm: number, hoeheMm: number, fuellung: [number, number, number, number] = [0, 0, 0, 0]): Raster {
  const breite = Math.round(breiteMm * PX);
  const hoehe = Math.round(hoeheMm * PX);
  const rgba = new Uint8Array(breite * hoehe * 4);
  for (let i = 0; i < breite * hoehe; i++) rgba.set(fuellung, i * 4);
  return { breite, hoehe, rgba };
}

function fuelleRechteck(r: Raster, x0: number, y0: number, x1: number, y1: number, farbe: [number, number, number]): void {
  for (let y = Math.round(y0 * PX); y < Math.round(y1 * PX); y++) {
    for (let x = Math.round(x0 * PX); x < Math.round(x1 * PX); x++) r.rgba.set([...farbe, 255], (y * r.breite + x) * 4);
  }
}

function fuelleKreis(r: Raster, mx: number, my: number, radius: number, farbe: [number, number, number]): void {
  for (let y = 0; y < r.hoehe; y++) {
    for (let x = 0; x < r.breite; x++) {
      if (Math.hypot((x + 0.5) / PX - mx, (y + 0.5) / PX - my) <= radius) r.rgba.set([...farbe, 255], (y * r.breite + x) * 4);
    }
  }
}

// ── DST-Format ──────────────────────────────────────────────────────────

test('jeder Versatz von −121…+121 je Achse überlebt Kodieren und Dekodieren (Stich, Sprung, Farbwechsel)', () => {
  for (const art of ['stich', 'sprung', 'farbwechsel'] as const) {
    for (let dx = -121; dx <= 121; dx++) {
      for (let dy = -121; dy <= 121; dy++) {
        const [b0, b1, b2] = kodiereEintrag(dx, dy, art);
        const zurueck = dekodiereEintrag(b0, b1, b2);
        if (zurueck.dx !== dx || zurueck.dy !== dy || zurueck.art !== art) {
          assert.fail(`${art} ${dx}/${dy} wurde zu ${zurueck.art} ${zurueck.dx}/${zurueck.dy}`);
        }
      }
    }
  }
});

test('ein Versatz über ±121 wird abgelehnt statt falsch geschrieben', () => {
  assert.throws(() => kodiereEintrag(122, 0, 'stich'));
  assert.throws(() => kodiereEintrag(0, -122, 'sprung'));
});

test('das Dateiende ist 00 00 F3', () => {
  assert.deepEqual(kodiereEintrag(0, 0, 'ende'), [0x00, 0x00, 0xf3]);
});

test('die Datei hat einen 512-Byte-Kopf mit Name, Stichzahl, Farbwechseln und Ausdehnung; die Einträge enden mit der Endemarke', () => {
  const r = leeresRaster(20, 8);
  fuelleRechteck(r, 1, 1, 19, 7, [30, 60, 200]);
  const ergebnis = digitalisiereText(r, '#1e3cc8', 'KOPFTEST');
  assert.equal(ergebnis.ok, true);
  if (!ergebnis.ok) return;
  const dst = ergebnis.dst;
  assert.equal(dst.toString('latin1', 0, 3), 'LA:');
  assert.equal(dst[511 - 0] === 0x20 || dst.indexOf(0x1a) < 512, true, 'Das Kopfende (0x1A) liegt innerhalb der 512 Byte');
  assert.equal((dst.length - 512) % 3, 0, 'Nach dem Kopf folgen nur 3-Byte-Einträge');
  assert.deepEqual([...dst.subarray(dst.length - 3)], [0x00, 0x00, 0xf3]);

  const gelesen = leseDst(dst);
  assert.equal(gelesen.name, 'KOPFTEST');
  const stiche = gelesen.eintraege.filter((e) => e.art !== 'ende').length;
  assert.equal(gelesen.stichzahlKopf, stiche, 'ST im Kopf entspricht der Zahl der Einträge');
  assert.equal(gelesen.farbwechselKopf, 0);
  // Ausdehnung im Kopf = tatsächliche Ausdehnung der Einträge
  const xs = gelesen.eintraege.map((e) => e.x);
  const ys = gelesen.eintraege.map((e) => e.y);
  assert.equal(gelesen.kopf.plusX, Math.max(0, ...xs));
  assert.equal(gelesen.kopf.minusX, -Math.min(0, ...xs));
  assert.equal(gelesen.kopf.plusY, Math.max(0, ...ys));
  assert.equal(gelesen.kopf.minusY, -Math.min(0, ...ys));
});

// ── Digitalisierung ─────────────────────────────────────────────────────

test('eine gefüllte Fläche bleibt in ihrer Form: alle Stiche liegen innerhalb der Fläche plus Zugkompensation', () => {
  const r = leeresRaster(24, 14);
  fuelleRechteck(r, 2, 2, 22, 12, [200, 30, 30]); // 20 × 10 mm
  const ergebnis = digitalisiereText(r, '#c81e1e', 'FORM');
  assert.equal(ergebnis.ok, true);
  if (!ergebnis.ok) return;
  assert.ok(Math.abs(ergebnis.plan.breiteMm - 20) < 1 && Math.abs(ergebnis.plan.hoeheMm - 10) < 1, 'Größe entspricht der Vorlage');
  const gelesen = leseDst(ergebnis.dst);
  const toleranz = 10 * (0.15 + 0.35); // Zugkompensation + Rundung, in 0,1 mm
  for (const e of gelesen.eintraege) {
    if (e.art === 'ende') continue;
    assert.ok(Math.abs(e.x) <= 100 + toleranz && Math.abs(e.y) <= 50 + toleranz, `Eintrag ${e.x}/${e.y} liegt außerhalb der Fläche`);
  }
  // Dichte: 200 mm² Fläche bei 0,4 mm Reihenabstand ≈ 500 mm Faden → deutlich über 100 Stiche
  assert.ok(ergebnis.plan.stichzahl > 100, `Füllung zu dünn: ${ergebnis.plan.stichzahl} Stiche`);
  // Deckung: Jede 1-mm-Zelle im Inneren der Fläche wird von mindestens einem Stich (der Strecke, nicht nur dem Einstich) berührt
  const belegt = new Set<string>();
  const merke = (x: number, y: number) => belegt.add(`${Math.floor(x / 10)}/${Math.floor(y / 10)}`);
  let vorher: { x: number; y: number } | null = null;
  for (const e of gelesen.eintraege) {
    if (e.art === 'stich') {
      if (vorher) {
        const schritte = Math.max(1, Math.ceil(Math.hypot(e.x - vorher.x, e.y - vorher.y) / 2));
        for (let i = 0; i <= schritte; i++) merke(vorher.x + ((e.x - vorher.x) * i) / schritte, vorher.y + ((e.y - vorher.y) * i) / schritte);
      } else merke(e.x, e.y);
    }
    vorher = e.art === 'stich' ? { x: e.x, y: e.y } : null;
  }
  let leer = 0;
  for (let zx = -9; zx < 9; zx++) for (let zy = -4; zy < 4; zy++) if (!belegt.has(`${zx}/${zy}`)) leer++;
  assert.equal(leer, 0, `${leer} Zellen im Inneren der Fläche ohne Stich`);
});

test('ein Logo mit weißem Hintergrund und zwei Farben: Hintergrund wird nicht gestickt, zwei Garnfarben, Farbwechsel in der Datei', () => {
  const r = leeresRaster(40, 20, [255, 255, 255, 255]);
  fuelleRechteck(r, 3, 3, 17, 17, [200, 30, 30]);
  fuelleKreis(r, 29, 10, 7, [30, 60, 200]);
  const ergebnis = digitalisiereLogo(r, 'LOGOTEST');
  assert.equal(ergebnis.ok, true);
  if (!ergebnis.ok) return;
  assert.equal(ergebnis.plan.bloecke.length, 2, 'zwei Garnfarben');
  assert.ok(ergebnis.hinweise.some((h) => h.includes('Hintergrund')), 'Hinweis auf entfernten Hintergrund');
  // Größe = nur die Motive (3…36 mm), nicht das ganze weiße Bild (40 mm)
  assert.ok(ergebnis.plan.breiteMm < 38 && ergebnis.plan.breiteMm > 32, `Breite ${ergebnis.plan.breiteMm}`);
  const gelesen = leseDst(ergebnis.dst);
  assert.equal(gelesen.farbwechselKopf, 1);
  assert.equal(gelesen.eintraege.filter((e) => e.art === 'farbwechsel').length, 1);
  const farben = ergebnis.plan.bloecke.map((b) => b.hex.toLowerCase()).sort();
  const rot = farben.find((f) => parseInt(f.slice(1, 3), 16) > 150);
  const blau = farben.find((f) => parseInt(f.slice(5, 7), 16) > 150);
  assert.ok(rot && blau, `Rot und Blau erwartet, bekommen ${farben.join(', ')}`);
});

test('ein transparentes Logo braucht keine Hintergrundentfernung und meldet sie nicht', () => {
  const r = leeresRaster(20, 20);
  fuelleKreis(r, 10, 10, 8, [20, 120, 60]);
  const ergebnis = digitalisiereLogo(r, 'TRANSPARENT');
  assert.equal(ergebnis.ok, true);
  if (!ergebnis.ok) return;
  assert.equal(ergebnis.plan.bloecke.length, 1);
  assert.ok(!ergebnis.hinweise.some((h) => h.includes('Hintergrund')));
});

test('ein leeres Raster wird mit Grund abgelehnt', () => {
  const ergebnis = digitalisiereText(leeresRaster(10, 10), '#000000', 'LEER');
  assert.equal(ergebnis.ok, false);
  if (!ergebnis.ok) assert.match(ergebnis.grund, /nichts Sichtbares/);
});

test('ein Motiv über 300 mm wird abgelehnt statt falsch erzeugt', () => {
  const r = leeresRaster(320, 10);
  fuelleRechteck(r, 0, 0, 320, 10, [0, 0, 0]);
  const ergebnis = digitalisiereText(r, '#000000', 'ZUGROSS');
  assert.equal(ergebnis.ok, false);
  if (!ergebnis.ok) assert.match(ergebnis.grund, /zu groß/);
});

test('sehr dünne Linien werden gemeldet, nicht stillschweigend gestickt', () => {
  const r = leeresRaster(40, 10);
  fuelleRechteck(r, 2, 4.6, 38, 5.2, [0, 0, 0]); // 0,6 mm dünn
  const ergebnis = digitalisiereText(r, '#000000', 'DUENN');
  assert.equal(ergebnis.ok, true);
  if (!ergebnis.ok) return;
  assert.ok(ergebnis.hinweise.some((h) => h.includes('dünner')), 'Hinweis auf dünne Linien fehlt');
});

// ── Logo-Raster ─────────────────────────────────────────────────────────

function pngAusSvg(svg: string): Buffer {
  return Buffer.from(new Resvg(svg).render().asPng());
}

test('rastereLogo: Größe folgt der gewählten Breite × Höhe (10 Bildpunkte je mm)', () => {
  const png = pngAusSvg('<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"><rect width="50" height="50" fill="#c81e1e"/></svg>');
  const r = rastereLogo(png, 3, 1.5, 0);
  assert.ok(!('fehler' in r));
  if ('fehler' in r) return;
  assert.equal(r.breite, 300);
  assert.equal(r.hoehe, 150);
  // Mitte ist deckend rot
  const mitte = ((75 * r.breite) + 150) * 4;
  assert.deepEqual([r.rgba[mitte], r.rgba[mitte + 1], r.rgba[mitte + 2], r.rgba[mitte + 3]], [200, 30, 30, 255]);
});

test('rastereLogo: 90° Drehung vertauscht Breite und Höhe', () => {
  const png = pngAusSvg('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20"><rect width="40" height="20" fill="#000"/></svg>');
  const r = rastereLogo(png, 4, 2, 90);
  assert.ok(!('fehler' in r));
  if ('fehler' in r) return;
  assert.ok(Math.abs(r.breite - 200) <= 2 && Math.abs(r.hoehe - 400) <= 2, `${r.breite}×${r.hoehe}`);
});

test('rastereLogo: unbekanntes Bildformat wird mit Grund abgelehnt', () => {
  const r = rastereLogo(Buffer.from('kein bild'), 2, 2, 0);
  assert.ok('fehler' in r);
});

// ── Route und Oberfläche ────────────────────────────────────────────────

const WURZEL = path.resolve(__dirname, '../../../../..');
const lies = (...teile: string[]) => fs.readFileSync(path.join(WURZEL, ...teile), 'utf8');

test('die Stickdatei-Route prüft istAdmin() vor jedem Laden und sichert die Pfadkomponenten', () => {
  const route = lies('src/app/api/admin/bestellungen/[id]/stickdatei/[elementId]/route.ts');
  const admin = route.indexOf('await istAdmin()');
  const laden = route.indexOf('erzeugeStickdatei(');
  assert.ok(admin > 0 && laden > admin, 'istAdmin() steht vor dem Erzeugen');
  assert.match(route, /istSicherePfadkomponente\(params\.id\)/);
  assert.match(route, /istSicherePfadkomponente\(params\.elementId\)/);
  assert.match(route, /status: 401/);
});

test('die Stickdatei-Knöpfe erscheinen nur bei Stickerei-Positionen', () => {
  const quelle = lies('src/components/admin/ProductionPreview.tsx');
  assert.match(quelle, /gestickt=\{item\.printMethod === 'embroidery'\}/);
  assert.match(quelle, /\{gestickt && <StickdateiKnoepfe/);
});
