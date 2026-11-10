/**
 * Tempo der Bestell-Detailseite (getOrderDetail), Fund vom 2026-11-10:
 * "Wenn ich auf die Bestellung drücke, dauert es lange, bis die Seite aufgeht."
 *
 * Ursache: Die Funktion stellte rund 17 Datenbank- und Speicherabfragen STRIKT NACHEINANDER, dazu bei
 * jedem Öffnen einer bezahlten Bestellung vier weitere Lese-/Schreibaufrufe der Lieferanten-Einreihung –
 * auch wenn die nichts mehr zu tun hatte. Jede Abfrage kostet einen vollen Netzwerk-Roundtrip.
 *
 * Diese Tests führen den ECHTEN Code gegen eine Netz-Attrappe aus (Muster wie textDownload.test.ts),
 * die jede Antwort kurz verzögert und dabei mitzählt, wie viele Antworten schon fertig waren, als ein
 * Aufruf losging. Daran ist die Parallelität ohne Zeitmessung beweisbar: Läuft Code nacheinander, startet
 * der zweite Aufruf erst nach der ersten Antwort – bei parallelem Code starten alle vor der ersten.
 * Zusätzlich: Inhalt und Fehlerhinweise bleiben unverändert, die Einreihung läuft weiterhin, wenn sie
 * etwas bewirken kann, und entfällt, wenn nicht.
 */
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { getOrderDetail } from '../data';
import { buildSupplierPositions } from '@/lib/suppliers/buildSupplierPositions';
import { einreihungNoetig } from '@/lib/suppliers/lifecycle/status';

const DB = 'https://db.example.invalid';
const ENV: Record<string, string | undefined> = {
  NEXT_PUBLIC_SUPABASE_URL: DB,
  SUPABASE_SECRET_KEY: 'sb_secret_test',
  E2E_TESTMODUS: undefined, // echter Pfad, nicht die lokale Testablage
};

const BESTELLUNG = 'f5ee034e-2ee2-4994-9496-98cfa6e791d8';
const POSITION = 'a0000000-0000-4000-8000-000000000001';
const TEXT = 'e0000000-0000-4000-8000-000000000001';
const LOGO = 'e0000000-0000-4000-8000-000000000003';
const PRODUKT = 'justhoods-college-hoodie';
const FARBE = 'grey';

interface Aufruf {
  methode: string;
  pfad: string;
  suche: URLSearchParams;
  /** Wie viele Antworten waren schon geliefert, als dieser Aufruf losging? */
  fertigBeiStart: number;
}

let aufrufe: Aufruf[];
let fertig: number;
let bestellung: Record<string, unknown> | null;
let lieferantenAuftraege: Record<string, unknown>[];

const alteUmgebung: Record<string, string | undefined> = {};
const alterFetch = globalThis.fetch;
const alteKonsole = { error: console.error, warn: console.warn };

function bestellZeile(ueberschreibe: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: BESTELLUNG,
    order_number: 'ER-2026-F5EE03',
    created_at: '2026-01-05T10:00:00.000Z', // lange her: Stornofrist vorbei
    order_type: 'order',
    status: 'confirmed',
    payment_status: 'paid',
    payment_method: 'paypal',
    customer_name: 'Test Kunde',
    company: null,
    email: 'kunde@example.invalid',
    phone: null,
    message: null,
    total_price: 59.9,
    tax_amount: null,
    tax_rate: null,
    net_total: null,
    shipping_street: 'Musterstraße 1',
    shipping_zip: '50667',
    shipping_city: 'Köln',
    shipping_country: 'DE',
    pdf_url: `orders/${BESTELLUNG}/produktionsblatt.pdf`,
    tracking_number: null,
    shipped_at: null,
    invoice_number: null,
    invoice_pdf_url: null,
    dhl_label_url: null,
    cancellation_source: null,
    refund_status: 'not_applicable',
    refund_amount_cent: null,
    refund_reference: null,
    refunded_at: null,
    order_confirmation_sent_at: '2026-01-05T10:01:00.000Z',
    freigabe_angefragt_am: null,
    freigabe_erteilt_am: null,
    ...ueberschreibe,
  };
}

const POSITIONEN = [
  {
    id: POSITION,
    product_id: PRODUKT,
    product_name: 'College Hoodie',
    color_id: FARBE,
    color_name: 'Grau',
    print_method: 'dtf',
    size_quantities: { M: 2 },
    unit_price: 29.95,
    quantity: 2,
  },
];

const ELEMENTE = [
  {
    id: TEXT,
    order_item_id: POSITION,
    element_type: 'text',
    view: 'back',
    x_cm: 4.5,
    y_cm: 3.1,
    width_cm: 20.9,
    height_cm: 11.4,
    rotation_deg: 0,
    text_content: 'Team\nSchüplitz',
    font_family: 'Impact',
    font_size: 48,
    font_color: '#5c5c5c',
    font_weight: 'bold',
    font_style: 'italic',
    text_align: 'center',
  },
  {
    id: LOGO,
    order_item_id: POSITION,
    element_type: 'logo',
    view: 'front',
    x_cm: 1,
    y_cm: 1,
    width_cm: 8,
    height_cm: 8,
    rotation_deg: 0,
    file_name: 'herz.png',
    display_file_url: `orders/${BESTELLUNG}/logo-display.png`,
    original_file_url: `orders/${BESTELLUNG}/logo-original.png`,
  },
];

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

async function netz(eingabe: string | URL | Request, init?: RequestInit): Promise<Response> {
  const url = new URL(typeof eingabe === 'string' ? eingabe : eingabe instanceof URL ? eingabe.href : eingabe.url);
  if (url.hostname !== 'db.example.invalid') throw new Error(`Unerwarteter Netzaufruf: ${url.href}`);
  const methode = (init?.method ?? (eingabe instanceof Request ? eingabe.method : 'GET')).toUpperCase();
  const kopf = new Headers(init?.headers ?? (eingabe instanceof Request ? eingabe.headers : undefined));
  const einzelnesObjekt = (kopf.get('accept') ?? '').includes('vnd.pgrst.object');

  aufrufe.push({ methode, pfad: url.pathname, suche: url.searchParams, fertigBeiStart: fertig });
  // Kurze Verzögerung: Nur so lassen sich "nacheinander" und "gleichzeitig" unterscheiden.
  await new Promise((r) => setTimeout(r, 8));
  fertig++;

  const p = url.pathname;
  if (p === '/rest/v1/orders' && methode === 'GET') {
    if (!bestellung) return json({ code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned', details: 'The result contains 0 rows', hint: null }, 406);
    return json(einzelnesObjekt ? bestellung : [bestellung]);
  }
  if (p === '/rest/v1/order_items') return json(POSITIONEN);
  if (p === '/rest/v1/configuration_elements') return json(ELEMENTE);
  if (p === '/rest/v1/supplier_orders' && methode === 'GET') return json(lieferantenAuftraege);
  if (p === '/rest/v1/order_events' && methode === 'GET') {
    const gefiltert = url.searchParams.has('event_type');
    return json(
      gefiltert
        ? [{ event_type: 'shipping_label_failed', reason: 'DHL nicht erreichbar', detail: null, at: '2026-01-06T09:00:00.000Z' }]
        : [
            { event_type: 'shipping_label_failed', from_status: null, to_status: null, reason: 'DHL nicht erreichbar', detail: null, at: '2026-01-06T09:00:00.000Z' },
            { event_type: 'status_changed', from_status: 'new', to_status: 'confirmed', reason: null, detail: null, at: '2026-01-05T10:02:00.000Z' },
          ]
    );
  }
  if (p.startsWith('/rest/v1/')) return json([], methode === 'POST' ? 201 : 200); // Schreibaufrufe der Einreihung
  if (p === '/storage/v1/object/list/production-files') {
    return json([{ name: 'logo-original.png', metadata: { size: 4096, mimetype: 'image/png' } }]);
  }
  if (p.startsWith('/storage/v1/object/sign/production-files/')) {
    return json({ signedURL: `${p.replace('/storage/v1', '')}?token=t` });
  }
  throw new Error(`Unerwarteter Aufruf: ${methode} ${p}`);
}

beforeEach(() => {
  aufrufe = [];
  fertig = 0;
  bestellung = bestellZeile();
  lieferantenAuftraege = [];
  for (const [name, wert] of Object.entries(ENV)) {
    alteUmgebung[name] = process.env[name];
    if (wert === undefined) delete process.env[name];
    else process.env[name] = wert;
  }
  globalThis.fetch = netz as typeof fetch;
  console.error = () => {};
  console.warn = () => {};
});

afterEach(() => {
  for (const [name, wert] of Object.entries(alteUmgebung)) {
    if (wert === undefined) delete process.env[name];
    else process.env[name] = wert;
  }
  globalThis.fetch = alterFetch;
  console.error = alteKonsole.error;
  console.warn = alteKonsole.warn;
});

const erwarteteLieferanten = (): string[] =>
  Object.keys(
    buildSupplierPositions(BESTELLUNG, [{ productId: PRODUKT, colorId: FARBE, sizeQuantities: { M: 2 } }]).positionsBySupplier
  );

const schreibend = () => aufrufe.filter((a) => a.methode !== 'GET' && a.pfad.startsWith('/rest/v1/'));
const lesungen = (tabelle: string) => aufrufe.filter((a) => a.methode === 'GET' && a.pfad === `/rest/v1/${tabelle}`);

// ── Parallelität ──────────────────────────────────────────────────────────

test('Die fünf Abfragen, die nur die Bestellkennung brauchen, starten alle, bevor die erste antwortet', async () => {
  bestellung = bestellZeile({ created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString() }); // Stornofrist läuft noch
  const detail = await getOrderDetail(BESTELLUNG);
  assert.ok(detail);

  const ersteFuenf = aufrufe.slice(0, 5);
  assert.deepEqual(
    ersteFuenf.map((a) => a.pfad).sort(),
    [
      '/rest/v1/order_events',
      '/rest/v1/order_items',
      '/rest/v1/orders',
      '/rest/v1/supplier_orders',
      '/storage/v1/object/list/production-files',
    ],
    'Bestellung, Positionen, Dateiliste, Lieferantenaufträge und Historie – in genau dieser Gruppe'
  );
  for (const a of ersteFuenf) {
    assert.equal(a.fertigBeiStart, 0, `${a.pfad} musste warten, obwohl es nur die Bestellkennung braucht`);
  }
});

test('Insgesamt höchstens drei Wellen (Ebenen) statt rund siebzehn nacheinander', async () => {
  bestellung = bestellZeile({ created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString() });
  await getOrderDetail(BESTELLUNG);

  const wellen = new Set(aufrufe.map((a) => a.fertigBeiStart));
  assert.ok(
    wellen.size <= 3,
    `erwartet höchstens 3 Wellen, gefunden ${wellen.size}: ${[...wellen].join(', ')} (Aufrufe: ${aufrufe.length})`
  );
});

test('Elemente, Fehlerhinweise und Dokument-Links laden gleichzeitig (zweite Ebene)', async () => {
  await getOrderDetail(BESTELLUNG);
  const elemente = lesungen('configuration_elements')[0]!;
  const fehlerabfrage = lesungen('order_events').find((a) => a.suche.has('event_type'));
  const produktionsblatt = aufrufe.find((a) => a.pfad.includes('/sign/production-files/orders/') && a.pfad.endsWith('produktionsblatt.pdf'));
  assert.ok(fehlerabfrage && produktionsblatt, 'beide Aufrufe müssen stattfinden');
  assert.equal(fehlerabfrage.fertigBeiStart, elemente.fertigBeiStart);
  assert.equal(produktionsblatt.fertigBeiStart, elemente.fertigBeiStart, 'das Produktionsblatt-Link braucht nur die Bestellung, nicht die Elemente');
});

// ── Inhalt bleibt gleich ──────────────────────────────────────────────────

test('Der Inhalt der Detailseite ist unverändert: Positionen, Elemente, Links, Historie, Fehlerhinweis', async () => {
  lieferantenAuftraege = [
    { supplier_id: 'justhoods', status: 'cart_prepared', mode: 'prepare-cart', updated_at: '2026-01-05T12:00:00Z', last_run: null },
  ];
  const detail = await getOrderDetail(BESTELLUNG);
  assert.ok(detail);
  assert.equal(detail.orderNumber, 'ER-2026-F5EE03');
  assert.equal(detail.items.length, 1);
  const position = detail.items[0]!;
  assert.deepEqual(
    position.elements.map((e) => [e.type, e.view]),
    [['text', 'back'], ['logo', 'front']]
  );
  const logo = position.elements.find((e) => e.type === 'logo')!;
  assert.match(logo.logoPreviewUrl ?? '', /logo-display\.png/);
  assert.equal(logo.originalDateiVorhanden, true);
  assert.equal(logo.fileSizeBytes, 4096);
  assert.deepEqual(Object.keys(position.previewUrlByView).sort(), ['back', 'front']);
  assert.match(position.previewUrlByView.back ?? '', /preview-item0-back\.png/);
  assert.match(detail.productionSheetUrl ?? '', /produktionsblatt\.pdf/);
  assert.equal(detail.invoicePdfUrl, null);
  assert.equal(detail.events.length, 2);
  assert.equal(detail.events[0]!.eventType, 'shipping_label_failed');
  assert.equal(detail.lastShippingError, 'DHL nicht erreichbar');
  assert.equal(detail.lastInvoiceError, null);
  assert.deepEqual(
    detail.supplierOrders.map((s) => [s.supplierId, s.status]),
    [['justhoods', 'cart_prepared']]
  );
  assert.ok(Object.keys(detail.supplierDraft.positionsBySupplier).length > 0);
});

test('Eine unbekannte Bestellung liefert null (die Seite zeigt "nicht gefunden")', async () => {
  bestellung = null;
  assert.equal(await getOrderDetail(BESTELLUNG), null);
});

// ── Lieferanten-Einreihung ────────────────────────────────────────────────

test('Sind alle Lieferantenaufträge schon weiter als "queued", entfällt die Einreihung ganz (kein Schreiben, keine Doppellesung)', async () => {
  const lieferanten = erwarteteLieferanten();
  assert.ok(lieferanten.length > 0, 'Testprodukt muss einem Lieferanten zugeordnet sein');
  lieferantenAuftraege = lieferanten.map((id) => ({
    supplier_id: id, status: 'cart_prepared', mode: 'prepare-cart', updated_at: '2026-01-05T12:00:00Z', last_run: null,
  }));

  await getOrderDetail(BESTELLUNG);

  assert.equal(schreibend().length, 0, 'es darf nichts geschrieben werden');
  assert.equal(lesungen('orders').length, 1, 'die Bestellung wird genau einmal gelesen');
  assert.equal(lesungen('order_items').length, 1, 'die Positionen werden genau einmal gelesen');
});

test('Fehlt ein Lieferantenauftrag, läuft die Einreihung weiterhin – und zwar nebenher, nicht hintendran', async () => {
  lieferantenAuftraege = [];
  await getOrderDetail(BESTELLUNG);

  const upsert = schreibend().find((a) => a.pfad === '/rest/v1/supplier_orders');
  assert.ok(upsert, 'der fehlende Auftrag wird angelegt');
  const zweiteBestellLesung = lesungen('orders')[1];
  assert.ok(zweiteBestellLesung, 'die Einreihung liest die Bestellung selbst noch einmal');
  const elemente = lesungen('configuration_elements')[0]!;
  assert.equal(zweiteBestellLesung.fertigBeiStart, elemente.fertigBeiStart, 'sie startet gleichzeitig mit der zweiten Ebene');
});

for (const status of ['draft', 'queued']) {
  test(`Steht ein Lieferantenauftrag noch in "${status}", läuft die Einreihung weiterhin`, async () => {
    lieferantenAuftraege = erwarteteLieferanten().map((id) => ({
      supplier_id: id, status, mode: 'prepare-cart', updated_at: '2026-01-05T12:00:00Z', last_run: null,
    }));
    await getOrderDetail(BESTELLUNG);
    assert.ok(schreibend().some((a) => a.pfad === '/rest/v1/supplier_orders'), 'Snapshot/Status werden bearbeitet');
  });
}

test('Innerhalb der Stornofrist, bei Anfragen und unbezahlten Bestellungen entsteht nie ein Lieferantenauftrag', async () => {
  const faelle: Record<string, unknown>[] = [
    { created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
    { order_type: 'inquiry' },
    { payment_status: 'pending' },
    { status: 'cancelled' },
  ];
  for (const abweichung of faelle) {
    aufrufe = [];
    fertig = 0;
    bestellung = bestellZeile(abweichung);
    lieferantenAuftraege = [];
    await getOrderDetail(BESTELLUNG);
    assert.equal(schreibend().length, 0, `kein Schreiben bei ${JSON.stringify(abweichung)}`);
    assert.equal(lesungen('orders').length, 1, `keine zweite Bestell-Lesung bei ${JSON.stringify(abweichung)}`);
  }
});

test('Scheitert die Einreihung, öffnet sich die Seite trotzdem (nicht-fatal)', async () => {
  lieferantenAuftraege = [];
  const normal = globalThis.fetch;
  globalThis.fetch = (async (eingabe: string | URL | Request, init?: RequestInit) => {
    const url = new URL(typeof eingabe === 'string' ? eingabe : eingabe instanceof URL ? eingabe.href : eingabe.url);
    if ((init?.method ?? 'GET').toUpperCase() === 'POST' && url.pathname === '/rest/v1/supplier_orders') {
      throw new Error('Datenbank hat sich verschluckt');
    }
    return normal(eingabe as string, init);
  }) as typeof fetch;
  const detail = await getOrderDetail(BESTELLUNG);
  assert.ok(detail, 'die Seite wird trotzdem geliefert');
  assert.equal(detail.items.length, 1);
});

// ── einreihungNoetig (reine Entscheidung) ─────────────────────────────────

test('einreihungNoetig: nur wenn ein Auftrag fehlt oder noch in draft/queued steht', () => {
  assert.equal(einreihungNoetig([], []), false, 'nichts zu liefern → nichts zu tun');
  assert.equal(einreihungNoetig(['a'], []), true, 'Auftrag fehlt');
  assert.equal(einreihungNoetig(['a'], [{ supplierId: 'a', status: 'draft' }]), true);
  assert.equal(einreihungNoetig(['a'], [{ supplierId: 'a', status: 'queued' }]), true);
  for (const status of ['processing', 'cart_prepared', 'ordered', 'blocked', 'paused', 'failed', 'cancelled', 'unbekannt']) {
    assert.equal(einreihungNoetig(['a'], [{ supplierId: 'a', status }]), false, status);
  }
  assert.equal(
    einreihungNoetig(['a', 'b'], [{ supplierId: 'a', status: 'ordered' }]),
    true,
    'der zweite Lieferant hat noch keinen Auftrag'
  );
  assert.equal(
    einreihungNoetig(['a'], [{ supplierId: 'a', status: 'ordered' }, { supplierId: 'x', status: 'draft' }]),
    false,
    'fremde Aufträge, die nicht erwartet werden, lösen nichts aus'
  );
});

// ── Ladebildschirm ────────────────────────────────────────────────────────

test('Die Detailseite hat einen Ladebildschirm, damit der Klick sofort eine Reaktion zeigt', () => {
  const datei = path.join(process.cwd(), 'src', 'app', 'admin', 'bestellung', '[id]', 'loading.tsx');
  assert.ok(existsSync(datei), 'loading.tsx fehlt');
  const quelltext = readFileSync(datei, 'utf8');
  assert.match(quelltext, /export default function/);
  assert.match(quelltext, /role="status"/, 'Screenreader erfahren, dass geladen wird');
  assert.match(quelltext, /Bestellung wird geladen/);
});
