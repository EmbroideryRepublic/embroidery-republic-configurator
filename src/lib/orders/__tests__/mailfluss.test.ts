/**
 * DURCHLAUFTEST DES E-MAIL-WEGS bei Bestellung und Anfrage – mit dem ECHTEN Code.
 *
 * Anders als die Architekturtests daneben (Quelltext-Prüfung) läuft hier der
 * tatsächliche Pfad: verarbeiteBestelleingang → sendEmail → Resend-SDK, ebenso
 * Stornierung und Nachholweg gegen den Supabase-Client. Nur das NETZ ist
 * ersetzt: `globalThis.fetch` fängt jeden Aufruf ab, beantwortet ihn wie
 * Resend bzw. Supabase und hält ihn fest. So lässt sich belegen, was bei einem
 * Eingang WIRKLICH versendet wird – ohne dass je eine Nachricht oder ein
 * Datenbankzugriff nach draußen geht (jeder unerwartete Aufruf bricht den Test).
 *
 * Gesichert werden die Zusagen an den Betreiber (Entscheidung 2026-11-08):
 *   • bei JEDER Anfrage und JEDER regulären Bestellung SOFORT eine interne Mail,
 *   • mit allen relevanten Angaben,
 *   • "Antworten" geht an die Kundschaft (Reply-To),
 *   • nie doppelt, bei kurzem Aussetzer des Versanddienstes mit Wiederholung,
 *   • was nie ankam, wird vom Cron-Lauf nachgeholt.
 */
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { verarbeiteBestelleingang } from '../orderIntake';
import { storniereBestellungDurchKunden } from '../orderService';
import { holeAbschlussFuerRetryNach, holeOffeneBetreibermeldungenNach } from '../orderCompletion';
import type { OrderRecord } from '@/lib/actions/orderTypes';

// ── Umgebung und Netz-Attrappe ───────────────────────────────────────────

const DB = 'https://db.example.invalid';
const BETREIBER = 'betreiber@example.invalid';
const ABSENDER = 'info@example.invalid';
const LOGO_PFAD = 'orders/anfrage-1/item-0-logo-el1-original.png';

const ENV: Record<string, string> = {
  NEXT_PUBLIC_SUPABASE_URL: DB,
  SUPABASE_SECRET_KEY: 'sb_secret_test',
  RESEND_API_KEY: 're_test',
  EMAIL_TEST_MODE: 'false',
  INTERNAL_NOTIFICATION_EMAIL: BETREIBER,
  RESEND_FROM_EMAIL: ABSENDER,
  EMAIL_REPLY_TO: ABSENDER,
  ORDER_TOKEN_SECRET: 'a'.repeat(48),
  NEXT_PUBLIC_SITE_URL: 'https://shop.example.invalid',
};

interface Aufruf {
  url: URL;
  methode: string;
  body: Record<string, unknown> | unknown[] | string | undefined;
}

interface Zustand {
  aufrufe: Aufruf[];
  /** Antworten für interne Meldungen (Betreff beginnt mit "Neue …" bzw. "Bestellung storniert"). */
  interneAntworten: { status: number; body: unknown }[];
  /** Antwort auf POST /emails/<id>/cancel. */
  widerrufStatus: number;
  /** Ergebnis der Marker-Abfrage (Spalten internal_notification_email_id, payment_method). */
  markerZeile: Record<string, unknown>;
  /** Zeile für die Selbststornierung. */
  stornoZeile: Record<string, unknown> | null;
  /** Kandidaten des Nachholwegs. */
  anfragenKandidaten: Record<string, unknown>[];
  bestellKandidaten: Record<string, unknown>[];
  historie: Record<string, unknown>[];
  /** Vollständige Zeile je Bestellung für ladeBestellungFuerAbschluss. */
  bestellung: Record<string, unknown> | null;
  positionen: Record<string, unknown>[];
  elemente: Record<string, unknown>[];
  mailZaehler: number;
}

let z: Zustand;
const alteUmgebung: Record<string, string | undefined> = {};
const alterFetch = globalThis.fetch;
const alteKonsole = { info: console.info, warn: console.warn, error: console.error, log: console.log };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function istInterneMeldung(body: unknown): boolean {
  const betreff = String((body as { subject?: string } | undefined)?.subject ?? '');
  return /^(Neue Bestellung|Neue Anfrage|Bestellung storniert)/.test(betreff);
}

function netz(eingabe: string | URL | Request, init?: RequestInit): Promise<Response> {
  const url = new URL(typeof eingabe === 'string' ? eingabe : eingabe instanceof URL ? eingabe.href : eingabe.url);
  const methode = (init?.method ?? 'GET').toUpperCase();
  let body: Aufruf['body'];
  if (typeof init?.body === 'string') {
    try {
      body = JSON.parse(init.body);
    } catch {
      body = init.body;
    }
  }
  z.aufrufe.push({ url, methode, body });

  // ── Resend ──
  if (url.hostname === 'api.resend.com') {
    if (url.pathname === '/emails' && methode === 'POST') {
      if (istInterneMeldung(body) && z.interneAntworten.length > 0) {
        const a = z.interneAntworten.shift()!;
        return Promise.resolve(json(a.body, a.status));
      }
      return Promise.resolve(json({ id: `msg_${++z.mailZaehler}` }));
    }
    if (/^\/emails\/[^/]+\/cancel$/.test(url.pathname)) {
      return Promise.resolve(
        z.widerrufStatus === 200
          ? json({ object: 'email', id: 'msg_alt' })
          : json({ name: 'validation_error', message: 'Only scheduled emails can be cancelled.', statusCode: z.widerrufStatus }, z.widerrufStatus)
      );
    }
  }

  // ── Supabase ──
  if (url.hostname === 'db.example.invalid') {
    if (url.pathname.startsWith('/rest/v1/rpc/')) return Promise.resolve(json(true));
    if (url.pathname.startsWith('/storage/v1/object/sign/')) {
      return Promise.resolve(json({ signedURL: `${url.pathname.replace('/storage/v1', '')}?token=t` }));
    }
    if (url.pathname === '/rest/v1/orders') {
      if (methode === 'PATCH') return Promise.resolve(json([{ id: 'x' }]));
      const typ = url.searchParams.get('order_type');
      if (typ === 'eq.inquiry') return Promise.resolve(json(z.anfragenKandidaten));
      if (typ === 'eq.order') return Promise.resolve(json(z.bestellKandidaten));
      const spalten = url.searchParams.get('select') ?? '';
      if (spalten.includes('customer_name') && spalten.includes('accounting_ready_at')) return Promise.resolve(json(z.stornoZeile ? [z.stornoZeile] : []));
      if (spalten.includes('order_number') && spalten.includes('shipping_street')) return Promise.resolve(json(z.bestellung ? [z.bestellung] : []));
      return Promise.resolve(json([z.markerZeile]));
    }
    if (url.pathname === '/rest/v1/order_events') {
      return Promise.resolve(methode === 'GET' ? json(z.historie) : new Response(null, { status: 201 }));
    }
    if (url.pathname === '/rest/v1/order_items') return Promise.resolve(json(z.positionen));
    if (url.pathname === '/rest/v1/configuration_elements') return Promise.resolve(json(z.elemente));
    return Promise.resolve(methode === 'GET' ? json([]) : new Response(null, { status: 201 }));
  }

  return Promise.reject(new Error(`Unerwarteter Netzaufruf im Test: ${methode} ${url.href}`));
}

beforeEach(() => {
  z = {
    aufrufe: [],
    interneAntworten: [],
    widerrufStatus: 422,
    markerZeile: { internal_notification_email_id: null, payment_method: null },
    stornoZeile: null,
    anfragenKandidaten: [],
    bestellKandidaten: [],
    historie: [],
    bestellung: null,
    positionen: [],
    elemente: [],
    mailZaehler: 0,
  };
  for (const [name, wert] of Object.entries(ENV)) {
    alteUmgebung[name] = process.env[name];
    process.env[name] = wert;
  }
  alteUmgebung.E2E_TESTMODUS = process.env.E2E_TESTMODUS;
  delete process.env.E2E_TESTMODUS;
  globalThis.fetch = netz as typeof fetch;
  // Die Produktionspfade protokollieren ausführlich – im Testlauf stumm.
  console.info = console.warn = console.error = console.log = () => {};
});

afterEach(() => {
  for (const [name, wert] of Object.entries(alteUmgebung)) {
    if (wert === undefined) delete process.env[name];
    else process.env[name] = wert;
  }
  globalThis.fetch = alterFetch;
  Object.assign(console, alteKonsole);
});

// ── Hilfen zum Auswerten ─────────────────────────────────────────────────

interface Mail {
  to: string[];
  subject: string;
  reply_to?: string;
  scheduled_at?: string;
  html: string;
  text: string;
  from: string;
}

function mails(): Mail[] {
  return z.aufrufe
    .filter((a) => a.url.hostname === 'api.resend.com' && a.url.pathname === '/emails' && a.methode === 'POST')
    .map((a) => {
      const b = a.body as Record<string, unknown>;
      return {
        to: ([] as string[]).concat(b.to as string | string[]),
        subject: String(b.subject),
        reply_to: b.reply_to as string | undefined,
        scheduled_at: b.scheduled_at as string | undefined,
        html: String(b.html ?? ''),
        text: String(b.text ?? ''),
        from: String(b.from),
      };
    });
}

const anBetreiber = () => mails().filter((m) => m.to.includes(BETREIBER));
const anKundschaft = (adresse: string) => mails().filter((m) => m.to.includes(adresse));

function patchesAufOrders(): Record<string, unknown>[] {
  return z.aufrufe
    .filter((a) => a.url.pathname === '/rest/v1/orders' && a.methode === 'PATCH')
    .map((a) => a.body as Record<string, unknown>);
}

function historieEintraege(): Record<string, unknown>[] {
  return z.aufrufe
    .filter((a) => a.url.pathname === '/rest/v1/order_events' && a.methode === 'POST')
    .map((a) => a.body as Record<string, unknown>);
}

// ── Beispieldaten ────────────────────────────────────────────────────────

const stickereiAnfrage: OrderRecord = {
  id: 'anfrage-1',
  orderNumber: 'ER-2026-ANF001',
  orderType: 'inquiry',
  createdAt: new Date().toISOString(),
  contact: { name: 'Erika Beispiel', company: 'Muster Sport e. V.', email: 'erika@example.invalid', phone: '0221 123456' },
  message: 'Wir brauchen die Trikots bis Ende Dezember.',
  totalPrice: 123.45,
  items: [
    {
      productId: 'heavy-t',
      colorId: 'weiss',
      productName: 'Heavy T',
      colorName: 'Weiß',
      printMethod: 'embroidery',
      sizeQuantities: { M: 2, L: 1 },
      quantity: 3,
      unitPrice: 41.15,
      totalPrice: 123.45,
      elements: [
        {
          type: 'logo',
          view: 'front',
          xCm: 2,
          yCm: 3,
          widthCm: 8,
          heightCm: 6,
          rotationDeg: 0,
          fileName: 'vereinslogo.png',
          logoStoragePath: LOGO_PFAD,
          geschaetzteStiche: 12400,
        },
      ],
    },
  ],
};

const druckBestellung: OrderRecord = {
  id: 'bestellung-1',
  orderNumber: 'ER-2026-BES001',
  orderType: 'order',
  createdAt: new Date().toISOString(),
  contact: { name: 'Max Mustermann', email: 'max@example.invalid' },
  shipping: { street: 'Musterstraße 1', zip: '12345', city: 'Musterstadt', country: 'Deutschland' },
  paymentMethod: 'invoice',
  subtotal: 22.99,
  shippingCost: 6.9,
  totalPrice: 29.89,
  items: [
    {
      productId: 'heavy-t',
      colorId: 'weiss',
      productName: 'Heavy T',
      colorName: 'Weiß',
      printMethod: 'dtf',
      sizeQuantities: { M: 1 },
      quantity: 1,
      unitPrice: 22.99,
      totalPrice: 22.99,
      elements: [{ type: 'text', view: 'front', xCm: 2, yCm: 2, widthCm: 10, heightCm: 4, rotationDeg: 0, content: 'Muster', fontFamily: 'Arial', color: '#000000' }],
    },
  ],
};

// ── Eingang einer Stickerei-Anfrage ──────────────────────────────────────

test('Anfrage mit Stickerei: Der Betreiber bekommt SOFORT eine vollständige Mail, Antworten gehen an die Kundschaft', async () => {
  await verarbeiteBestelleingang(stickereiAnfrage, 'https://example.invalid/blatt.pdf');

  const intern = anBetreiber();
  assert.equal(intern.length, 1, 'genau eine interne Mail');
  const mail = intern[0]!;
  assert.equal(mail.subject, 'Neue Anfrage (Stickerei): ER-2026-ANF001');
  assert.equal(mail.reply_to, 'erika@example.invalid', 'Antworten müssen bei der Kundschaft landen');
  assert.equal(mail.scheduled_at, undefined, 'nicht eingeplant, sondern sofort');
  assert.match(mail.from, new RegExp(`<${ABSENDER}>`));

  // alle relevanten Angaben
  for (const erwartet of [
    'Erika Beispiel',
    'Muster Sport e. V.',
    'erika@example.invalid',
    '0221 123456',
    'Wir brauchen die Trikots bis Ende Dezember.',
    'Heavy T',
    'Stickerei',
    '3 Stück',
    '2× M, 1× L',
    'vereinslogo.png',
    '8,0 × 6,0 cm',
    'ca. 12.400 Stiche',
    'Geschätzter Gesamtpreis (unverbindlich)',
    '123,45',
    'Anfrage – noch kein Vertrag',
  ]) {
    assert.ok(mail.text.includes(erwartet) || mail.html.includes(erwartet), `fehlt in der Mail: ${erwartet}`);
  }
  // Link auf die Originaldatei und das Produktionsblatt
  assert.match(mail.html, /production-files\/orders\/anfrage-1\/item-0-logo-el1-original\.png\?token=t/);
  assert.match(mail.html, /https:\/\/example\.invalid\/blatt\.pdf/);
});

test('Anfrage mit Stickerei: Die Kundschaft bekommt nur eine Eingangsbestätigung – keine Auftragsbestätigung', async () => {
  await verarbeiteBestelleingang(stickereiAnfrage, null);

  const kunde = anKundschaft('erika@example.invalid');
  assert.equal(kunde.length, 1);
  const mail = kunde[0]!;
  assert.equal(mail.subject, 'Ihre Anfrage ER-2026-ANF001 ist eingegangen');
  assert.equal(mail.reply_to, ABSENDER, 'Rückfragen der Kundschaft erreichen den Betrieb');
  assert.match(mail.text, /ist bei uns eingegangen und wird jetzt von uns geprüft/);
  assert.match(mail.text, /keine Auftragsbestätigung/);
  assert.match(mail.text, /kein Vertrag geschlossen/);
  assert.match(mail.text, /Ein Vertrag kommt erst zustande, wenn Sie dieses Angebot annehmen und wir den\s+Auftrag bestätigen/);
  assert.doesNotMatch(mail.subject + mail.text, /Bestellbestätigung|Zahlungsart|Lieferadresse|stornieren/);
});

test('Anfrage: Der Nachweis der Meldung wird festgehalten (Schutz vor Doppelmeldung und Grundlage des Nachholwegs)', async () => {
  await verarbeiteBestelleingang(stickereiAnfrage, null);
  const marker = patchesAufOrders().find((p) => 'internal_notification_email_id' in p);
  assert.ok(marker?.internal_notification_email_id, 'internal_notification_email_id muss gesetzt werden');
  const versand = historieEintraege().find((e) => e.event_type === 'email_sent' && (e.detail as { anlass?: string })?.anlass === 'internal_order_notification');
  assert.ok(versand, 'der Versand steht in der Bestell-Historie');
});

// ── Eingang einer regulären Bestellung ───────────────────────────────────

test('Reguläre Bestellung (Druck, auf Rechnung): sofortige interne Mail mit Adresse, Zahlungsart, Summen und Stornofrist', async () => {
  await verarbeiteBestelleingang(druckBestellung, null);

  const intern = anBetreiber();
  assert.equal(intern.length, 1);
  const mail = intern[0]!;
  assert.equal(mail.subject, 'Neue Bestellung: ER-2026-BES001');
  assert.equal(mail.reply_to, 'max@example.invalid');
  assert.equal(mail.scheduled_at, undefined, 'früher um die Stornofrist verzögert – jetzt sofort');
  for (const erwartet of ['Max Mustermann', 'max@example.invalid', 'Musterstraße 1, 12345 Musterstadt', 'Kauf auf Rechnung', 'Zwischensumme: 22,99 €', 'Versand: 6,90 €', 'Gesamtsumme: 29,89 €', 'Bestellung – verbindlich', 'bitte erst danach beschaffen und produzieren']) {
    assert.ok(mail.text.includes(erwartet), `fehlt in der Mail: ${erwartet}`);
  }

  const kunde = anKundschaft('max@example.invalid');
  assert.equal(kunde.length, 1);
  assert.equal(kunde[0]!.subject, 'Bestellbestätigung ER-2026-BES001');
});

test('Bestellung, deren Stornofrist schon läuft ab: Die Mail sagt, dass sie bearbeitet werden kann', async () => {
  const alt: OrderRecord = { ...druckBestellung, createdAt: new Date(Date.now() - 3 * 3_600_000).toISOString() };
  await verarbeiteBestelleingang(alt, null);
  assert.match(anBetreiber()[0]!.text, /Die Stornofrist der Kundschaft ist abgelaufen/);
});

// ── Keine Doppelmeldung ──────────────────────────────────────────────────

test('Ist die Meldung schon ausgelöst, geht sie bei einer Wiederholung NICHT ein zweites Mal an den Betreiber', async () => {
  z.markerZeile = { internal_notification_email_id: 'msg_alt', payment_method: null };
  await verarbeiteBestelleingang(stickereiAnfrage, null);
  assert.equal(anBetreiber().length, 0);
});

test('Der Wiederholungsweg einer Anfrage versendet nichts, solange die Meldung ausgelöst ist', async () => {
  z.markerZeile = { internal_notification_email_id: 'msg_alt', payment_method: null };
  await holeAbschlussFuerRetryNach('anfrage-1');
  assert.equal(mails().length, 0);
});

// ── Aussetzer des Versanddienstes ────────────────────────────────────────

test('Kurzer Aussetzer des Versanddienstes: zwei Wiederholungen, dann kommt die Meldung an', { timeout: 15_000 }, async () => {
  z.interneAntworten = [
    { status: 500, body: { name: 'internal_server_error', message: 'kurz weg', statusCode: 500 } },
    { status: 429, body: { name: 'rate_limit_exceeded', message: 'zu schnell', statusCode: 429 } },
  ];
  await verarbeiteBestelleingang(stickereiAnfrage, null);
  assert.equal(anBetreiber().length, 3, 'zwei Fehlversuche, ein erfolgreicher');
  assert.ok(patchesAufOrders().some((p) => p.internal_notification_email_id), 'danach gilt die Meldung als zugestellt');
});

test('Dauerhafter Fehler (z. B. ungültiger Absender): keine nutzlosen Wiederholungen, aber ein Eintrag in der Historie', async () => {
  z.interneAntworten = [{ status: 403, body: { name: 'validation_error', message: 'domain not verified', statusCode: 403 } }];
  await verarbeiteBestelleingang(stickereiAnfrage, null);
  assert.equal(anBetreiber().length, 1, 'ein einziger Versuch');
  assert.ok(historieEintraege().some((e) => e.event_type === 'email_failed' && (e.detail as { anlass?: string })?.anlass === 'internal_order_notification'));
  assert.ok(!patchesAufOrders().some((p) => p.internal_notification_email_id), 'ohne Zustellung kein Nachweis – der Nachholweg greift');
});

// ── Selbststornierung ────────────────────────────────────────────────────

const stornoZeile = () => ({
  id: 'bestellung-1',
  email: 'max@example.invalid',
  customer_name: 'Max Mustermann',
  created_at: new Date().toISOString(),
  status: 'new',
  order_type: 'order',
  internal_notification_email_id: 'msg_alt',
  accounting_ready_at: null,
  payment_status: 'not_required',
  order_number: 'ER-2026-BES001',
});

test('Storniert die Kundschaft, nachdem die Eingangsmeldung zugestellt ist, folgt eine Mail an den Betreiber', async () => {
  z.stornoZeile = stornoZeile();
  z.widerrufStatus = 422; // bereits zugestellt – nicht mehr zurückziehbar
  const ergebnis = await storniereBestellungDurchKunden('bestellung-1');
  assert.equal(ergebnis.ok, true);

  const intern = anBetreiber();
  assert.equal(intern.length, 1);
  assert.equal(intern[0]!.subject, 'Bestellung storniert: ER-2026-BES001');
  assert.equal(intern[0]!.reply_to, 'max@example.invalid');
  assert.match(intern[0]!.text, /Bitte nichts beschaffen und nichts produzieren/);

  const kunde = anKundschaft('max@example.invalid');
  assert.equal(kunde.length, 1);
  assert.match(kunde[0]!.subject, /Stornierung bestätigt/);
});

test('Eine noch GEPLANTE Meldung (Altbestand) wird zurückgezogen – dann braucht der Betreiber keine Storno-Mail', async () => {
  z.stornoZeile = stornoZeile();
  z.widerrufStatus = 200;
  await storniereBestellungDurchKunden('bestellung-1');
  assert.equal(anBetreiber().length, 0);
  assert.equal(anKundschaft('max@example.invalid').length, 1, 'die Bestätigung an die Kundschaft bleibt');
});

test('Eine Bestellung ohne Eingangsmeldung (z. B. unbezahlte Karte) löst keine Storno-Mail an den Betreiber aus', async () => {
  z.stornoZeile = { ...stornoZeile(), internal_notification_email_id: null };
  await storniereBestellungDurchKunden('bestellung-1');
  assert.equal(anBetreiber().length, 0);
});

// ── Nachholweg ───────────────────────────────────────────────────────────

function prepariereNachholen() {
  const kandidat = { id: 'anfrage-1', internal_notification_email_id: null, pdf_url: 'orders/anfrage-1/produktionsblatt.pdf' };
  z.anfragenKandidaten = [kandidat];
  z.bestellung = {
    id: 'anfrage-1',
    order_number: 'ER-2026-ANF001',
    created_at: new Date(Date.now() - 30 * 60_000).toISOString(),
    order_type: 'inquiry',
    customer_name: 'Erika Beispiel',
    company: 'Muster Sport e. V.',
    email: 'erika@example.invalid',
    phone: '0221 123456',
    message: 'Bitte bis Dezember.',
    total_price: 123.45,
    payment_method: null,
    shipping_street: null,
    shipping_zip: null,
    shipping_city: null,
    shipping_country: null,
    tax_rate: 0,
    tax_amount: 0,
    net_total: 123.45,
    customer_vat_id: null,
  };
  z.positionen = [
    { id: 'pos-1', product_id: 'heavy-t', product_name: 'Heavy T', color_id: 'weiss', color_name: 'Weiß', print_method: 'embroidery', size_quantities: { M: 3 }, quantity: 3, unit_price: 41.15, total_price: 123.45 },
  ];
  z.elemente = [
    { order_item_id: 'pos-1', element_type: 'logo', view: 'front', x_cm: 2, y_cm: 3, width_cm: 8, height_cm: 6, rotation_deg: 0, file_name: 'vereinslogo.png', original_file_url: LOGO_PFAD, display_file_url: null },
  ];
}

test('Nachholweg: Eine Anfrage, deren Meldung nie ankam, wird nachgemeldet – mit allen Angaben und Antwort an die Kundschaft', async () => {
  prepariereNachholen();
  const ergebnis = await holeOffeneBetreibermeldungenNach(10);
  assert.deepEqual(ergebnis, { gefunden: 1, zugestellt: 1, weiterhinOffen: 0 });

  const mail = anBetreiber()[0]!;
  assert.equal(mail.subject, 'Neue Anfrage (Stickerei): ER-2026-ANF001');
  assert.equal(mail.reply_to, 'erika@example.invalid');
  for (const erwartet of ['Erika Beispiel', 'Heavy T', 'vereinslogo.png', 'Geschätzter Gesamtpreis (unverbindlich)']) {
    assert.ok(mail.text.includes(erwartet), `fehlt: ${erwartet}`);
  }
  assert.match(mail.html, /production-files\/orders\/anfrage-1\/item-0-logo-el1-original\.png\?token=t/);
  assert.match(mail.html, /production-files\/orders\/anfrage-1\/produktionsblatt\.pdf\?token=t/);
  assert.ok(patchesAufOrders().some((p) => p.internal_notification_email_id), 'danach steht der Nachweis');
  assert.ok(historieEintraege().some((e) => e.event_type === 'email_sent' && (e.detail as { quelle?: string })?.quelle === 'nachgeholt'));
});

test('Nachholweg: Altbestand OHNE Nachweis-ID, dessen Meldung laut Historie zugestellt wurde, wird NICHT noch einmal gemeldet', async () => {
  prepariereNachholen();
  z.historie = [{ order_id: 'anfrage-1', detail: { anlass: 'internal_order_notification' } }];
  const ergebnis = await holeOffeneBetreibermeldungenNach(10);
  assert.equal(ergebnis.gefunden, 0);
  assert.equal(mails().length, 0);
});

test('Nachholweg: Mit Nachweis-ID oder ohne Kandidaten geschieht nichts', async () => {
  z.anfragenKandidaten = [{ id: 'anfrage-1', internal_notification_email_id: 'msg_alt', pdf_url: null }];
  assert.deepEqual(await holeOffeneBetreibermeldungenNach(10), { gefunden: 0, zugestellt: 0, weiterhinOffen: 0 });
  z.anfragenKandidaten = [];
  assert.deepEqual(await holeOffeneBetreibermeldungenNach(10), { gefunden: 0, zugestellt: 0, weiterhinOffen: 0 });
  assert.equal(mails().length, 0);
});

test('Nachholweg: Scheitert der Versand erneut, bleibt der Eingang offen und wird beim nächsten Lauf wieder versucht', async () => {
  prepariereNachholen();
  z.interneAntworten = [{ status: 403, body: { name: 'validation_error', message: 'domain not verified', statusCode: 403 } }];
  const ergebnis = await holeOffeneBetreibermeldungenNach(10);
  assert.deepEqual(ergebnis, { gefunden: 1, zugestellt: 0, weiterhinOffen: 1 });
  assert.ok(!patchesAufOrders().some((p) => p.internal_notification_email_id));
});
