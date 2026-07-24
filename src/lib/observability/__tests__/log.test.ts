/**
 * Protokollierung: Bereinigung, Struktur, Produktionsverhalten.
 *
 * Der wichtigste Teil ist die Bereinigung. Sie ist die einzige Stelle, die
 * verhindert, dass personenbezogene Daten in einem dauerhaften Protokoll
 * landen – an über hundert Aufrufstellen auf Disziplin zu setzen, geht
 * schief.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { bereinige, log, protokoll } from '../log';
import { aktuellerKontext, laufzeitMs, merkeBestellung, mitAnfrageKontext, neueAnfrageId } from '../kontext';

/** Fängt eine Ausgabe ab, statt sie in die Konsole zu schreiben. */
function fange(fn: () => void): string[] {
  const gesammelt: string[] = [];
  const echt = { info: console.info, warn: console.warn, error: console.error };
  console.info = (...a: unknown[]) => gesammelt.push(String(a[0]));
  console.warn = (...a: unknown[]) => gesammelt.push(String(a[0]));
  console.error = (...a: unknown[]) => gesammelt.push(String(a[0]));
  try {
    fn();
  } finally {
    Object.assign(console, echt);
  }
  return gesammelt;
}

// ── Bereinigung: der Kern ────────────────────────────────────────────────

test('E-Mail-Adressen werden entfernt', () => {
  // Die häufigste Gefahr: Sie kommen in fast jedem Bestell- und
  // Kontaktvorgang vor.
  assert.equal(bereinige('Versand an kunde@example.com fehlgeschlagen'), 'Versand an [email] fehlgeschlagen');
  assert.equal(bereinige('a.b+tag@sub.domain.co.uk'), '[email]');
  assert.doesNotMatch(bereinige('max.mustermann@firma.de hat bestellt'), /mustermann/);
});

test('IP-Adressen werden auf das Netz gekürzt', () => {
  // „Kommt das gehäuft aus einer Richtung?" bleibt beantwortbar, die
  // einzelne Person nicht identifizierbar.
  assert.equal(bereinige('Zugriff von 203.0.113.42'), 'Zugriff von 203.0.113.x');
  assert.equal(bereinige('192.168.1.100 und 10.0.0.5'), '192.168.1.x und 10.0.0.x');
});

test('Schlüssel und Token werden entfernt', () => {
  assert.match(bereinige('key sk_live_abc123XYZ456def'), /\[schlüssel\]/);
  assert.match(bereinige('key sk_test_abc123XYZ456def'), /\[schlüssel\]/);
  assert.match(bereinige('Authorization: Bearer abc.def.ghi'), /Bearer \[token\]/);
});

test('lange Zufallszeichenketten werden gekürzt', () => {
  // Sitzungstoken, Signaturen, Schlüssel – alles, was zufällig und lang ist.
  const token = 'a'.repeat(43);
  assert.match(bereinige(`Token ${token} ungültig`), /\[gekürzt\]/);
  assert.doesNotMatch(bereinige(`Token ${token}`), /aaaa/);
});

test('UUIDs bleiben erhalten', () => {
  // Sie sind Kennungen, keine Geheimnisse – und für die Nachvollziehbarkeit
  // unverzichtbar. Ohne sie ließe sich eine Bestellung nicht mehr verfolgen.
  const uuid = '602a8650-8d60-429e-82ee-0903ea51df84';
  assert.match(bereinige(`Bestellung ${uuid}`), new RegExp(uuid));
});

test('Bestellnummern bleiben erhalten', () => {
  assert.match(bereinige('Bestellung ER-2026-4A9071 fehlgeschlagen'), /ER-2026-4A9071/);
});

test('die Bereinigung greift auch in Feldern', () => {
  const zeilen = fange(() =>
    protokoll.fehler('EMAIL', 'versand_fehlgeschlagen', undefined, undefined, {
      empfaenger: 'kunde@example.com',
      versuch: 2,
    })
  );
  assert.equal(zeilen.length, 1);
  assert.doesNotMatch(zeilen[0]!, /example\.com/);
  assert.match(zeilen[0]!, /\[email\]/);
  // Zahlen bleiben unangetastet.
  assert.match(zeilen[0]!, /"versuch":2/);
});

// ── Struktur ─────────────────────────────────────────────────────────────

test('jede Zeile ist gültiges JSON mit den Pflichtfeldern', () => {
  const zeilen = fange(() => protokoll.info('ORDER', 'angelegt', 'Test'));
  const objekt = JSON.parse(zeilen[0]!);
  for (const feld of ['zeit', 'schwere', 'kategorie', 'ereignis']) {
    assert.ok(objekt[feld], `Pflichtfeld ${feld} fehlt`);
  }
  assert.equal(objekt.schwere, 'INFO');
  assert.equal(objekt.kategorie, 'ORDER');
  assert.equal(objekt.ereignis, 'angelegt');
});

test('die Schwere bestimmt den Ausgabekanal', () => {
  const kanaele: string[] = [];
  const echt = { info: console.info, warn: console.warn, error: console.error };
  console.info = () => kanaele.push('info');
  console.warn = () => kanaele.push('warn');
  console.error = () => kanaele.push('error');
  try {
    protokoll.info('SYSTEM', 'a');
    protokoll.warnung('SYSTEM', 'b');
    protokoll.fehler('SYSTEM', 'c');
    protokoll.kritisch('SYSTEM', 'd');
  } finally {
    Object.assign(console, echt);
  }
  assert.deepEqual(kanaele, ['info', 'warn', 'error', 'error']);
});

// ── Produktionsmodus ─────────────────────────────────────────────────────

test('DEBUG erscheint in Produktion nicht', () => {
  const vorher = process.env.NODE_ENV;
  try {
    (process.env as Record<string, string>).NODE_ENV = 'production';
    const zeilen = fange(() => protokoll.debug('SYSTEM', 'zwischenstand', 'interner Wert 42'));
    assert.equal(zeilen.length, 0, 'in Produktion darf nichts erscheinen');
  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = vorher;
  }
});

test('Stacktraces erscheinen in Produktion nicht', () => {
  // Ein Stacktrace verrät Dateipfade, Bibliotheksversionen und Codeaufbau.
  const fehler = new Error('etwas ging schief');
  const vorher = process.env.NODE_ENV;

  try {
    (process.env as Record<string, string>).NODE_ENV = 'production';
    const prod = JSON.parse(fange(() => log({ schwere: 'ERROR', kategorie: 'SYSTEM', ereignis: 'x', fehler }))[0]!);
    assert.equal(prod.stack, undefined, 'kein Stacktrace in Produktion');
    assert.match(prod.fehler, /etwas ging schief/, 'die Meldung selbst bleibt');

    (process.env as Record<string, string>).NODE_ENV = 'development';
    const dev = JSON.parse(fange(() => log({ schwere: 'ERROR', kategorie: 'SYSTEM', ereignis: 'x', fehler }))[0]!);
    assert.ok(dev.stack, 'in der Entwicklung ist der Stacktrace hilfreich');
  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = vorher;
  }
});

test('auch Fehlermeldungen werden bereinigt', () => {
  const fehler = new Error('Versand an kunde@example.com fehlgeschlagen');
  const zeile = JSON.parse(fange(() => log({ schwere: 'ERROR', kategorie: 'EMAIL', ereignis: 'x', fehler }))[0]!);
  assert.doesNotMatch(zeile.fehler, /example\.com/);
});

// ── Anfragekontext ───────────────────────────────────────────────────────

test('die Anfrage-Kennung erscheint in jeder Zeile derselben Anfrage', () => {
  const zeilen = mitAnfrageKontext(() =>
    fange(() => {
      protokoll.info('ORDER', 'eins');
      protokoll.info('ORDER', 'zwei');
    })
  );
  const a = JSON.parse(zeilen[0]!);
  const b = JSON.parse(zeilen[1]!);
  assert.ok(a.anfrage, 'die Kennung fehlt');
  assert.equal(a.anfrage, b.anfrage, 'beide Zeilen gehören zur selben Anfrage');
});

test('verschiedene Anfragen haben verschiedene Kennungen', () => {
  const a = JSON.parse(mitAnfrageKontext(() => fange(() => protokoll.info('ORDER', 'x')))[0]!);
  const b = JSON.parse(mitAnfrageKontext(() => fange(() => protokoll.info('ORDER', 'x')))[0]!);
  assert.notEqual(a.anfrage, b.anfrage);
});

test('die Bestellnummer wird nachgetragen und gilt ab dann', () => {
  // Beim Eintreffen der Anfrage ist noch keine Bestellung bekannt.
  const zeilen = mitAnfrageKontext(() =>
    fange(() => {
      protokoll.info('ORDER', 'vorher');
      merkeBestellung('ER-2026-4A9071');
      protokoll.info('ORDER', 'nachher');
    })
  );
  assert.equal(JSON.parse(zeilen[0]!).bestellung, undefined);
  assert.equal(JSON.parse(zeilen[1]!).bestellung, 'ER-2026-4A9071');
});

test('außerhalb einer Anfrage funktioniert die Protokollierung trotzdem', () => {
  // Skripte und Hintergrundläufe haben keinen Kontext – das ist kein Fehler.
  const zeile = JSON.parse(fange(() => protokoll.info('CRON', 'lauf'))[0]!);
  assert.equal(zeile.anfrage, undefined);
  assert.equal(zeile.ereignis, 'lauf');
  assert.equal(aktuellerKontext(), undefined);
  assert.equal(laufzeitMs(), 0);
});

test('die Anfrage-Kennung ist kurz und eindeutig', () => {
  const kennungen = new Set(Array.from({ length: 500 }, () => neueAnfrageId()));
  assert.equal(kennungen.size, 500, 'keine Doppelung bei 500 Kennungen');
  assert.equal([...kennungen][0]!.length, 8);
});

// ── Wächter ──────────────────────────────────────────────────────────────

function alleQuelldateien(verzeichnis: string, gesammelt: string[] = []): string[] {
  for (const eintrag of readdirSync(verzeichnis)) {
    const pfad = join(verzeichnis, eintrag);
    if (statSync(pfad).isDirectory()) {
      if (eintrag !== 'node_modules' && eintrag !== '__tests__') alleQuelldateien(pfad, gesammelt);
    } else if (/\.tsx?$/.test(eintrag)) {
      gesammelt.push(pfad);
    }
  }
  return gesammelt;
}

test('console.log wird nirgends verwendet', () => {
  // `log` ohne Stufe sagt nichts darüber, wie dringend etwas ist.
  const treffer = alleQuelldateien('src').filter((d) => /console\.log\(/.test(readFileSync(d, 'utf8')));
  assert.deepEqual(treffer, [], 'console.log gehört nicht in den Quelltext:\n  ' + treffer.join('\n  '));
});
