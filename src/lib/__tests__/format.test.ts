/**
 * Tests der zentralen Geldformatierung – und die Absicherung dagegen, dass
 * wieder eine zweite entsteht.
 *
 * Vorgeschichte: Es liefen drei Verfahren nebeneinander. Zwei ergaben
 * „31,64 €", das dritte – `toFixed(2)` – „31.64 €". Betroffen waren die
 * Stellen, die aus dem Haus gehen: Bestellbestätigung, interne Meldung,
 * Produktionsblatt. Aufgefallen ist es erst durch den End-to-End-Test.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { formatiereGeld, formatiereGeldMitVorzeichen, formatiereZeitpunkt, formatiereUhrzeit, formatiereDatum } from '../format';

// ── Die Darstellung selbst ───────────────────────────────────────────────

test('Beträge erscheinen in deutscher Schreibweise', () => {
  assert.equal(formatiereGeld(31.64), '31,64 €');
  assert.equal(formatiereGeld(7.99), '7,99 €');
  assert.equal(formatiereGeld(0), '0,00 €');
});

test('Tausender werden getrennt', () => {
  // Genau das fehlte bei toFixed(2): „1234.56 €" statt „1.234,56 €".
  assert.equal(formatiereGeld(1234.56), '1.234,56 €');
  assert.equal(formatiereGeld(1234567.89), '1.234.567,89 €');
});

test('Es werden IMMER zwei Nachkommastellen gezeigt', () => {
  // Ein Preis von „5 €" sieht in einer Rechnung nach Schätzung aus.
  assert.equal(formatiereGeld(5), '5,00 €');
  assert.equal(formatiereGeld(5.1), '5,10 €');
});

test('Nachlässe behalten ihr Vorzeichen', () => {
  // Die Pipeline führt Nachlässe negativ – das muss sichtbar bleiben.
  assert.match(formatiereGeld(-5), /5,00 €$/);
  assert.ok(formatiereGeld(-5).startsWith('-') || formatiereGeld(-5).startsWith('−'));
});

test('CHF wird unterstützt', () => {
  assert.equal(formatiereGeld(31.64, 'CHF'), '31,64 CHF');
});

test('Unbrauchbare Werte erscheinen nicht als „NaN €"', () => {
  // In einer Rechnung wäre „NaN €" schlimmer als ein Strich: Es sieht nach
  // Fehler aus und sagt der Kundschaft nichts.
  assert.equal(formatiereGeld(Number.NaN), '– €');
  assert.equal(formatiereGeld(Number.POSITIVE_INFINITY), '– €');
});

test('Mit Vorzeichen werden Zu- und Abschläge unterscheidbar', () => {
  assert.equal(formatiereGeldMitVorzeichen(2.5), '+2,50 €');
  assert.match(formatiereGeldMitVorzeichen(-5), /^[-−]5,00 €$/);
  assert.equal(formatiereGeldMitVorzeichen(0), '0,00 €');
});

test('Die Formatierung rundet nicht fachlich, sondern stellt nur dar', () => {
  // Runden ist Sache der Preispipeline. Hier wird lediglich auf zwei
  // Stellen ANGEZEIGT – der übergebene Wert bleibt unangetastet.
  assert.equal(formatiereGeld(0.005), '0,01 €');
  assert.equal(formatiereGeld(0.004), '0,00 €');
});

// ── Keine zweite Formatierung im Projekt ─────────────────────────────────

const SRC = path.join(process.cwd(), 'src');
const ERLAUBT_EIGENE_FORMATIERUNG = [
  path.join(SRC, 'lib', 'format.ts'), // die zentrale Stelle selbst
  path.join(SRC, 'lib', 'payments', 'betrag.ts'), // rechnet in Cent, stellt nicht dar
];

function quelldateien(dir: string): string[] {
  return readdirSync(dir).flatMap((eintrag) => {
    const voll = path.join(dir, eintrag);
    if (statSync(voll).isDirectory()) return eintrag === '__tests__' ? [] : quelldateien(voll);
    return voll.endsWith('.ts') || voll.endsWith('.tsx') ? [voll] : [];
  });
}

test('Niemand formatiert Geldbeträge mehr selbst', () => {
  // Gesucht wird nach `toFixed(2)` in unmittelbarer Nähe eines
  // Währungszeichens – genau das Muster, das die Uneinheitlichkeit erzeugte.
  // `toFixed(1)` für Zentimeterangaben bleibt ausdrücklich erlaubt.
  const verstoesse: string[] = [];

  for (const datei of quelldateien(SRC)) {
    if (ERLAUBT_EIGENE_FORMATIERUNG.includes(datei)) continue;
    const zeilen = readFileSync(datei, 'utf8').split('\n');
    zeilen.forEach((zeile, i) => {
      if (/^\s*(\*|\/\/)/.test(zeile)) return; // Kommentar
      if (!/toFixed\(2\)/.test(zeile)) return;
      if (!/[€$]|EUR|CHF|currency|waehrung/i.test(zeile)) return;
      verstoesse.push(`${path.relative(process.cwd(), datei).replace(/\\/g, '/')}:${i + 1}`);
    });
  }

  assert.deepEqual(verstoesse, [], 'Geldbeträge gehören durch formatiereGeld() – siehe lib/format/geld.ts');
});

test('Niemand baut die Währungsdarstellung über Intl nach', () => {
  // `toLocaleString(..., { style: 'currency' })` lieferte zwar dasselbe
  // Ergebnis, ist aber eine zweite Stelle, die bei einer Änderung vergessen
  // würde.
  const verstoesse: string[] = [];

  for (const datei of quelldateien(SRC)) {
    if (ERLAUBT_EIGENE_FORMATIERUNG.includes(datei)) continue;
    const inhalt = readFileSync(datei, 'utf8');
    if (/style:\s*'currency'/.test(inhalt) || /Intl\.NumberFormat/.test(inhalt)) {
      verstoesse.push(path.relative(process.cwd(), datei).replace(/\\/g, '/'));
    }
  }

  assert.deepEqual(verstoesse, [], 'Die Währungsdarstellung liegt ausschließlich in lib/format/geld.ts');
});

// ── Zeitpunkte: derselbe Fehler wie beim Geld, diesmal mit der Zeitzone ──
//
// Fund vom 2026-09-01 (echter PayPal-Live-Test): `toLocaleString('de-DE', …)`
// ohne `timeZone` lieferte auf dem Server (Vercel, UTC) eine im Sommer zwei,
// im Winter eine Stunde zu frühe Uhrzeit – die Stornofrist-Anzeige im
// Adminbereich zeigte "bis 10:00" für eine Frist, die tatsächlich erst um
// 12:00 MESZ endete.

test('formatiereUhrzeit rechnet UTC in Europe/Berlin um – Sommerzeit (MESZ, UTC+2)', () => {
  // 08:00 UTC ist im September (Sommerzeit) 10:00 in Berlin.
  assert.equal(formatiereUhrzeit('2026-09-01T08:00:00.000Z'), '10:00');
});

test('formatiereUhrzeit rechnet UTC in Europe/Berlin um – Winterzeit (MEZ, UTC+1)', () => {
  // 08:00 UTC ist im Januar (Winterzeit) 09:00 in Berlin.
  assert.equal(formatiereUhrzeit('2026-01-15T08:00:00.000Z'), '09:00');
});

test('formatiereZeitpunkt nutzt dieselbe Zeitzone und akzeptiert eigene Stile', () => {
  const text = formatiereZeitpunkt('2026-09-01T08:00:00.000Z', { dateStyle: 'long', timeStyle: 'short' });
  assert.match(text, /10:00/);
  assert.match(text, /2026/);
});

test('formatiereZeitpunkt akzeptiert auch ein Date-Objekt, nicht nur einen ISO-Text', () => {
  const text = formatiereZeitpunkt(new Date('2026-09-01T08:00:00.000Z'));
  assert.match(text, /10:00/);
});

test('formatiereDatum zeigt kein Uhrzeit-Anteil', () => {
  const text = formatiereDatum('2026-09-01T23:30:00.000Z'); // 01:30 Uhr Berlin am Folgetag
  assert.doesNotMatch(text, /:\d{2}/);
  assert.match(text, /2\./); // bereits der 2. September in Berlin
});

test('Niemand formatiert Zeitpunkte mehr ohne Europe/Berlin selbst', () => {
  // Exakt das Muster, das den Fund oben erzeugte: `toLocaleString`/
  // `toLocaleTimeString`/`toLocaleDateString` mit deutschem Gebietsschema,
  // aber ohne `timeZone` – auf dem Server (UTC) systematisch falsch.
  const verstoesse: string[] = [];

  for (const datei of quelldateien(SRC)) {
    if (datei === path.join(SRC, 'lib', 'format.ts')) continue; // die zentrale Stelle selbst
    const zeilen = readFileSync(datei, 'utf8').split('\n');
    zeilen.forEach((zeile, i) => {
      if (/^\s*(\*|\/\/)/.test(zeile)) return; // Kommentar
      // Nur Aufrufe AUF EINEM DATE-OBJEKT sind gemeint (z.B. Stichzahlen
      // formatieren ebenfalls über `.toLocaleString('de-DE')`, aber auf
      // einer Zahl, nicht auf einem Zeitpunkt – das bleibt erlaubt).
      if (!/\bDate\([^)]*\)\.toLocale(String|TimeString|DateString)\(\s*'de-DE'/.test(zeile)) return;
      verstoesse.push(`${path.relative(process.cwd(), datei).replace(/\\/g, '/')}:${i + 1}`);
    });
  }

  assert.deepEqual(
    verstoesse,
    [],
    'Zeitpunkte gehören durch formatiereZeitpunkt()/formatiereUhrzeit()/formatiereDatum() – siehe lib/format.ts'
  );
});
