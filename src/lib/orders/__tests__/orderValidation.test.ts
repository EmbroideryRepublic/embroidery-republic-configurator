/**
 * Tests der serverseitigen Bestellprüfung.
 *
 * Hintergrund: Bis zur Härtung des Bestellabschlusses prüfte der Server nur
 * zwei Dinge – ob der Warenkorb leer ist und ob die E-Mail ein „@" enthält.
 * Alles Übrige (Produkt, Farbe, Größen, Mengen, Motivmaße) wurde ungeprüft
 * aus dem Browser übernommen. Ein manipulierter oder schlicht veralteter
 * Warenkorb konnte damit eine nicht fertigbare Bestellung erzeugen.
 *
 * Geprüft wird das VERHALTEN gegen den echten Katalog – bewusst ohne
 * hartcodierte Produkt-IDs, damit die Tests eine Sortimentsänderung
 * überleben.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateSubmission, istPlausibleEmail, istGueltigePlz, GRENZEN } from '../orderValidation';
import { PRODUCTS } from '@/config/products';
import type { CartItem } from '@/types';

const produkt = PRODUCTS[0]!;
const groesse = produkt.sizes[0]!;
const farbe = produkt.colors[0]!.id;

function logo(ueberschreibungen: Record<string, unknown> = {}) {
  return {
    id: 'el-1',
    type: 'logo',
    view: 'front',
    xCm: 5,
    yCm: 5,
    widthCm: 10,
    heightCm: 10,
    rotationDeg: 0,
    isOutOfBounds: false,
    extraPrice: 0,
    fileUrl: 'data:image/png;base64,x',
    originalFileUrl: 'data:image/png;base64,x',
    fileName: 'logo.png',
    ...ueberschreibungen,
  } as unknown as CartItem['elements'][number];
}

/**
 * Standard-Position für die "gültiger Fall"-Tests. Trägt seit der
 * Geschäftsregel vom 2026-08-19 (Personalisierungspflicht) standardmäßig
 * EIN Logo-Element – wir verkaufen ausschließlich personalisierte Ware,
 * eine Position ganz ohne Motiv ist kein gültiger Regelfall mehr. Tests, die
 * genau den leeren Fall prüfen wollen, überschreiben `elements: []` explizit.
 */
function position(ueberschreibungen: Partial<CartItem> = {}): CartItem {
  return {
    id: 'pos-1',
    productId: produkt.id,
    colorId: farbe,
    printMethod: 'dtf',
    sizeQuantities: { [groesse]: 3 },
    quantity: 3,
    elements: [logo()],
    unitPrice: 0,
    totalPrice: 0,
    ...ueberschreibungen,
  } as CartItem;
}

const gueltigeBestellung = {
  orderType: 'order' as const,
  email: 'kundin@example.de',
  customerName: 'Alex Beispiel',
  shipping: { street: 'Musterweg 1', zip: '12345', city: 'Musterstadt', country: 'Deutschland' },
  acceptedTerms: true,
};

/** Kürzel: prüft und gibt die Codes der Befunde zurück. */
async function codes(input: Parameters<typeof validateSubmission>[0]): Promise<string[]> {
  const ergebnis = await validateSubmission(input);
  return ergebnis.issues.map((i) => i.code);
}

// ── Der gültige Fall muss durchgehen ─────────────────────────────────────

test('eine korrekte Bestellung wird angenommen', async () => {
  const ergebnis = await validateSubmission({ ...gueltigeBestellung, items: [position()] });
  assert.equal(ergebnis.valid, true, `unerwartete Befunde: ${JSON.stringify(ergebnis.issues)}`);
  assert.equal(ergebnis.issues.length, 0);
});

test('ein Einzelstück ist gültig – die Mindestmenge ist abgeschafft', async () => {
  const ergebnis = await validateSubmission({
    ...gueltigeBestellung,
    items: [position({ sizeQuantities: { [groesse]: 1 }, quantity: 1 })],
  });
  assert.equal(ergebnis.valid, true);
});

test('eine Anfrage darf ohne Warenkorb und ohne Adresse gesendet werden', async () => {
  const ergebnis = await validateSubmission({
    orderType: 'inquiry',
    items: [],
    email: 'interessent@example.de',
    customerName: 'Chris Beispiel',
  });
  assert.equal(ergebnis.valid, true);
});

// ── Mengen ───────────────────────────────────────────────────────────────

test('eine Position ohne Stückzahl wird abgewiesen', async () => {
  const gefunden = await codes({
    ...gueltigeBestellung,
    items: [position({ sizeQuantities: {}, quantity: 0 })],
  });
  assert.ok(gefunden.includes('menge_null'), gefunden.join(','));
});

test('eine negative Stückzahl wird abgewiesen', async () => {
  const gefunden = await codes({
    ...gueltigeBestellung,
    items: [position({ sizeQuantities: { [groesse]: -5 } })],
  });
  assert.ok(gefunden.includes('menge_ungueltig'), gefunden.join(','));
});

test('eine gebrochene Stückzahl wird abgewiesen', async () => {
  const gefunden = await codes({
    ...gueltigeBestellung,
    items: [position({ sizeQuantities: { [groesse]: 2.5 } })],
  });
  assert.ok(gefunden.includes('menge_ungueltig'), gefunden.join(','));
});

test('eine unsinnig hohe Stückzahl wird abgewiesen', async () => {
  const gefunden = await codes({
    ...gueltigeBestellung,
    items: [position({ sizeQuantities: { [groesse]: GRENZEN.maxMengeJeGroesse + 1 } })],
  });
  assert.ok(gefunden.includes('menge_zu_gross'), gefunden.join(','));
});

test('die mitgeschickte Gesamtmenge wird ignoriert – es zählen die Größen', async () => {
  // Der Browser behauptet 500 Stück, die Größen ergeben 0. Maßgeblich sind
  // die Größen (dieselbe Regel wie in der Preisberechnung).
  const gefunden = await codes({
    ...gueltigeBestellung,
    items: [position({ sizeQuantities: {}, quantity: 500 })],
  });
  assert.ok(gefunden.includes('menge_null'), gefunden.join(','));
});

// ── Katalogtreue ─────────────────────────────────────────────────────────

test('ein unbekanntes Produkt wird abgewiesen', async () => {
  const gefunden = await codes({
    ...gueltigeBestellung,
    items: [position({ productId: 'gibt-es-nicht' })],
  });
  assert.deepEqual(gefunden, ['produkt_unbekannt']);
});

test('eine Farbe, die es beim Produkt nicht gibt, wird abgewiesen', async () => {
  const gefunden = await codes({
    ...gueltigeBestellung,
    items: [position({ colorId: 'farbe-die-es-nicht-gibt' })],
  });
  assert.ok(gefunden.includes('farbe_unbekannt'), gefunden.join(','));
});

test('eine Größe, die es beim Produkt nicht gibt, wird abgewiesen', async () => {
  const gefunden = await codes({
    ...gueltigeBestellung,
    items: [position({ sizeQuantities: { XXXXL_gibt_es_nicht: 5 } })],
  });
  assert.ok(gefunden.includes('groesse_unbekannt'), gefunden.join(','));
});

test('eine unbekannte Veredelungsart wird abgewiesen', async () => {
  const gefunden = await codes({
    ...gueltigeBestellung,
    items: [position({ printMethod: 'siebdruck' as never })],
  });
  assert.ok(gefunden.includes('veredelung_ungueltig'), gefunden.join(','));
});

// ── Motive ───────────────────────────────────────────────────────────────

test('ein Motiv mit ungültigen Maßen wird abgewiesen', async () => {
  const gefunden = await codes({
    ...gueltigeBestellung,
    items: [position({ elements: [logo({ widthCm: Number.NaN })] })],
  });
  assert.ok(gefunden.includes('elementmasse_ungueltig'), gefunden.join(','));
});

test('ein Motiv ohne Ausdehnung wird abgewiesen', async () => {
  const gefunden = await codes({
    ...gueltigeBestellung,
    items: [position({ elements: [logo({ heightCm: 0 })] })],
  });
  assert.ok(gefunden.includes('elementmasse_ungueltig'), gefunden.join(','));
});

test('ein Motiv auf einer unbekannten Ansicht wird abgewiesen', async () => {
  const gefunden = await codes({
    ...gueltigeBestellung,
    items: [position({ elements: [logo({ view: 'innentasche' })] })],
  });
  assert.ok(gefunden.includes('ansicht_ungueltig'), gefunden.join(','));
});

test('ein Motiv größer als die Druckfläche wird abgewiesen', async () => {
  // 500 cm überschreitet jede reale Druckfläche – unabhängig vom Produkt.
  const gefunden = await codes({
    ...gueltigeBestellung,
    items: [position({ elements: [logo({ widthCm: 500, heightCm: 500 })] })],
  });
  assert.ok(gefunden.includes('element_ueberschreitet_druckflaeche'), gefunden.join(','));
});

// ── Personalisierungspflicht (Geschäftsregel 2026-08-19) ──────────────────
// Wir verkaufen ausschließlich personalisierte Ware – eine Bestellposition
// ganz ohne Logo oder Text ist ungültig. Farbe, Größe, Menge und die Wahl
// von DTF oder Stickerei zählen dabei ausdrücklich NICHT als Personalisierung.

test('eine Bestellposition ganz ohne Motiv wird abgewiesen', async () => {
  const gefunden = await codes({
    ...gueltigeBestellung,
    items: [position({ elements: [] })],
  });
  assert.ok(gefunden.includes('kein_element'), gefunden.join(','));
});

test('Farbe, Größe, Menge und Veredelungsart allein zählen nicht als Personalisierung', async () => {
  // Gültige Farbe, gültige Größe/Menge, Stickerei statt DTF – trotzdem
  // abgewiesen, weil kein einziges Logo/Text-Element vorhanden ist.
  const gefunden = await codes({
    ...gueltigeBestellung,
    items: [position({ printMethod: 'embroidery', elements: [] })],
  });
  assert.ok(gefunden.includes('kein_element'), gefunden.join(','));
});

test('ein einzelnes Textelement genügt bereits als Personalisierung', async () => {
  const ergebnis = await validateSubmission({
    ...gueltigeBestellung,
    items: [position({ elements: [logo({ id: 'el-text', type: 'text', content: 'Testtext' })] })],
  });
  assert.equal(ergebnis.valid, true, `unerwartete Befunde: ${JSON.stringify(ergebnis.issues)}`);
});

test('eine unverbindliche Anfrage darf weiterhin ganz ohne Motiv gesendet werden', async () => {
  const ergebnis = await validateSubmission({
    orderType: 'inquiry',
    items: [position({ elements: [] })],
    email: 'interessent@example.de',
    customerName: 'Chris Beispiel',
  });
  assert.equal(ergebnis.valid, true, `unerwartete Befunde: ${JSON.stringify(ergebnis.issues)}`);
});

// ── Angaben zur Person ───────────────────────────────────────────────────

test('E-Mail-Prüfung erkennt offensichtlichen Unsinn', () => {
  for (const gueltig of ['a@b.de', 'vorname.nachname@firma-gmbh.co.uk']) {
    assert.equal(istPlausibleEmail(gueltig), true, gueltig);
  }
  for (const ungueltig of ['', 'kein-at', 'a@b', 'a@@b.de', 'mit leer@zeichen.de', '@nurdomain.de']) {
    assert.equal(istPlausibleEmail(ungueltig), false, ungueltig);
  }
});

test('eine Bestellung ohne vollständige Lieferadresse wird abgewiesen', async () => {
  const gefunden = await codes({
    ...gueltigeBestellung,
    shipping: { street: '', zip: '12345', city: 'Musterstadt', country: 'Deutschland' },
    items: [position()],
  });
  assert.ok(gefunden.includes('adresse_unvollstaendig'), gefunden.join(','));
});

test('eine leere Bestellung wird abgewiesen', async () => {
  const gefunden = await codes({ ...gueltigeBestellung, items: [] });
  assert.ok(gefunden.includes('warenkorb_leer'), gefunden.join(','));
});

test('eine Bestellung ohne AGB-Zustimmung wird abgewiesen', async () => {
  const gefunden = await codes({ ...gueltigeBestellung, acceptedTerms: false, items: [position()] });
  assert.ok(gefunden.includes('agb_nicht_akzeptiert'), gefunden.join(','));
});

test('eine Anfrage braucht keine AGB-Zustimmung', async () => {
  const ergebnis = await validateSubmission({
    orderType: 'inquiry',
    items: [],
    email: 'interessent@example.de',
    customerName: 'Chris Beispiel',
  });
  assert.equal(ergebnis.valid, true);
});

test('eine Postleitzahl ohne fünf Ziffern wird abgewiesen', async () => {
  const gefunden = await codes({
    ...gueltigeBestellung,
    shipping: { ...gueltigeBestellung.shipping, zip: 'AB123' },
    items: [position()],
  });
  assert.ok(gefunden.includes('plz_ungueltig'), gefunden.join(','));
});

test('istGueltigePlz erkennt fünf Ziffern, sonst nicht', () => {
  for (const gueltig of ['12345', '00000', ' 80331 ']) {
    assert.equal(istGueltigePlz(gueltig), true, gueltig);
  }
  for (const ungueltig of ['', '1234', '123456', 'ABCDE', '1234A']) {
    assert.equal(istGueltigePlz(ungueltig), false, ungueltig);
  }
});

// ── Anzeige für die Kundschaft ───────────────────────────────────────────

test('jeder Befund trägt einen verständlichen Satz, keine technische Meldung', async () => {
  const ergebnis = await validateSubmission({
    ...gueltigeBestellung,
    email: 'kaputt',
    items: [position({ productId: 'gibt-es-nicht' })],
  });
  assert.equal(ergebnis.valid, false);
  for (const befund of ergebnis.issues) {
    assert.ok(befund.message.length > 15, `zu knapp: ${befund.message}`);
    assert.ok(/[.!]$/.test(befund.message.trim()), `kein ganzer Satz: ${befund.message}`);
    assert.ok(!/undefined|null|Error|\bcode\b/i.test(befund.message), `technisch: ${befund.message}`);
  }
  assert.ok(ergebnis.customerMessage && ergebnis.customerMessage.length > 0);
});

test('mehrere Befunde werden zusammengefasst angezeigt', async () => {
  const ergebnis = await validateSubmission({
    ...gueltigeBestellung,
    email: 'kaputt',
    customerName: '',
    items: [position()],
  });
  assert.equal(ergebnis.valid, false);
  assert.ok(ergebnis.issues.length >= 2);
  assert.match(ergebnis.customerMessage!, /2 Punkte/);
});
