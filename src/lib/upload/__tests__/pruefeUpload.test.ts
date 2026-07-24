/**
 * Upload-Prüfung: Grenzfälle und manipulierte Dateien.
 *
 * Der Schwerpunkt liegt auf den ANGRIFFEN, nicht auf dem Normalfall. Jeder
 * Test hier bildet eine konkrete Bedrohung aus docs/upload-lebenszyklus.md ab.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  UPLOAD_GRENZEN,
  base64Bytelaenge,
  istSicherePfadkomponente,
  pngAbmessungen,
  pruefeDataUrl,
  istSichererSpeicherpfad,
  UnsichererPfadFehler,
} from '../pruefeUpload';

// ── Hilfsmittel: PNG mit wählbaren Kopfdaten bauen ───────────────────────

function pngMit(breite: number, hoehe: number, zusatzBytes = 0): Buffer {
  const kopf = Buffer.alloc(24 + zusatzBytes);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(kopf, 0);
  kopf.writeUInt32BE(13, 8); // Länge des IHDR-Blocks
  kopf.write('IHDR', 12, 'ascii');
  kopf.writeUInt32BE(breite, 16);
  kopf.writeUInt32BE(hoehe, 20);
  return kopf;
}

function alsDataUrl(bytes: Buffer, typ = 'image/png'): string {
  return `data:${typ};base64,${bytes.toString('base64')}`;
}

// ── Normalfall ───────────────────────────────────────────────────────────

test('ein gültiges PNG wird angenommen', () => {
  const ergebnis = pruefeDataUrl(alsDataUrl(pngMit(800, 600)));
  assert.equal(ergebnis.ok, true);
  if (ergebnis.ok) {
    assert.equal(ergebnis.mime, 'image/png');
    assert.equal(ergebnis.breitePx, 800);
    assert.equal(ergebnis.hoehePx, 600);
  }
});

test('der Typ stammt aus der Signatur, nicht aus der Deklaration', () => {
  // Als PDF deklariert, tatsächlich ein PNG: Maßgeblich ist der Inhalt.
  const ergebnis = pruefeDataUrl(alsDataUrl(pngMit(100, 100), 'application/pdf'));
  assert.equal(ergebnis.ok, true);
  if (ergebnis.ok) assert.equal(ergebnis.mime, 'image/png');
});

// ── B1: Speicherüberlauf ─────────────────────────────────────────────────

test('die Größe wird VOR dem Dekodieren erkannt', () => {
  // Der entscheidende Schutz: Ein Puffer dieser Größe darf gar nicht erst
  // entstehen. Wir prüfen die Rechnung auf der Zeichenkette.
  const zeichen = Math.ceil((UPLOAD_GRENZEN.maxBytes * 2 * 4) / 3);
  assert.ok(base64Bytelaenge('A'.repeat(zeichen)) > UPLOAD_GRENZEN.maxBytes);
});

test('eine zu große Datei wird abgelehnt', () => {
  const zuGross = 'A'.repeat(Math.ceil(((UPLOAD_GRENZEN.maxBytes + 1024) * 4) / 3));
  const ergebnis = pruefeDataUrl(`data:image/png;base64,${zuGross}`);
  assert.equal(ergebnis.ok, false);
  if (!ergebnis.ok) {
    assert.equal(ergebnis.grund, 'zu_gross');
    assert.match(ergebnis.protokoll, /vor dem Dekodieren/);
  }
});

test('die Bytelänge stimmt mit und ohne Füllzeichen', () => {
  for (const roh of ['a', 'ab', 'abc', 'abcd', 'abcde', 'hallo welt']) {
    const b64 = Buffer.from(roh).toString('base64');
    assert.equal(base64Bytelaenge(b64), roh.length, `${roh} falsch berechnet`);
  }
});

// ── B2: falsch deklarierter Inhalt ───────────────────────────────────────

test('HTML mit PNG-Deklaration wird abgewiesen', () => {
  // Der XSS-Vektor: als Bild deklariert, tatsächlich HTML. Ohne
  // Signaturprüfung landete das mit contentType image/png im Bucket.
  const html = Buffer.from('<html><script>alert(1)</script></html>');
  const ergebnis = pruefeDataUrl(alsDataUrl(html));
  assert.equal(ergebnis.ok, false);
  if (!ergebnis.ok) assert.equal(ergebnis.grund, 'unbekanntes_format');
});

test('ein SVG wird abgewiesen, auch als PNG deklariert', () => {
  // SVG erreicht den Server im normalen Ablauf nie (Canvas rastert es).
  // Die Whitelist macht das verbindlich – damit entfallen XXE, Billion
  // Laughs und eingebettete Skripte strukturell.
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
  for (const typ of ['image/svg+xml', 'image/png']) {
    const ergebnis = pruefeDataUrl(alsDataUrl(svg, typ));
    assert.equal(ergebnis.ok, false, `als ${typ} durchgelassen`);
  }
});

test('eine XML-Entity-Bombe wird abgewiesen', () => {
  const bombe = Buffer.from(
    '<?xml version="1.0"?><!DOCTYPE lolz [<!ENTITY lol "lol">' +
      '<!ENTITY lol2 "&lol;&lol;&lol;&lol;&lol;">]><lolz>&lol2;</lolz>'
  );
  const ergebnis = pruefeDataUrl(alsDataUrl(bombe));
  assert.equal(ergebnis.ok, false);
});

test('ein ZIP-Archiv wird abgewiesen', () => {
  // ZIP beginnt mit PK\x03\x04 – Schutz vor ZIP-Bomben.
  const zip = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00, 0x08]);
  const ergebnis = pruefeDataUrl(alsDataUrl(zip));
  assert.equal(ergebnis.ok, false);
  if (!ergebnis.ok) assert.equal(ergebnis.grund, 'unbekanntes_format');
});

test('ein PDF wird abgewiesen – der Client rastert es bereits', () => {
  const pdf = Buffer.from('%PDF-1.4\n%âãÏÓ\n');
  const ergebnis = pruefeDataUrl(alsDataUrl(pdf, 'application/pdf'));
  assert.equal(ergebnis.ok, false);
});

test('eine fast korrekte PNG-Signatur genügt nicht', () => {
  const fast = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x00, 0, 0, 0, 13]);
  assert.equal(pruefeDataUrl(alsDataUrl(fast)).ok, false);
});

// ── B3: Bildbombe ────────────────────────────────────────────────────────

test('eine Bildbombe wird an den Abmessungen erkannt', () => {
  // Wenige Bytes, gigantische deklarierte Fläche. Beim Rendern entstünde
  // daraus ein Puffer von mehreren Gigabyte.
  const bombe = pngMit(50000, 50000);
  assert.ok(bombe.length < 100, 'die Datei selbst ist winzig');
  const ergebnis = pruefeDataUrl(alsDataUrl(bombe));
  assert.equal(ergebnis.ok, false);
  if (!ergebnis.ok) assert.equal(ergebnis.grund, 'zu_grosse_abmessungen');
});

test('genau auf der Grenze wird noch angenommen', () => {
  const grenze = pngMit(UPLOAD_GRENZEN.maxBreitePx, UPLOAD_GRENZEN.maxHoehePx);
  assert.equal(pruefeDataUrl(alsDataUrl(grenze)).ok, true);
});

test('einen Pixel darüber nicht mehr', () => {
  const drueber = pngMit(UPLOAD_GRENZEN.maxBreitePx + 1, 100);
  assert.equal(pruefeDataUrl(alsDataUrl(drueber)).ok, false);
});

test('Abmessungen von null werden abgewiesen', () => {
  for (const [b, h] of [[0, 100], [100, 0], [0, 0]]) {
    const ergebnis = pruefeDataUrl(alsDataUrl(pngMit(b!, h!)));
    assert.equal(ergebnis.ok, false, `${b} × ${h} durchgelassen`);
  }
});

test('eine PNG-Signatur ohne IHDR-Block wird abgewiesen', () => {
  const ohneKopf = Buffer.alloc(30);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(ohneKopf, 0);
  const ergebnis = pruefeDataUrl(alsDataUrl(ohneKopf));
  assert.equal(ergebnis.ok, false);
  if (!ergebnis.ok) assert.equal(ergebnis.grund, 'abmessungen_unlesbar');
});

test('ein abgeschnittener Kopf wird abgewiesen', () => {
  const kurz = pngMit(100, 100).subarray(0, 20);
  assert.equal(pruefeDataUrl(alsDataUrl(kurz)).ok, false);
  assert.equal(pngAbmessungen(kurz), null);
});

// ── Aufbau der Data-URL ──────────────────────────────────────────────────

test('unbrauchbare Eingaben werden abgewiesen statt zu werfen', () => {
  for (const eingabe of ['', 'kein-data-url', 'data:image/png,nichtbase64', 'data:;base64,', 'https://example.invalid/x.png']) {
    const ergebnis = pruefeDataUrl(eingabe);
    assert.equal(ergebnis.ok, false, `„${eingabe}" durchgelassen`);
  }
});

test('eine leere Data-URL wird als leer erkannt', () => {
  const ergebnis = pruefeDataUrl('data:image/png;base64,');
  assert.equal(ergebnis.ok, false);
  if (!ergebnis.ok) assert.equal(ergebnis.grund, 'leer');
});

// ── Fehlermeldungen ──────────────────────────────────────────────────────

test('Kundenmeldungen geben keine internen Informationen preis', () => {
  const faelle = [
    alsDataUrl(Buffer.from('<html>')),
    alsDataUrl(pngMit(50000, 50000)),
    'data:image/png;base64,',
    'unfug',
  ];
  for (const fall of faelle) {
    const ergebnis = pruefeDataUrl(fall);
    assert.equal(ergebnis.ok, false);
    if (!ergebnis.ok) {
      // Keine Signaturen, keine Bytefolgen, keine Dateipfade, keine
      // Feldnamen – nichts, woraus sich die nächste Hürde ableiten ließe.
      assert.doesNotMatch(ergebnis.kundenMeldung, /0x|IHDR|signatur|base64|Buffer|byte/i);
      assert.ok(ergebnis.kundenMeldung.length < 120);
      // Der technische Grund bleibt im Protokoll erhalten.
      assert.ok(ergebnis.protokoll.length > 0);
    }
  }
});

test('verschiedene Ablehnungen sind im Protokoll unterscheidbar', () => {
  const gross = pruefeDataUrl(`data:image/png;base64,${'A'.repeat(Math.ceil(((UPLOAD_GRENZEN.maxBytes + 1024) * 4) / 3))}`);
  const format = pruefeDataUrl(alsDataUrl(Buffer.from('<html>')));
  assert.notEqual((gross as { grund: string }).grund, (format as { grund: string }).grund);
});

// ── B6: Pfadmanipulation ─────────────────────────────────────────────────

test('Pfadkomponenten mit Verzeichniswechsel werden abgewiesen', () => {
  for (const boese of ['../../fremd', 'a/b', '..', 'x\\y', 'mit leer', 'ä', '', 'a'.repeat(65)]) {
    assert.equal(istSicherePfadkomponente(boese), false, `„${boese}" durchgelassen`);
  }
});

test('eine UUID ist eine gültige Pfadkomponente', () => {
  assert.equal(istSicherePfadkomponente('602a8650-8d60-429e-82ee-0903ea51df84'), true);
  assert.equal(istSicherePfadkomponente('item-0-logo'), true);
});

// ── B6: vollständige Speicherpfade ───────────────────────────────────────

test('gültige Speicherpfade werden angenommen', () => {
  const gueltig = [
    'orders/602a8650-8d60-429e-82ee-0903ea51df84/item-0-logo-abc-original.png',
    'orders/x/produktionsblatt.pdf',
    'orders/x/preview-item0-front.png',
    'a',
  ];
  for (const p of gueltig) {
    assert.equal(istSichererSpeicherpfad(p), true, `„${p}" abgelehnt`);
  }
});

test('Verzeichniswechsel wird in jeder Form abgewiesen', () => {
  const boese = [
    'orders/../../etc/passwd',
    'orders/x/../../../geheim.png',
    '../fremd.png',
    'orders/./x.png',
    'orders/x/..',
  ];
  for (const p of boese) {
    assert.equal(istSichererSpeicherpfad(p), false, `„${p}" durchgelassen`);
  }
});

test('absolute Pfade, Backslashes und Null-Bytes werden abgewiesen', () => {
  const boese = [
    '/etc/passwd',
    'orders\\x\\logo.png',
    'orders/x\\..\\..\\geheim',
    // Null-Byte: klassischer Versuch, eine Endungsprüfung zu umgehen.
    'orders/x/logo.png .txt',
    'orders/x/',
    '',
  ];
  for (const p of boese) {
    assert.equal(istSichererSpeicherpfad(p), false, `${JSON.stringify(p)} durchgelassen`);
  }
});

test('Sonderzeichen und Leerzeichen in Pfaden werden abgewiesen', () => {
  for (const p of ['orders/x/mein logo.png', 'orders/x/lögo.png', 'orders/x/a?b.png', 'orders/x/a:b.png']) {
    assert.equal(istSichererSpeicherpfad(p), false, `„${p}" durchgelassen`);
  }
});

test('ein übermäßig langer Pfad wird abgewiesen', () => {
  assert.equal(istSichererSpeicherpfad('orders/' + 'a'.repeat(600)), false);
  // Auch ein einzelnes zu langes Segment.
  assert.equal(istSichererSpeicherpfad('orders/' + 'a'.repeat(129) + '/x.png'), false);
});

test('der Fehler nennt den Pfad – für das Protokoll, nicht für die Kundschaft', () => {
  const fehler = new UnsichererPfadFehler('orders/../geheim');
  assert.match(fehler.message, /Unzulässiger Speicherpfad/);
  assert.equal(fehler.name, 'UnsichererPfadFehler');
});
