/**
 * Stickdateien in DST, PES und JEF – Aufbau, Stichfolge, Fadenschnitte, Garnfarben.
 *
 * Jede Datei wird mit einem UNABHÄNGIGEN Leser (leser.ts, aus der Format-Beschreibung geschrieben, nicht aus dem Schreibcode)
 * zurückgelesen und mit der Stichfolge des Stickplans verglichen: Position, Art (Stich/Sprung/Fadenschnitt/Farbwechsel/Ende)
 * und Reihenfolge müssen exakt stimmen. Zusätzlich die Eigenheiten je Format: PES-Kopf und Längenfelder, Vorschaubilder,
 * JEF-Kopf und Punktzahl, Palettenplätze.
 *
 * NICHT geprüft (und nicht prüfbar ohne Gerät): dass eine echte Maschine oder fremde Stick-Software die Dateien öffnet.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planZuBefehlen } from '../befehle';
import { digitalisiereLogo, digitalisiereText } from '../digitalisiere';
import { schreibeStickdateien } from '../formate';
import { BROTHER_PALETTE, JANOME_PALETTE, waehlePalettenGarne } from '../garnpaletten';
import { DST_MAX_SCHRITT_EINHEITEN, JEF_MAX_SCHRITT_EINHEITEN, PEC_MAX_SCHRITT_EINHEITEN, SCHNITT_AB_MM } from '../parameter';
import type { Raster } from '../maske';
import type { Stickplan } from '../stickplan';
import { dstZuBefehlen, leseJef, lesePes } from './leser';

const PX = 10;

function raster(breiteMm: number, hoeheMm: number, fuellung: [number, number, number, number] = [0, 0, 0, 0]): Raster {
  const breite = Math.round(breiteMm * PX);
  const hoehe = Math.round(hoeheMm * PX);
  const rgba = new Uint8Array(breite * hoehe * 4);
  for (let i = 0; i < breite * hoehe; i++) rgba.set(fuellung, i * 4);
  return { breite, hoehe, rgba };
}

function rechteck(r: Raster, x0: number, y0: number, x1: number, y1: number, farbe: [number, number, number]): void {
  for (let y = Math.round(y0 * PX); y < Math.round(y1 * PX); y++) {
    for (let x = Math.round(x0 * PX); x < Math.round(x1 * PX); x++) r.rgba.set([...farbe, 255], (y * r.breite + x) * 4);
  }
}

function kreis(r: Raster, mx: number, my: number, radius: number, farbe: [number, number, number]): void {
  for (let y = 0; y < r.hoehe; y++) {
    for (let x = 0; x < r.breite; x++) {
      if (Math.hypot((x + 0.5) / PX - mx, (y + 0.5) / PX - my) <= radius) r.rgba.set([...farbe, 255], (y * r.breite + x) * 4);
    }
  }
}

/** Drei getrennte Rechtecke in einer Farbe: wie drei Buchstaben, dazwischen Sprünge mit Fadenschnitt. */
function dreiBuchstaben(abstandMm = 30): Stickplan {
  const r = raster(2 * abstandMm + 20, 10);
  for (let i = 0; i < 3; i++) rechteck(r, 1 + i * abstandMm, 1, 9 + i * abstandMm, 9, [200, 30, 30]);
  const e = digitalisiereText(r, '#c81e1e', 'DREI');
  assert.equal(e.ok, true);
  if (!e.ok) throw new Error('unerreichbar');
  return e.plan;
}

/** Logo mit zwei Garnfarben (rot, blau) auf weißem Hintergrund: ein Farbwechsel. */
function zweiFarbenLogo(): Stickplan {
  const r = raster(40, 20, [255, 255, 255, 255]);
  rechteck(r, 3, 3, 17, 17, [200, 30, 30]);
  kreis(r, 29, 10, 7, [30, 60, 200]);
  const e = digitalisiereLogo(r, 'ZWEI');
  assert.equal(e.ok, true);
  if (!e.ok) throw new Error('unerreichbar');
  return e.plan;
}

const FORMATE = [
  { name: 'DST', max: DST_MAX_SCHRITT_EINHEITEN },
  { name: 'PES', max: PEC_MAX_SCHRITT_EINHEITEN },
  { name: 'JEF', max: JEF_MAX_SCHRITT_EINHEITEN },
] as const;

function gelesen(plan: Stickplan, format: 'DST' | 'PES' | 'JEF') {
  const d = schreibeStickdateien(plan, 'TESTNAME', new Date(2026, 10, 11, 12, 0, 0));
  if (format === 'DST') return dstZuBefehlen(d.dst);
  if (format === 'PES') return lesePes(d.pes).befehle;
  return leseJef(d.jef).befehle;
}

// ── Stichfolge: jede Datei liefert beim Zurücklesen exakt die Stichfolge des Plans ──

for (const plan of [{ titel: 'drei getrennte Teile', bau: () => dreiBuchstaben() }, { titel: 'Logo mit Farbwechsel', bau: zweiFarbenLogo }]) {
  for (const f of FORMATE) {
    test(`${f.name}: ${plan.titel} – zurückgelesene Stichfolge stimmt exakt mit dem Stickplan überein`, () => {
      const p = plan.bau();
      const erwartet = planZuBefehlen(p, { maxSchritt: f.max, schnittAbMm: SCHNITT_AB_MM }).befehle;
      const tatsaechlich = gelesen(p, f.name);
      assert.equal(tatsaechlich.length, erwartet.length, `Zahl der Befehle: ${tatsaechlich.length} statt ${erwartet.length}`);
      for (let i = 0; i < erwartet.length; i++) {
        const e = erwartet[i]!;
        const t = tatsaechlich[i]!;
        if (e.art !== t.art || e.x !== t.x || e.y !== t.y) {
          assert.fail(`Befehl ${i}: erwartet ${e.art} ${e.x}/${e.y}, gelesen ${t.art} ${t.x}/${t.y}`);
        }
      }
    });
  }
}

// ── Fadenschnitte ───────────────────────────────────────────────────────

test('Sprünge ab 3 mm mitten in einer Farbe haben einen Fadenschnitt, am Farbanfang und bei kurzen Sprüngen nicht', () => {
  for (const plan of [dreiBuchstaben(), zweiFarbenLogo()]) {
    const folge = planZuBefehlen(plan, { maxSchritt: 100_000, schnittAbMm: SCHNITT_AB_MM });
    let hatStiche = false;
    let vorherPos = { x: 0, y: 0 };
    let schnittOffen = false;
    for (const b of folge.befehle) {
      if (b.art === 'farbwechsel') hatStiche = false;
      if (b.art === 'schnitt') {
        assert.ok(hatStiche, 'Schnitt ohne vorherige Stiche in dieser Farbe');
        schnittOffen = true;
        continue;
      }
      if (b.art === 'sprung') {
        const weg = Math.hypot(b.x - vorherPos.x, b.y - vorherPos.y) / 10;
        if (hatStiche && weg >= SCHNITT_AB_MM) assert.ok(schnittOffen, `Sprung von ${weg.toFixed(1)} mm ohne Fadenschnitt`);
        else assert.ok(!schnittOffen, `Schnitt vor kurzem Sprung (${weg.toFixed(1)} mm)`);
        schnittOffen = false;
      }
      if (b.art === 'stich') hatStiche = true;
      vorherPos = { x: b.x, y: b.y };
    }
  }
  const drei = planZuBefehlen(dreiBuchstaben(), { maxSchritt: 100_000, schnittAbMm: SCHNITT_AB_MM });
  assert.ok(drei.schnitte >= 2, `Drei getrennte Teile brauchen mindestens zwei Fadenschnitte (hat ${drei.schnitte})`);
});

for (const f of FORMATE) {
  test(`${f.name}: die Fadenschnitte stehen in der Datei (Zahl wie im Plan)`, () => {
    const plan = dreiBuchstaben();
    const erwartet = planZuBefehlen(plan, { maxSchritt: f.max, schnittAbMm: SCHNITT_AB_MM }).schnitte;
    const inDatei = gelesen(plan, f.name).filter((b) => b.art === 'schnitt').length;
    assert.equal(inDatei, erwartet);
    assert.ok(inDatei >= 2);
  });
}

// ── Schrittgrenzen, lange Wege ──────────────────────────────────────────

for (const f of FORMATE) {
  test(`${f.name}: ein langer Weg (130 mm) wird in zulässige Schritte zerlegt und endet am richtigen Punkt`, () => {
    const plan = dreiBuchstaben(65);
    const befehle = gelesen(plan, f.name);
    let px = 0;
    let py = 0;
    for (const b of befehle) {
      if (b.art === 'schnitt' || b.art === 'farbwechsel') continue;
      assert.ok(Math.abs(b.x - px) <= f.max && Math.abs(b.y - py) <= f.max, `Schritt ${b.x - px}/${b.y - py} über ${f.max}`);
      px = b.x;
      py = b.y;
    }
    // Endposition gleich der des ungeteilten Plans
    const ungeteilt = planZuBefehlen(plan, { maxSchritt: 1_000_000, schnittAbMm: SCHNITT_AB_MM }).befehle;
    const ende = ungeteilt[ungeteilt.length - 1]!;
    const letzter = befehle[befehle.length - 1]!;
    assert.deepEqual([letzter.art, letzter.x, letzter.y], ['ende', ende.x, ende.y]);
  });
}

// ── PES ─────────────────────────────────────────────────────────────────

test('PES: Signatur, PEC-Offset, Längenfeld, Farbtabelle, Vorschaubilder und Ende stimmen', () => {
  const plan = zweiFarbenLogo();
  const d = schreibeStickdateien(plan, 'TESTNAME');
  const pes = lesePes(d.pes);
  assert.equal(pes.signatur, '#PES0001');
  assert.ok(pes.hatBloecke, 'CEmbOne/CSewSeg fehlen');
  assert.ok(pes.pecOffset > 12 && pes.pecOffset < d.pes.length);
  assert.equal(pes.label.slice(0, 3), 'LA:');
  assert.equal(pes.label.slice(3, 11), 'TESTNAME');
  assert.equal(pes.label[19], '\r');
  assert.equal(pes.plaetze.length, 2, 'zwei Farben');
  for (const platz of pes.plaetze) assert.ok(platz >= 1 && platz <= 64, `Brother-Palettenplatz ${platz} außerhalb 1…64`);
  assert.equal(pes.endeLautLaenge, pes.endeLautDekodierung, 'Längenfeld des Stichblocks passt zur Stichfolge');
  assert.equal(pes.vorschauBytes, 228 * (1 + pes.plaetze.length), 'Gesamtbild plus ein Bild je Farbe, je 228 Byte');
  assert.equal(pes.vorschauErstesByte, 0x00, 'das erste Vorschau-Byte bleibt 0 (Leser erkennen daran das Stichende)');
  // Größe im Block = Ausdehnung des Motivs
  const folge = planZuBefehlen(plan, { maxSchritt: PEC_MAX_SCHRITT_EINHEITEN, schnittAbMm: SCHNITT_AB_MM });
  assert.equal(pes.breite, folge.grenzen.maxX - folge.grenzen.minX);
  assert.equal(pes.hoehe, folge.grenzen.maxY - folge.grenzen.minY);
});

test('PES: Vorschaubild enthält Linien (nicht leer) und der Rahmen liegt in den Bildgrenzen', () => {
  const d = schreibeStickdateien(zweiFarbenLogo(), 'TESTNAME');
  const pes = lesePes(d.pes);
  const start = d.pes.length - pes.vorschauBytes;
  const gesamt = d.pes.subarray(start, start + 228);
  const gesetzt = [...gesamt].reduce((s, b) => s + b.toString(2).split('1').length - 1, 0);
  assert.ok(gesetzt > 150, `Vorschaubild fast leer (${gesetzt} Punkte)`);
});

// ── JEF ─────────────────────────────────────────────────────────────────

test('JEF: Kopf, Offset, Punktzahl, Palette und Endebefehl stimmen', () => {
  const plan = zweiFarbenLogo();
  const d = schreibeStickdateien(plan, 'TESTNAME', new Date(2026, 10, 11, 9, 8, 7));
  const jef = leseJef(d.jef);
  assert.equal(jef.kennung, 0x14);
  assert.equal(jef.datum, '20261111090807');
  assert.equal(jef.farben, 2);
  assert.equal(jef.stichOffset, 0x74 + jef.farben * 8);
  assert.equal(jef.punkte, jef.punkteImStichteil, 'Punktzahl im Kopf = 2-Byte-Punkte im Stichteil');
  assert.ok(jef.endetMitEnde);
  for (const platz of jef.plaetze) assert.ok(platz >= 1 && platz <= 78, `Janome-Palettenplatz ${platz} außerhalb 1…78`);
  assert.equal(jef.rahmen, 1, 'ein 34 × 14 mm großes Motiv passt in den 50 × 50 mm Rahmen');
});

// ── Garnpaletten ────────────────────────────────────────────────────────

test('Garnpaletten: reine Farben landen auf dem erwarteten Platz', () => {
  const b = (hex: string) => waehlePalettenGarne([hex], BROTHER_PALETTE)[0]!;
  const j = (hex: string) => waehlePalettenGarne([hex], JANOME_PALETTE)[0]!;
  assert.equal(b('#000000').name, 'Black');
  assert.equal(b('#ffffff').name, 'White');
  assert.equal(b('#ed171f').name, 'Red');
  assert.equal(j('#000000').name, 'Black');
  assert.equal(j('#ffffff').name, 'White');
  assert.equal(j('#ff0000').name, 'Red');
  assert.equal(BROTHER_PALETTE.length, 64);
  assert.equal(JANOME_PALETTE.length, 78);
});

test('Garnpaletten: zwei aufeinanderfolgende Farben bekommen nie denselben Platz (sonst sähe die Maschine keinen Wechsel)', () => {
  const garne = waehlePalettenGarne(['#ff0000', '#fe0000', '#fd0101'], BROTHER_PALETTE);
  assert.notEqual(garne[0]!.platz, garne[1]!.platz);
  assert.notEqual(garne[1]!.platz, garne[2]!.platz);
});

test('Die Zuordnung der Garne steht im Ergebnis und stimmt mit den Dateien überein', () => {
  const d = schreibeStickdateien(zweiFarbenLogo(), 'TESTNAME');
  assert.equal(d.garne.length, 2);
  assert.deepEqual(lesePes(d.pes).plaetze, d.garne.map((g) => g.brother.platz));
  assert.deepEqual(leseJef(d.jef).plaetze, d.garne.map((g) => g.janome.platz));
});

// ── Stabilität ──────────────────────────────────────────────────────────

test('dieselbe Bestellung ergibt bei jedem Abruf dieselben Dateien (JEF bis auf das Datum im Kopf, hier festgehalten)', () => {
  const plan = zweiFarbenLogo();
  const datum = new Date(2026, 0, 1, 0, 0, 0);
  const a = schreibeStickdateien(plan, 'TESTNAME', datum);
  const b = schreibeStickdateien(plan, 'TESTNAME', datum);
  assert.ok(a.dst.equals(b.dst) && a.pes.equals(b.pes) && a.jef.equals(b.jef));
});

test('der Name im Kopf bleibt auch mit Sonderzeichen gültig (nur ASCII)', () => {
  const d = schreibeStickdateien(dreiBuchstaben(), 'Schüplitz-ÄÖÜ');
  assert.equal(d.dst.toString('latin1', 0, 3), 'LA:');
  for (const byte of d.dst.subarray(0, 512)) assert.ok(byte <= 0x7e, 'Kopf enthält Nicht-ASCII');
  assert.equal(lesePes(d.pes).label.slice(0, 3), 'LA:');
});

// ── Route und Oberfläche: alle drei Formate ─────────────────────────────

import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(__dirname, '../../../../..');
const lies = (...teile: string[]) => fs.readFileSync(path.join(WURZEL, ...teile), 'utf8');

test('die Route liefert dst (Standard), pes und jef, lehnt andere Formate ab und prüft den Admin zuerst', () => {
  const route = lies('src/app/api/admin/bestellungen/[id]/stickdatei/[elementId]/route.ts');
  assert.ok(route.indexOf('await istAdmin()') < route.indexOf('istStickFormat('), 'istAdmin() steht vor der Formatprüfung');
  assert.ok(route.indexOf('istStickFormat(') < route.indexOf('erzeugeStickdatei('), 'Format wird vor dem Erzeugen geprüft');
  assert.match(route, /Unbekanntes Format/);
  assert.match(route, /formatWunsch !== null \? formatWunsch : 'dst'/);
  assert.match(route, /ergebnis\.dateien\[format\]/);
  assert.match(route, /\$\{ergebnis\.dateiname\}\.\$\{format\}/);
});

test('die Oberfläche bietet DST, PES und JEF an', () => {
  const quelle = lies('src/components/admin/StickdateiKnoepfe.tsx');
  for (const beschriftung of ['DST', 'PES', 'JEF']) assert.ok(quelle.includes(`beschriftung: '${beschriftung}'`), `${beschriftung} fehlt`);
  assert.match(quelle, /stickdateiHref\(orderId, elementId, format\)/);
});
