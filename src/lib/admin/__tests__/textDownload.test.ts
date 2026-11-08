/**
 * Text-Download (JPG) im Adminbereich: Laden des Elements, Absicherung der
 * Route, Links und Neuerzeugen der Produktionsunterlagen.
 *
 * Das Laden läuft mit dem ECHTEN Code gegen eine Netz-Attrappe (wie
 * orders/__tests__/mailfluss.test.ts): `globalThis.fetch` beantwortet die
 * Datenbankabfragen, nichts geht nach draußen. Besonders wichtig ist die
 * Zugehörigkeitsprüfung – über eine fremde Bestellkennung darf kein Text
 * einer anderen Bestellung ladbar sein.
 */
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ladeTextFuerJpg, ladeTexteFuerZip, ladeTextBytesFuerZip } from '../textDateien';
import { textJpgHref, textPngHref, textVorschauHref, textEinzeiligHref, inEineZeile, zeilenAnzahl } from '../textLink';
import { renderTextAlsPng } from '@/lib/rendering/renderTextJpg';

const DB = 'https://db.example.invalid';
const ENV: Record<string, string> = { NEXT_PUBLIC_SUPABASE_URL: DB, SUPABASE_SECRET_KEY: 'sb_secret_test' };

const BESTELLUNG = 'f5ee034e-2ee2-4994-9496-98cfa6e791d8';
const FREMDE_BESTELLUNG = '11111111-2222-4333-8444-555555555555';
const POSITION = 'a0000000-0000-4000-8000-000000000001';
const FREMDE_POSITION = 'a0000000-0000-4000-8000-000000000002';
const TEXT_1 = 'e0000000-0000-4000-8000-000000000001';
const TEXT_2 = 'e0000000-0000-4000-8000-000000000002';
const LOGO = 'e0000000-0000-4000-8000-000000000003';
const FREMDER_TEXT = 'e0000000-0000-4000-8000-000000000004';

function textZeile(id: string, positionId: string, ueberschreibe: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id,
    order_item_id: positionId,
    element_type: 'text',
    view: 'back',
    x_cm: 4.5,
    y_cm: 3.1,
    width_cm: 20.9,
    height_cm: 11.4,
    rotation_deg: 0,
    text_content: 'Team \nSchüplitz',
    font_family: 'Impact',
    font_size: 48,
    font_color: '#5c5c5c',
    font_weight: 'bold',
    font_style: 'italic',
    text_align: 'center',
    letter_spacing: 0,
    line_height: 1.2,
    has_shadow: false,
    has_outline: false,
    outline_color: null,
    ...ueberschreibe,
  };
}

let elemente: Record<string, Record<string, unknown>>;
let positionen: Record<string, Record<string, unknown>[]>;
let bestellnummern: Record<string, string>;
let abfragen: string[];

const alteUmgebung: Record<string, string | undefined> = {};
const alterFetch = globalThis.fetch;
const alteKonsole = { error: console.error };

function json(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
}

function netz(eingabe: string | URL | Request): Promise<Response> {
  const url = new URL(typeof eingabe === 'string' ? eingabe : eingabe instanceof URL ? eingabe.href : eingabe.url);
  abfragen.push(`${url.pathname}?${url.searchParams.toString()}`);
  if (url.hostname !== 'db.example.invalid') return Promise.reject(new Error(`Unerwarteter Netzaufruf: ${url.href}`));

  const gleich = (name: string) => url.searchParams.get(name)?.replace(/^eq\./, '');

  if (url.pathname === '/rest/v1/configuration_elements') {
    const id = gleich('id');
    if (id) return Promise.resolve(json(elemente[id] ? [elemente[id]] : []));
    const roh = url.searchParams.get('order_item_id') ?? '';
    const gesuchtePositionen = roh.startsWith('in.(') ? roh.slice(4, -1).split(',') : [roh.replace(/^eq\./, '')];
    return Promise.resolve(json(Object.values(elemente).filter((e) => gesuchtePositionen.includes(e.order_item_id as string))));
  }
  if (url.pathname === '/rest/v1/order_items') {
    return Promise.resolve(json(positionen[gleich('order_id') ?? ''] ?? []));
  }
  if (url.pathname === '/rest/v1/orders') {
    const nummer = bestellnummern[gleich('id') ?? ''];
    return Promise.resolve(json(nummer ? [{ order_number: nummer }] : []));
  }
  return Promise.reject(new Error(`Unerwartete Datenbankabfrage: ${url.pathname}`));
}

beforeEach(() => {
  positionen = {
    [BESTELLUNG]: [
      { id: POSITION, product_name: 'College Hoodie', product_id: 'justhoods-college-hoodie', color_id: 'grey', print_method: 'dtf', size_quantities: { M: 2 } },
    ],
    [FREMDE_BESTELLUNG]: [
      { id: FREMDE_POSITION, product_name: 'College Hoodie', product_id: 'justhoods-college-hoodie', color_id: 'grey', print_method: 'dtf', size_quantities: { M: 1 } },
    ],
  };
  elemente = {
    [TEXT_1]: textZeile(TEXT_1, POSITION),
    [TEXT_2]: textZeile(TEXT_2, POSITION, { text_content: 'Zweiter Text' }),
    [LOGO]: { id: LOGO, order_item_id: POSITION, element_type: 'logo', view: 'front', file_name: 'logo.png' },
    [FREMDER_TEXT]: textZeile(FREMDER_TEXT, FREMDE_POSITION, { text_content: 'Gehört einer anderen Bestellung' }),
  };
  bestellnummern = { [BESTELLUNG]: 'ER-2026-F5EE03' };
  abfragen = [];
  for (const [name, wert] of Object.entries(ENV)) {
    alteUmgebung[name] = process.env[name];
    process.env[name] = wert;
  }
  globalThis.fetch = netz as typeof fetch;
  console.error = () => {};
});

afterEach(() => {
  for (const [name, wert] of Object.entries(alteUmgebung)) {
    if (wert === undefined) delete process.env[name];
    else process.env[name] = wert;
  }
  globalThis.fetch = alterFetch;
  console.error = alteKonsole.error;
});

// ── Laden ────────────────────────────────────────────────────────────────

test('Ein Text wird mit allen Gestaltungsangaben und dem Zeilenumbruch geladen', async () => {
  const geladen = await ladeTextFuerJpg(BESTELLUNG, TEXT_1);
  assert.ok(geladen);
  const { eingabe } = geladen;
  assert.equal(eingabe.productId, 'justhoods-college-hoodie');
  assert.equal(eingabe.colorId, 'grey');
  assert.equal(eingabe.view, 'back');
  assert.equal(eingabe.printMethod, 'dtf');
  assert.deepEqual(eingabe.sizeQuantities, { M: 2 });
  assert.equal(eingabe.element.content, 'Team \nSchüplitz', 'der Zeilenumbruch und das Leerzeichen davor bleiben erhalten');
  assert.equal(eingabe.element.fontFamily, 'Impact');
  assert.equal(eingabe.element.fontSizePx, 48);
  assert.equal(eingabe.element.color, '#5c5c5c');
  assert.equal(eingabe.element.bold, true);
  assert.equal(eingabe.element.italic, true);
  assert.equal(eingabe.element.lineHeight, 1.2);
});

test('Dateiname: Bestellnummer, Position, Ansicht, Nummer des Textes in dieser Ansicht', async () => {
  assert.equal((await ladeTextFuerJpg(BESTELLUNG, TEXT_1))!.dateiname, 'ER-2026-F5EE03_Position-1_Rueckseite_Text-1.jpg');
  assert.equal((await ladeTextFuerJpg(BESTELLUNG, TEXT_2))!.dateiname, 'ER-2026-F5EE03_Position-1_Rueckseite_Text-2.jpg');
});

test('Fehlt die gespeicherte Bestellnummer, wird sie wie überall aus der Kennung gebildet', async () => {
  bestellnummern = {};
  const name = (await ladeTextFuerJpg(BESTELLUNG, TEXT_1))!.dateiname;
  assert.match(name, /^ER-\d{4}-F5EE03_Position-1_Rueckseite_Text-1\.jpg$/);
});

// ── Zugehörigkeit ────────────────────────────────────────────────────────

test('Ein Text einer ANDEREN Bestellung ist über diese Bestellkennung nicht ladbar', async () => {
  assert.equal(await ladeTextFuerJpg(BESTELLUNG, FREMDER_TEXT), null);
  assert.equal(await ladeTextFuerJpg(FREMDE_BESTELLUNG, TEXT_1), null);
  // …aber über die richtige Bestellung schon:
  assert.ok(await ladeTextFuerJpg(FREMDE_BESTELLUNG, FREMDER_TEXT));
});

test('Logos, unbekannte Kennungen und unbekannte Bestellungen liefern nichts', async () => {
  assert.equal(await ladeTextFuerJpg(BESTELLUNG, LOGO), null, 'ein Logo ist kein Text');
  assert.equal(await ladeTextFuerJpg(BESTELLUNG, 'e0000000-0000-4000-8000-0000000000ff'), null);
  assert.equal(await ladeTextFuerJpg('99999999-9999-4999-8999-999999999999', TEXT_1), null);
});

// ── Texte im ZIP-Sammel-Download ─────────────────────────────────────────

test('ZIP: jeder Text der Bestellung bekommt einen Eintrag, benannt wie die Logos im ZIP', async () => {
  const eintraege = await ladeTexteFuerZip(BESTELLUNG);
  assert.deepEqual(eintraege, [
    { elementId: TEXT_1, zipEintragsname: 'Position-1_College_Hoodie_Ruckseite_Text-1.png' },
    { elementId: TEXT_2, zipEintragsname: 'Position-1_College_Hoodie_Ruckseite_Text-2.png' },
  ]);
});

test('ZIP: Texte einer anderen Bestellung kommen nicht hinein; unbekannte Bestellung = leer', async () => {
  const fremd = await ladeTexteFuerZip(FREMDE_BESTELLUNG);
  assert.deepEqual(fremd.map((e) => e.elementId), [FREMDER_TEXT]);
  assert.deepEqual(await ladeTexteFuerZip('99999999-9999-4999-8999-999999999999'), []);
});

test('ZIP: Logos zählen nicht als Text, jede Position zählt ihre Texte neu', async () => {
  const ZWEITE_POSITION = 'a0000000-0000-4000-8000-000000000009';
  const ZWEITER_TEXT = 'e0000000-0000-4000-8000-000000000009';
  positionen[BESTELLUNG]!.push({ id: ZWEITE_POSITION, product_name: 'T-Shirt', product_id: 'justhoods-college-hoodie', color_id: 'grey', print_method: 'dtf', size_quantities: { M: 1 } });
  elemente[ZWEITER_TEXT] = textZeile(ZWEITER_TEXT, ZWEITE_POSITION, { text_content: 'Zweite Position' });
  const namen = (await ladeTexteFuerZip(BESTELLUNG)).map((e) => e.zipEintragsname);
  assert.deepEqual(namen, [
    'Position-1_College_Hoodie_Ruckseite_Text-1.png',
    'Position-1_College_Hoodie_Ruckseite_Text-2.png',
    'Position-2_T-Shirt_Ruckseite_Text-1.png',
  ]);
});

test('ZIP: die Texte werden als echte PNG-Dateien erzeugt (transparent, 300 dpi)', async () => {
  const eintraege = await ladeTexteFuerZip(BESTELLUNG);
  const ergebnis = await ladeTextBytesFuerZip(BESTELLUNG, eintraege);
  assert.equal(ergebnis.fehlgeschlagen.length, 0);
  assert.deepEqual(ergebnis.geladen.map((d) => d.zipEintragsname), eintraege.map((e) => e.zipEintragsname));
  for (const datei of ergebnis.geladen) {
    assert.deepEqual([...datei.bytes.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 'PNG-Kennung');
    assert.ok(datei.bytes.includes(Buffer.from('pHYs')), '300 dpi stehen im Kopf');
    assert.equal(datei.bytes[25], 6, 'Farbtyp RGBA – mit Alpha-Kanal, also transparenter Hintergrund');
  }
});

test('ZIP: ein Text, der nicht (mehr) zur Bestellung gehört, bricht nichts ab, sondern wird mit Grund gemeldet', async () => {
  const eintraege = [
    { elementId: FREMDER_TEXT, zipEintragsname: 'Position-1_X_Text-1.png' },
    { elementId: TEXT_1, zipEintragsname: 'Position-1_X_Text-2.png' },
  ];
  const ergebnis = await ladeTextBytesFuerZip(BESTELLUNG, eintraege);
  assert.deepEqual(ergebnis.geladen.map((d) => d.zipEintragsname), ['Position-1_X_Text-2.png']);
  assert.equal(ergebnis.fehlgeschlagen.length, 1);
  assert.equal(ergebnis.fehlgeschlagen[0]!.zipEintragsname, 'Position-1_X_Text-1.png');
  assert.match(ergebnis.fehlgeschlagen[0]!.grund, /nicht \(mehr\) zu dieser Bestellung/);
});

test('ZIP: ein Fehler beim Erzeugen eines Textes wird gemeldet, die übrigen Texte kommen trotzdem', async () => {
  elemente[TEXT_2] = { ...elemente[TEXT_2], font_size: 'kaputt' }; // nicht renderbar
  const eintraege = await ladeTexteFuerZip(BESTELLUNG);
  const ergebnis = await ladeTextBytesFuerZip(BESTELLUNG, eintraege);
  assert.equal(ergebnis.geladen.length + ergebnis.fehlgeschlagen.length, 2, 'jeder Eintrag landet entweder im ZIP oder in der Fehlerliste');
  assert.ok(ergebnis.geladen.some((d) => d.zipEintragsname.endsWith('Text-1.png')), 'der intakte Text ist dabei');
});

// ── Download in EINER Zeile ──────────────────────────────────────────────

test('In einer Zeile: die Zeilen stehen hintereinander, Leerzeichen am Zeilenrand entfallen', () => {
  assert.equal(inEineZeile('Team \nSchüplitz'), 'Team Schüplitz', 'der Kundentext aus ER-2026-F5EE03');
  assert.equal(inEineZeile('a\r\nb\rc\nd'), 'a b c d');
  assert.equal(inEineZeile('  oben \n\n  unten  '), 'oben unten', 'leere Zeilen und Ränder fallen weg');
  assert.equal(inEineZeile('Eine Zeile'), 'Eine Zeile', 'ein Text ohne Umbruch bleibt, wie er ist');
  assert.equal(inEineZeile('Zwei  Wörter'), 'Zwei  Wörter', 'Abstände INNERHALB einer Zeile gehören dem Kunden');
});

test('Der Text in einer Zeile wird wirklich einzeilig gerendert – gleiche Schrift, deutlich flacher und breiter', async () => {
  const geladen = (await ladeTextFuerJpg(BESTELLUNG, TEXT_1))!;
  const zweizeilig = await renderTextAlsPng(geladen.eingabe);
  const einzeilig = await renderTextAlsPng({
    ...geladen.eingabe,
    element: { ...geladen.eingabe.element, content: inEineZeile(geladen.eingabe.element.content) },
  });
  assert.ok(zweizeilig.ok && einzeilig.ok);
  assert.equal(zweizeilig.zeilen, 2);
  assert.equal(einzeilig.zeilen, 1);
  assert.ok(einzeilig.hoeheCm < zweizeilig.hoeheCm * 0.65, `Höhe ${einzeilig.hoeheCm} vs. ${zweizeilig.hoeheCm}: eine Zeile statt zwei`);
  assert.ok(einzeilig.breiteCm > zweizeilig.breiteCm * 1.2, `Breite ${einzeilig.breiteCm} vs. ${zweizeilig.breiteCm}: beide Wörter nebeneinander`);
  // Seitenverhältnis eines Einzeilers: deutlich breiter als hoch (Team Schüplitz ≈ 6 : 1).
  assert.ok(einzeilig.breitePx / einzeilig.hoehePx > 4, `Seitenverhältnis ${(einzeilig.breitePx / einzeilig.hoehePx).toFixed(1)} : 1`);
  assert.equal(einzeilig.dpi, 300);
});

// ── Quelltext-Prüfungen der Absicherung ──────────────────────────────────

function quelltext(...teile: string[]): string {
  return readFileSync(path.join(process.cwd(), ...teile), 'utf8');
}

test('Die Download-Route prüft die Admin-Sitzung VOR jedem Datenzugriff und beide Kennungen auf unbedenkliche Zeichen', () => {
  const route = quelltext('src', 'app', 'api', 'admin', 'bestellungen', '[id]', 'texte', '[elementId]', 'route.ts');
  const admin = route.indexOf('await istAdmin()');
  const laden = route.indexOf('await ladeTextFuerJpg(');
  assert.ok(admin > 0 && laden > admin, 'istAdmin() steht vor dem Laden');
  assert.match(route, /status: 401/);
  assert.match(route, /istSicherePfadkomponente\(params\.id\)/);
  assert.match(route, /istSicherePfadkomponente\(params\.elementId\)/);
  assert.match(route, /'content-type': alsPng \? 'image\/png' : 'image\/jpeg'/);
  assert.match(route, /\.get\('format'\) === 'png'/, 'PNG nur auf ausdrücklichen Wunsch, sonst wie bisher JPG');
  assert.match(route, /nurVorschau \? 'private, max-age=300' : 'private, no-store'/, 'Downloads nie, das kleine Vorschaubild nur privat und kurz zwischenspeichern');
  assert.doesNotMatch(route, /'cache-control': '[^']*public/, 'Kundendaten gehören in keinen gemeinsamen Zwischenspeicher');
  assert.match(route, /get\('vorschau'\) === '1'/);
  assert.match(route, /get\('einzeilig'\) === '1'/, 'die Fassung in einer Zeile gibt es nur auf ausdrücklichen Wunsch');
  assert.match(route, /inEineZeile\(eingabe\.element\.content\)/);
  assert.match(route, /\(einzeilig \? '_eine-Zeile' : ''\)/, 'der Dateiname sagt, dass es die Fassung in einer Zeile ist');
  assert.match(route, /dpi: VORSCHAU_DPI/, 'das Vorschaubild wird klein gerastert, nicht in Druckgröße');
  assert.match(route, /export const maxDuration = \d+/);
});

test('Das Neuerzeugen der Produktionsunterlagen ist nur für Admins und verschickt nichts', () => {
  const aktion = quelltext('src', 'lib', 'actions', 'productionPreviewActions.ts');
  const start = aktion.indexOf('export async function erzeugeProduktionsunterlagenNeuAktion');
  assert.ok(start > 0);
  const rumpf = aktion.slice(start);
  assert.match(rumpf, /if \(!\(await istAdmin\(\)\)\)/);
  assert.doesNotMatch(rumpf, /sendEmail|sendeVorschauFreigabe|send[A-Z]\w*Email/, 'keine Nachricht an Kundschaft oder Betreiber');

  const abschluss = quelltext('src', 'lib', 'orders', 'orderCompletion.ts');
  const neuStart = abschluss.indexOf('export async function erzeugeProduktionsunterlagenNeu');
  const neuEnde = abschluss.indexOf('async function erzeugeProduktionsblatt', neuStart);
  const neu = abschluss.slice(neuStart, neuEnde);
  assert.ok(neu.length > 100);
  assert.doesNotMatch(neu, /benachrichtige|sendEmail|sendeBestellbestaetigung|internal_notification/, 'rein rendern, nichts versenden');
  assert.match(neu, /probleme\.length > 0[\s\S]*?produktionsblattErneuert: false/, 'bei fehlgeschlagener Vorschau bleibt das alte Blatt');
});

test('Die Bestell-Detailseite bietet Text-Download (in den Kundendateien) und Neuerzeugen an', () => {
  const seite = quelltext('src', 'app', 'admin', 'bestellung', '[id]', 'page.tsx');
  assert.match(seite, /<KundendateienPanel orderId=\{order\.id\} items=\{order\.items\} \/>/);
  assert.doesNotMatch(seite, /TextdateienPanel/, 'die Texte stehen in den Kundendateien, nicht in einem eigenen Block');
  assert.match(seite, /<RegenerateAllPreviewsButton orderId=\{order\.id\} \/>/);
  const vorschau = quelltext('src', 'components', 'admin', 'ProductionPreview.tsx');
  assert.match(vorschau, /whitespace-pre-line/, 'Zeilenumbrüche des Textes bleiben in der Anzeige sichtbar');
  assert.match(vorschau, /textJpgHref\(orderId, element\.id\)/);
  assert.match(vorschau, /textPngHref\(orderId, element\.id\)/, 'die DTF-Datei (transparent) ist direkt am Text erreichbar');
});

// ── Hilfen ───────────────────────────────────────────────────────────────

test('Adresse des Downloads und Zeilenzählung', () => {
  assert.equal(textJpgHref('a b', 'c/d'), '/api/admin/bestellungen/a%20b/texte/c%2Fd');
  assert.equal(textJpgHref('o1', 'e1', true), '/api/admin/bestellungen/o1/texte/e1?ansicht=1');
  assert.equal(textPngHref('o1', 'e1'), '/api/admin/bestellungen/o1/texte/e1?format=png');
  assert.equal(textPngHref('o1', 'e1', true), '/api/admin/bestellungen/o1/texte/e1?format=png&ansicht=1');
  assert.equal(textVorschauHref('o1', 'e1'), '/api/admin/bestellungen/o1/texte/e1?vorschau=1');
  assert.equal(textEinzeiligHref('o1', 'e1', 'png'), '/api/admin/bestellungen/o1/texte/e1?einzeilig=1&format=png');
  assert.equal(textEinzeiligHref('o1', 'e1', 'jpg'), '/api/admin/bestellungen/o1/texte/e1?einzeilig=1');
  assert.equal(zeilenAnzahl('Team \nSchüplitz'), 2);
  assert.equal(zeilenAnzahl('Eine Zeile'), 1);
  assert.equal(zeilenAnzahl('a\r\nb\r\nc'), 3);
  assert.equal(zeilenAnzahl(''), 1);
});

test('Die ZIP-Route prüft die Admin-Sitzung zuerst und nimmt die Texte als PNG auf', () => {
  const route = quelltext('src', 'app', 'api', 'admin', 'bestellungen', '[id]', 'kundendateien', 'route.ts');
  const admin = route.indexOf('await istAdmin()');
  const laden = route.indexOf('await ladeKundendateienFuerZip(');
  const texte = route.indexOf('await ladeTexteFuerZip(');
  assert.ok(admin > 0 && laden > admin && texte > admin, 'istAdmin() steht vor dem Laden');
  assert.match(route, /await ladeTextBytesFuerZip\(params\.id, texteintraege\)/);
  assert.match(route, /geladen\.push\(\.\.\.texte\.geladen\)/);
  assert.match(route, /fehlgeschlagen\.push\(\.\.\.texte\.fehlgeschlagen\)/, 'fehlende Texte stehen in FEHLENDE_DATEIEN.txt');
  assert.match(route, /gesamt > MAX_DATEIEN_IM_ZIP[\s\S]*?status: 413/, 'das Limit gilt für Logos und Texte zusammen');
  assert.match(route, /gesamt === 0[\s\S]*?status: 404/, 'nur ohne Logo UND ohne Text gibt es nichts herunterzuladen');
  assert.match(route, /export const maxDuration = \d+/);
});
