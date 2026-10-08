/**
 * Besucherzähler – Auswertung (reine Rechnung) und Anzeige-Hilfen.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { baueStatistik, tagPlus, type RohStatistik } from '../statistik';
import { achsenSkala, anteilText, kurzesDatum, langesDatum, seitenName } from '../anzeige';

const LEER: RohStatistik = { tage: [], seiten: [], quellen: [] };

// ── Datumsrechnung ──────────────────────────────────────────────────────

test('tagPlus: rechnet über Monats-, Jahres- und Schaltjahrgrenzen', () => {
  assert.equal(tagPlus('2026-10-08', -29), '2026-09-09');
  assert.equal(tagPlus('2026-03-01', -1), '2026-02-28');
  assert.equal(tagPlus('2028-03-01', -1), '2028-02-29');
  assert.equal(tagPlus('2026-12-31', 1), '2027-01-01');
  assert.equal(tagPlus('2026-01-01', -1), '2025-12-31');
  assert.equal(tagPlus('2026-10-08', 0), '2026-10-08');
});

test('tagPlus: die Zeitumstellung verschiebt keinen Tag', () => {
  // Umstellung auf Winterzeit 2026-10-25, auf Sommerzeit 2026-03-29.
  assert.equal(tagPlus('2026-10-26', -1), '2026-10-25');
  assert.equal(tagPlus('2026-10-25', -1), '2026-10-24');
  assert.equal(tagPlus('2026-03-30', -1), '2026-03-29');
  assert.equal(tagPlus('2026-03-29', -1), '2026-03-28');
});

// ── Auswertung ──────────────────────────────────────────────────────────

test('baueStatistik: ohne Daten – lückenlose Tage mit 0, keine erfundenen Werte', () => {
  const s = baueStatistik(LEER, '2026-10-08');
  assert.equal(s.tage.length, 30);
  assert.equal(s.tage[0]!.tag, '2026-09-09');
  assert.equal(s.tage[29]!.tag, '2026-10-08');
  assert.ok(s.tage.every((t) => t.besucher === 0 && t.aufrufe === 0));
  assert.deepEqual(s.letzte7, { besucher: 0, aufrufe: 0 });
  assert.deepEqual(s.letzte30, { besucher: 0, aufrufe: 0 });
  assert.equal(s.seitenProBesuch, null);
  assert.equal(s.ersterTagMitDaten, null);
});

test('baueStatistik: heute und gestern sind die letzten beiden Tage', () => {
  const s = baueStatistik(
    {
      ...LEER,
      tage: [
        { tag: '2026-10-07', besucher: 5, aufrufe: 12 },
        { tag: '2026-10-08', besucher: 3, aufrufe: 4 },
      ],
    },
    '2026-10-08'
  );
  assert.deepEqual(s.heute, { tag: '2026-10-08', besucher: 3, aufrufe: 4 });
  assert.deepEqual(s.gestern, { tag: '2026-10-07', besucher: 5, aufrufe: 12 });
});

test('baueStatistik: Lücken dazwischen werden mit 0 gefüllt, Reihenfolge ist aufsteigend', () => {
  const s = baueStatistik(
    {
      ...LEER,
      tage: [
        { tag: '2026-10-08', besucher: 2, aufrufe: 2 },
        { tag: '2026-10-04', besucher: 1, aufrufe: 3 },
      ],
    },
    '2026-10-08'
  );
  const letzteFuenf = s.tage.slice(-5).map((t) => [t.tag, t.besucher]);
  assert.deepEqual(letzteFuenf, [
    ['2026-10-04', 1],
    ['2026-10-05', 0],
    ['2026-10-06', 0],
    ['2026-10-07', 0],
    ['2026-10-08', 2],
  ]);
  assert.deepEqual(
    s.tage.map((t) => t.tag),
    [...s.tage.map((t) => t.tag)].sort()
  );
});

test('baueStatistik: 7- und 30-Tage-Summen zählen genau die richtigen Tage', () => {
  const tage = [];
  for (let i = 0; i < 30; i++) tage.push({ tag: tagPlus('2026-10-08', -i), besucher: 1, aufrufe: 2 });
  const s = baueStatistik({ ...LEER, tage }, '2026-10-08');
  assert.deepEqual(s.letzte7, { besucher: 7, aufrufe: 14 });
  assert.deepEqual(s.letzte30, { besucher: 30, aufrufe: 60 });
});

test('baueStatistik: Tage außerhalb des Fensters fließen nicht in die Summen ein', () => {
  const s = baueStatistik(
    {
      ...LEER,
      tage: [
        { tag: '2026-09-08', besucher: 99, aufrufe: 99 }, // 30 Tage her – schon außerhalb
        { tag: '2026-09-09', besucher: 1, aufrufe: 1 }, // ältester Tag im Fenster
        { tag: '2026-10-09', besucher: 50, aufrufe: 50 }, // Zukunft – gehört nicht dazu
      ],
    },
    '2026-10-08'
  );
  assert.deepEqual(s.letzte30, { besucher: 1, aufrufe: 1 });
  assert.equal(s.ersterTagMitDaten, '2026-09-09');
});

test('baueStatistik: Seiten je Besuch – auf eine Nachkommastelle gerundet', () => {
  const s = baueStatistik(
    { ...LEER, tage: [{ tag: '2026-10-08', besucher: 3, aufrufe: 10 }] },
    '2026-10-08'
  );
  assert.equal(s.seitenProBesuch, 3.3);
});

test('baueStatistik: Seiten und Quellen werden unverändert durchgereicht', () => {
  const seiten = [{ pfad: '/', aufrufe: 10 }];
  const quellen = [{ quelle: 'instagram', besucher: 4, aufrufe: 9 }];
  const s = baueStatistik({ tage: [], seiten, quellen }, '2026-10-08');
  assert.deepEqual(s.seiten, seiten);
  assert.deepEqual(s.quellen, quellen);
});

test('baueStatistik: eine kürzere Anzeigedauer wird eingehalten', () => {
  const s = baueStatistik(LEER, '2026-10-08', 7);
  assert.equal(s.tage.length, 7);
  assert.equal(s.tage[0]!.tag, '2026-10-02');
});

// ── Achse ───────────────────────────────────────────────────────────────

test('achsenSkala: feste Beispiele', () => {
  assert.deepEqual(achsenSkala(0), { obergrenze: 1, schritt: 1, marken: [0, 1] });
  assert.deepEqual(achsenSkala(3), { obergrenze: 3, schritt: 1, marken: [0, 1, 2, 3] });
  assert.deepEqual(achsenSkala(7), { obergrenze: 8, schritt: 2, marken: [0, 2, 4, 6, 8] });
  assert.deepEqual(achsenSkala(9), { obergrenze: 10, schritt: 5, marken: [0, 5, 10] });
  assert.deepEqual(achsenSkala(12), { obergrenze: 15, schritt: 5, marken: [0, 5, 10, 15] });
  assert.deepEqual(achsenSkala(100), { obergrenze: 100, schritt: 50, marken: [0, 50, 100] });
});

test('achsenSkala: für jeden Höchstwert – Obergrenze reicht, Marken sind ganz, gleichmäßig und höchstens fünf', () => {
  for (const wert of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 19, 20, 21, 33, 60, 99, 100, 101, 250, 999, 1234, 98765]) {
    const s = achsenSkala(wert);
    assert.ok(s.obergrenze >= wert, `Obergrenze ${s.obergrenze} < ${wert}`);
    assert.ok(s.marken.length >= 2 && s.marken.length <= 5, `${wert}: ${s.marken.length} Marken`);
    assert.equal(s.marken[0], 0);
    assert.equal(s.marken[s.marken.length - 1], s.obergrenze);
    assert.ok(s.marken.every((m) => Number.isInteger(m)), `${wert}: nicht ganzzahlig`);
    s.marken.forEach((m, i) => assert.equal(m, i * s.schritt));
    // Die Achse darf den Wert nicht übermäßig überragen (Balken blieben winzig).
    assert.ok(s.obergrenze < Math.max(wert, 1) * 2 + 1, `${wert}: Obergrenze ${s.obergrenze} zu groß`);
  }
});

test('achsenSkala: unbrauchbare Eingaben führen nicht zu NaN', () => {
  for (const wert of [NaN, Infinity, -5]) {
    const s = achsenSkala(wert);
    assert.ok(Number.isFinite(s.obergrenze) && s.obergrenze >= 1);
  }
});

// ── Darstellung ─────────────────────────────────────────────────────────

test('kurzesDatum / langesDatum: reine Zeichenfolgenumstellung', () => {
  assert.equal(kurzesDatum('2026-10-08'), '08.10.');
  assert.equal(langesDatum('2026-10-08'), '08.10.2026');
  assert.equal(kurzesDatum('kaputt'), 'kaputt');
  assert.equal(langesDatum('kaputt'), 'kaputt');
});

test('anteilText: Prozent mit Dezimalkomma; ohne Gesamtmenge ein Strich statt NaN', () => {
  assert.equal(anteilText(1, 4), '25 %');
  assert.equal(anteilText(1, 3), '33,3 %');
  assert.equal(anteilText(2, 3), '66,7 %');
  assert.equal(anteilText(0, 5), '0 %');
  assert.equal(anteilText(5, 0), '–');
  assert.equal(anteilText(5, NaN), '–');
});

test('seitenName: Startseite lesbar, alles andere unverändert', () => {
  assert.equal(seitenName('/'), 'Startseite');
  assert.equal(seitenName('/faq'), '/faq');
});
