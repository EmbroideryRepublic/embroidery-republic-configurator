import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pruefeGeschaeftsanfrage, pruefeLogoAuswahl, einzeilig } from '@/lib/seo/geschaeftsanfrage';
import { ANFRAGE_GRENZEN, BRANCHEN, FORMULAR_TEXTE, KLEIDUNG, LOGO_GRENZEN, MENGEN, VEREDELUNG, normalisiereKennung } from '@/config/seo/geschaeftsanfrage';

const gut = (z: Record<string, unknown> = {}) => ({
  firma: 'Mustermann Heizung GmbH',
  branche: 'handwerk',
  kleidung: ['polo', 'tshirt'],
  menge: '25-49',
  veredelung: 'dtf',
  name: 'Erika Mustermann',
  email: 'erika@mustermann-heizung.de',
  telefon: '+49 173 1234567',
  anmerkung: 'Bitte bis Ende Januar.',
  kennung: 'B2B-0011',
  kennungQuelle: 'qr',
  ...z,
});

test('Kennung: nur das exakte Format B2B-0000, Leerraum und Kleinschreibung werden korrigiert', () => {
  assert.equal(normalisiereKennung('B2B-0011'), 'B2B-0011');
  assert.equal(normalisiereKennung('  b2b-0011 '), 'B2B-0011');
  for (const schlecht of ['', 'B2B-1', 'B2B-00111', 'B2B-0011\nBCC: x@y.de', 'B2B-0011 B2B-0012', '<script>', null, undefined, 42]) {
    assert.equal(normalisiereKennung(schlecht), null, String(schlecht));
  }
});

test('Geschäftsanfrage: gültige Angaben ergeben Betreff und Text mit allen Angaben und der Kennung', () => {
  const r = pruefeGeschaeftsanfrage({ ...gut(), attachments: [{ dateiname: 'logo.png', dataUrl: 'data:image/png;base64,AAAA' }] });
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.betreff, 'Geschäftsanfrage Firmenkleidung [B2B-0011] – Mustermann Heizung GmbH');
  assert.equal(r.kennung, 'B2B-0011');
  assert.equal(r.name, 'Erika Mustermann');
  assert.equal(r.email, 'erika@mustermann-heizung.de');
  const n = r.nachricht;
  assert.match(n, /Kennung aus dem Brief: B2B-0011 \(aus dem QR-Code übernommen\)/);
  assert.match(n, /Unternehmen: Mustermann Heizung GmbH/);
  assert.match(n, /Branche: Handwerk/);
  assert.match(n, /Gewünschte Kleidung: Poloshirts, T-Shirts/);
  assert.match(n, /Ungefähre Stückzahl: 25–49 Stück/);
  assert.match(n, /Veredelung: DTF-Transferdruck/);
  assert.match(n, /Ansprechpartner: Erika Mustermann/);
  assert.match(n, /Telefon: \+49 173 1234567/);
  assert.match(n, /Logo: 1 Datei angehängt/);
  assert.match(n, /Anmerkung:\nBitte bis Ende Januar\./);
  assert.ok(n.length >= 10 && n.length <= 5000, 'passt in das Nachrichtenfeld des Kontaktversands');
  assert.ok(r.betreff.length <= 150);
});

test('Geschäftsanfrage ohne Kennung (Seite von Hand geöffnet): Betreff ohne Klammer, Text nennt „keine“', () => {
  const r = pruefeGeschaeftsanfrage(gut({ kennung: '', kennungQuelle: 'eingegeben', telefon: '', anmerkung: '' }));
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.kennung, null);
  assert.equal(r.betreff, 'Geschäftsanfrage Firmenkleidung – Mustermann Heizung GmbH');
  assert.match(r.nachricht, /Kennung aus dem Brief: keine/);
  assert.match(r.nachricht, /Telefon: nicht angegeben/);
  assert.match(r.nachricht, /Logo: nicht angehängt/);
  assert.doesNotMatch(r.nachricht, /Anmerkung:/);
});

test('Kennung von Hand: Kleinschreibung wird korrigiert, Herkunft „von Hand eingetragen“; falsches Format wird abgelehnt', () => {
  const r = pruefeGeschaeftsanfrage(gut({ kennung: ' b2b-0022 ', kennungQuelle: 'eingegeben' }));
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.kennung, 'B2B-0022');
    assert.match(r.nachricht, /B2B-0022 \(von Hand eingetragen\)/);
  }
  const falsch = pruefeGeschaeftsanfrage(gut({ kennung: 'B2B-22' }));
  assert.ok(!falsch.ok);
  if (!falsch.ok) assert.equal(falsch.felder.kennung, FORMULAR_TEXTE.fehler.kennung);
  const gemerkt = pruefeGeschaeftsanfrage(gut({ kennungQuelle: 'gespeichert' }));
  assert.ok(gemerkt.ok);
  if (gemerkt.ok) assert.match(gemerkt.nachricht, /beim Besuch über den QR-Code gemerkt/);
});

test('Pflichtfelder: jedes fehlende oder ungültige Feld wird einzeln gemeldet', () => {
  const r = pruefeGeschaeftsanfrage({});
  assert.ok(!r.ok);
  if (r.ok) return;
  assert.deepEqual(Object.keys(r.felder).sort(), ['branche', 'email', 'firma', 'kleidung', 'menge', 'name', 'veredelung']);
  for (const [feld, kaputt] of [
    ['firma', { firma: 'A' }],
    ['firma', { firma: 'x'.repeat(ANFRAGE_GRENZEN.firmaMax + 1) }],
    ['branche', { branche: 'raumfahrt' }],
    ['kleidung', { kleidung: [] }],
    ['kleidung', { kleidung: ['polo', 'stickerei'] }],
    ['menge', { menge: '12' }],
    ['veredelung', { veredelung: 'stickerei' }],
    ['name', { name: 'E' }],
    ['email', { email: 'keine-adresse' }],
    ['telefon', { telefon: 'abc' }],
    ['telefon', { telefon: '123' }],
    ['anmerkung', { anmerkung: 'x'.repeat(ANFRAGE_GRENZEN.anmerkungMax + 1) }],
  ] as const) {
    const x = pruefeGeschaeftsanfrage(gut(kaputt));
    assert.ok(!x.ok, `${feld}: ${JSON.stringify(kaputt).slice(0, 60)}`);
    if (!x.ok) assert.ok(x.felder[feld as keyof typeof x.felder], `${feld} wird gemeldet`);
  }
  // Kaputter Eingang stürzt nicht ab
  for (const muell of [null, undefined, 'text', 42, []]) assert.ok(!pruefeGeschaeftsanfrage(muell).ok);
});

test('Kein Einschleusen: Zeilenumbrüche und Steuerzeichen in Firma, Name, E-Mail, Telefon landen nicht in Betreff oder Kopfzeilen', () => {
  const r = pruefeGeschaeftsanfrage(gut({ firma: 'Böse GmbH\r\nBcc: spam@example.com', name: 'Eve\nBcc: x@y.de', email: 'eve@example.com', telefon: '0173 1234567\r\nX: 1' }));
  // Telefon mit Buchstaben wird abgelehnt – das ist die richtige Reaktion
  assert.ok(!r.ok);
  const r2 = pruefeGeschaeftsanfrage(gut({ firma: 'Böse GmbH\r\nBcc: spam@example.com', name: 'Eve\nBcc: x@y.de', telefon: '0173 1234567' }));
  assert.ok(r2.ok);
  if (!r2.ok) return;
  assert.doesNotMatch(r2.betreff, /[\r\n]/);
  assert.equal(r2.betreff, 'Geschäftsanfrage Firmenkleidung [B2B-0011] – Böse GmbH Bcc: spam@example.com');
  assert.doesNotMatch(r2.name, /[\r\n]/);
  const zeilen = r2.nachricht.split('\n');
  assert.ok(zeilen.every((z) => !/^Bcc:/i.test(z)), 'keine eingeschleuste Zeile');
  assert.equal(einzeilig('a\u0000b\u2028c\t d'), 'a b c d');
  // Die Anmerkung darf mehrzeilig sein, aber ohne Steuerzeichen
  const a = pruefeGeschaeftsanfrage(gut({ anmerkung: 'Zeile 1\r\nZeile 2\u0000\u0007' }));
  assert.ok(a.ok);
  if (a.ok) assert.match(a.nachricht, /Anmerkung:\nZeile 1\nZeile 2$/);
});

test('Optionen: keine Stickerei, jede Auswahl hat eine eindeutige Kennung, Mengenstufen decken 1 bis 100+ ab', () => {
  for (const liste of [BRANCHEN, KLEIDUNG, MENGEN, VEREDELUNG]) {
    assert.equal(new Set(liste.map((o) => o.id)).size, liste.length, 'ids eindeutig');
    for (const o of liste) assert.doesNotMatch(`${o.id} ${o.label}`, /stick/i, `${o.label}: Die Stickerei ist pausiert und wird nicht angeboten`);
  }
  assert.doesNotMatch(JSON.stringify(FORMULAR_TEXTE), /stick/i);
  assert.ok(MENGEN.some((m) => m.id === '1-9') && MENGEN.some((m) => m.id === '100+'));
  assert.ok(VEREDELUNG.some((v) => v.id === 'dtf'));
});

test('Logo-Auswahl: höchstens 2 Dateien, zusammen höchstens 3 MB, nur PNG/JPEG/PDF', () => {
  const MB = 1024 * 1024;
  assert.equal(pruefeLogoAuswahl([], [{ type: 'image/png', size: 2.9 * MB }]), null);
  assert.equal(pruefeLogoAuswahl([{ size: 1 * MB }], [{ type: 'application/pdf', size: 1.5 * MB }]), null);
  assert.equal(pruefeLogoAuswahl([], [{ type: 'image/png', size: LOGO_GRENZEN.maxBytesGesamt + 1 }]), FORMULAR_TEXTE.fehler.logoZuGross);
  assert.equal(pruefeLogoAuswahl([{ size: 2 * MB }], [{ type: 'image/png', size: 1.5 * MB }]), FORMULAR_TEXTE.fehler.logoZuGross, 'die Größe zählt zusammen');
  assert.equal(pruefeLogoAuswahl([{ size: 1 }, { size: 1 }], [{ type: 'image/png', size: 1 }]), FORMULAR_TEXTE.fehler.logoZuViele);
  assert.equal(pruefeLogoAuswahl([], [{ type: 'image/gif', size: 1000 }]), FORMULAR_TEXTE.fehler.logoFormat);
  assert.equal(pruefeLogoAuswahl([], [{ type: 'image/svg+xml', size: 1000 }]), FORMULAR_TEXTE.fehler.logoFormat);
  // Base64 vergrößert um ein Drittel: 3 MB Rohdaten bleiben unter der Plattformgrenze von 4,5 MB je Anfrage
  assert.ok(Math.ceil((LOGO_GRENZEN.maxBytesGesamt * 4) / 3) < 4.5 * MB - 100 * 1024);
});
