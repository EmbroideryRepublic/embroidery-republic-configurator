/**
 * ═══════════════════════════════════════════════════════════════════════
 * LIVE-END-TO-END GEGEN DEN ECHTEN STRIPE-TESTMODUS
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Beweist den Stripe-Adapter unter realen Bedingungen. Kein Testdoppel:
 *
 *   • eroeffne / verwerfe laufen gegen die ECHTE Stripe-API (Testschlüssel,
 *     kein Geld – livemode=false wird zu Beginn geprüft).
 *   • leseEreignis prüft ECHTE Signaturen mit dem ECHTEN whsec (über das
 *     Stripe-SDK erzeugt, mit demselben Verfahren wie Stripes Zustellung).
 *   • verarbeiteZahlungsEreignis fährt den vollen Downstream: verbuchen,
 *     Phase 2 (Rendering, Produktionsblatt, E-Mail), Idempotenz, Fehlerfälle.
 *
 * ── Warum der Adapter direkt aufgerufen wird ──────────────────────────
 * Die Registry erzwingt im Testmodus bewusst den Testanbieter (Geld-
 * sicherung, freigegeben). Dieselbe Sicherung würde einen serverseitigen
 * Stripe-Lauf blockieren. Deshalb wird der Adapter hier DIREKT geprüft –
 * genau wie die Unit-Tests den Testanbieter direkt prüfen. Dass die Registry
 * im PRODUKTIVmodus den Stripe-Adapter liefert, prüft Teil D separat.
 *
 * Nebenwirkungen (E-Mail, Dateien, Lieferant) sind über E2E_TESTMODUS
 * abgefangen – es geht keine Mail raus und keine echte Datei in den Bucket.
 *
 * Aufruf: npx tsx --tsconfig tsconfig.scripts.json scripts/e2eStripe.mts
 */
process.env.E2E_TESTMODUS = 'aktiv';

import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import Stripe from 'stripe';

for (const zeile of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const t = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(zeile);
  if (t && !process.env[t[1]!]) process.env[t[1]!] = t[2]!.trim().replace(/^["']|["']$/g, '');
}

const { stripeAnbieter } = await import('@/lib/payments/providers/stripe');
const { verarbeiteZahlungsEreignis } = await import('@/lib/orders/paymentService');
const { waehleZahlungsAnbieter } = await import('@/lib/payments/registry');

const SECRET = process.env.STRIPE_SECRET_KEY!;
const WHSEC = process.env.STRIPE_WEBHOOK_SECRET!;
const stripe = new Stripe(SECRET);
const db = new pg.Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });

const pruefungen: { ok: boolean; text: string }[] = [];
function pruefe(ok: boolean, text: string): void {
  pruefungen.push({ ok, text });
  console.log(`  ${ok ? '✔' : '✘'} ${text}`);
}

const angelegteBestellungen: string[] = [];

/** Legt eine bezahlbereite Bestellung an (pending, card) mit einer Position. */
async function legeBestellung(betragEuro: number): Promise<string> {
  const { rows } = await db.query(
    `insert into orders (customer_name, email, order_type, quantity, total_price,
       tax_rate, tax_amount, net_total, shipping_street, shipping_zip, shipping_city, shipping_country,
       payment_method, payment_status, payment_provider)
     values ('E2E Stripe','stripe-e2e@example.invalid','order',3,$1,19,$2,$3,
       'Teststraße 1','12345','Teststadt','Deutschland','card','pending','stripe')
     returning id`,
    [betragEuro, Math.round((betragEuro - betragEuro / 1.19) * 100) / 100, Math.round((betragEuro / 1.19) * 100) / 100]
  );
  const id = rows[0].id as string;
  await db.query(
    `insert into order_items (order_id, product_id, product_name, color_id, color_name,
       print_method, size_quantities, quantity, unit_price, total_price)
     values ($1,'fotl-valueweight-t','Valueweight T','white','Weiß','dtf','{"M":3}',3,$2,$3)`,
    [id, Math.round((betragEuro / 3) * 100) / 100, betragEuro]
  );
  angelegteBestellungen.push(id);
  return id;
}

/** Baut ein echtes, mit dem echten whsec signiertes Stripe-Ereignis. */
function signiertesEreignis(typ: string, objekt: Record<string, unknown>): { body: string; sig: string } {
  const body = JSON.stringify({
    id: `evt_${randomUUID().replace(/-/g, '')}`,
    object: 'event',
    type: typ,
    data: { object: objekt },
  });
  const sig = stripe.webhooks.generateTestHeaderString({ payload: body, secret: WHSEC });
  return { body, sig };
}

/** Baut das Headers-Objekt, das leseEreignis() seit der PayPal-Anbindung
 *  entgegennimmt (Headers statt eines einzelnen Signatur-Strings – siehe
 *  lib/payments/types.ts). */
function stripeKopf(sig: string | null): Headers {
  const h = new Headers();
  if (sig !== null) h.set('stripe-signature', sig);
  return h;
}

async function zahlungsstatus(id: string): Promise<string> {
  const { rows } = await db.query('select payment_status from orders where id=$1', [id]);
  return rows[0]?.payment_status ?? '(weg)';
}

async function main(): Promise<void> {
  await db.connect();

  console.log('='.repeat(74));
  console.log('LIVE-E2E STRIPE-TESTMODUS');
  const bal = await stripe.balance.retrieve();
  pruefe(bal.livemode === false, `Stripe-Testkonto erreichbar (livemode=${bal.livemode})`);
  console.log('='.repeat(74));

  try {
    // ── A. eroeffne / verwerfe gegen die echte Stripe-API ─────────────
    console.log('\n── A. Checkout-Session anlegen, prüfen, verwerfen (echte API) ──');
    const bestellId = await legeBestellung(31.64);
    const bestellnummer = 'ER-2026-STRIPE-E2E';
    const eroeffnung = await stripeAnbieter.eroeffne({
      bestellId,
      bestellnummer,
      betragCent: 3164,
      waehrung: 'EUR',
      beschreibung: `Bestellung ${bestellnummer}`,
      rueckkehrUrl: 'https://example.invalid/bestellung/zahlung/' + bestellId,
      abbruchUrl: 'https://example.invalid/bestellung/zahlung/' + bestellId + '?abgebrochen=1',
      idempotenzSchluessel: `${bestellId}-${Date.now().toString(36)}`,
    });
    pruefe(eroeffnung.referenz.startsWith('cs_test_'), `echte Test-Session erhalten: ${eroeffnung.referenz.slice(0, 20)}…`);
    pruefe(eroeffnung.weiterleitungUrl.includes('checkout.stripe.com'), 'Weiterleitung zeigt auf Stripe Checkout');

    const session = await stripe.checkout.sessions.retrieve(eroeffnung.referenz);
    pruefe(session.metadata?.bestellId === bestellId, 'metadata.bestellId korrekt gesetzt (die Zuordnung)');
    pruefe(session.client_reference_id === bestellId, 'client_reference_id korrekt gesetzt');
    pruefe(session.amount_total === 3164, `Betrag korrekt an Stripe übergeben: ${session.amount_total} Cent`);

    // Idempotenz der Eröffnung: gleicher Schlüssel → dieselbe Session.
    const idem = `${bestellId}-fix`;
    const e1 = await stripeAnbieter.eroeffne({ bestellId, bestellnummer, betragCent: 3164, waehrung: 'EUR', beschreibung: 'x', rueckkehrUrl: 'https://example.invalid/r', abbruchUrl: 'https://example.invalid/a', idempotenzSchluessel: idem });
    const e2 = await stripeAnbieter.eroeffne({ bestellId, bestellnummer, betragCent: 3164, waehrung: 'EUR', beschreibung: 'x', rueckkehrUrl: 'https://example.invalid/r', abbruchUrl: 'https://example.invalid/a', idempotenzSchluessel: idem });
    pruefe(e1.referenz === e2.referenz, 'gleicher Idempotenzschlüssel → dieselbe Session (kein Doppelvorgang)');

    await stripeAnbieter.verwerfe(eroeffnung.referenz);
    const verworfen = await stripe.checkout.sessions.retrieve(eroeffnung.referenz);
    pruefe(verworfen.status === 'expired', `verwerfe() lässt die Session ablaufen (status=${verworfen.status})`);

    // ── B. Erfolgreiche Zahlung: echtes signiertes Ereignis → Phase 2 ──
    console.log('\n── B. Bestätigte Zahlung über echten Webhook-Weg ──');
    const zahlSession = await stripe.checkout.sessions.retrieve(e1.referenz);
    const { body, sig } = signiertesEreignis('checkout.session.completed', {
      ...zahlSession,
      payment_status: 'paid',
      payment_intent: 'pi_test_' + randomUUID().replace(/-/g, '').slice(0, 20),
    });
    const ereignis = await stripeAnbieter.leseEreignis(body, stripeKopf(sig));
    pruefe(ereignis !== null, 'echte Signatur akzeptiert, Ereignis übersetzt');
    pruefe(ereignis?.art === 'bestaetigt' && ereignis.bestellId === bestellId, `Ereignis → bestaetigt, bestellId ${ereignis?.bestellId === bestellId ? 'korrekt' : 'FALSCH'}`);

    const v = await verarbeiteZahlungsEreignis(ereignis!);
    pruefe(v.ok && v.wirkung === 'bestaetigt' && !v.bereitsVerarbeitet, `verarbeitet: ${JSON.stringify(v)}`);
    pruefe((await zahlungsstatus(bestellId)) === 'paid', 'Bestellung ist jetzt „paid"');

    const { rows: nachZahlung } = await db.query('select paid_at, pdf_url, payment_transaction_id from orders where id=$1', [bestellId]);
    pruefe(Boolean(nachZahlung[0].paid_at), 'paid_at gesetzt');
    pruefe(Boolean(nachZahlung[0].pdf_url), `Phase 2 lief: Produktionsblatt erzeugt (${nachZahlung[0].pdf_url ? 'ja' : 'NEIN'})`);
    pruefe(Boolean(nachZahlung[0].payment_transaction_id), 'payment_transaction_id (PaymentIntent) festgehalten');

    const { rows: hist } = await db.query('select event_type from order_events where order_id=$1', [bestellId]);
    const arten = hist.map((h) => h.event_type as string);
    pruefe(arten.includes('payment_succeeded'), `Historie: payment_succeeded (${arten.join(', ')})`);
    pruefe(arten.includes('email_sent') || arten.includes('email_scheduled'), 'Historie: E-Mail-Weg durchlaufen');

    // ── C. Idempotenz: dasselbe Ereignis erneut ───────────────────────
    console.log('\n── C. Erneute Zustellung desselben Ereignisses ──');
    const wieder = (await stripeAnbieter.leseEreignis(body, stripeKopf(sig)))!;
    const v2 = await verarbeiteZahlungsEreignis(wieder);
    pruefe(v2.ok && v2.bereitsVerarbeitet === true, `zweite Zustellung → bereits_verarbeitet (${JSON.stringify(v2)})`);
    const { rows: histNachher } = await db.query(`select count(*)::int n from order_events where order_id=$1 and event_type='payment_succeeded'`, [bestellId]);
    pruefe(histNachher[0].n === 1, `payment_succeeded genau einmal (${histNachher[0].n})`);

    // ── D. Fehlerfälle ────────────────────────────────────────────────
    console.log('\n── D. Fehler- und Randfälle ──');

    // Gefälschte Signatur
    pruefe((await stripeAnbieter.leseEreignis(body, stripeKopf('v1=falsch,t=123'))) === null, 'gefälschte Signatur → verworfen (null)');
    pruefe((await stripeAnbieter.leseEreignis(body, stripeKopf(null))) === null, 'fehlende Signatur → verworfen (null)');

    // Erstattung darf paid NICHT kippen (Z7)
    const refund = signiertesEreignis('charge.refunded', { id: 'ch_test', metadata: { bestellId } });
    pruefe((await stripeAnbieter.leseEreignis(refund.body, stripeKopf(refund.sig))) === null, 'charge.refunded → nicht relevant (null), paid bleibt unberührt');
    pruefe((await zahlungsstatus(bestellId)) === 'paid', 'Bestellung nach Erstattungs-Ereignis weiterhin „paid"');

    // Verspäteter Fehlschlag nach paid → wirkungslos
    const spaet = signiertesEreignis('payment_intent.payment_failed', { id: 'pi_spaet', metadata: { bestellId }, amount: 3164, currency: 'eur', last_payment_error: { message: 'zu spät' } });
    const vSpaet = await verarbeiteZahlungsEreignis((await stripeAnbieter.leseEreignis(spaet.body, stripeKopf(spaet.sig)))!);
    pruefe(vSpaet.ok && vSpaet.bereitsVerarbeitet === true, 'verspäteter Fehlschlag nach paid → wirkungslos');
    pruefe((await zahlungsstatus(bestellId)) === 'paid', 'Bestellung bleibt „paid"');

    // Falscher Betrag → fachlich abgelehnt, bleibt pending
    const b2 = await legeBestellung(50.0);
    const s2 = await stripe.checkout.sessions.create({ mode: 'payment', line_items: [{ quantity: 1, price_data: { currency: 'eur', unit_amount: 5000, product_data: { name: 'x' } } }], success_url: 'https://example.invalid/r', cancel_url: 'https://example.invalid/a', metadata: { bestellId: b2 } });
    const falsch = signiertesEreignis('checkout.session.completed', { ...s2, payment_status: 'paid', amount_total: 100 });
    const vFalsch = await verarbeiteZahlungsEreignis((await stripeAnbieter.leseEreignis(falsch.body, stripeKopf(falsch.sig)))!);
    pruefe(!vFalsch.ok && vFalsch.wiederholen === false, `Betragsabweichung → fachlich abgelehnt, keine Wiederzustellung (${JSON.stringify(vFalsch)})`);
    pruefe((await zahlungsstatus(b2)) === 'pending', 'falscher Betrag: Bestellung bleibt „pending"');

    // Abgelaufene Zahlung
    const b3 = await legeBestellung(20.0);
    const s3 = await stripe.checkout.sessions.create({ mode: 'payment', line_items: [{ quantity: 1, price_data: { currency: 'eur', unit_amount: 2000, product_data: { name: 'x' } } }], success_url: 'https://example.invalid/r', cancel_url: 'https://example.invalid/a', metadata: { bestellId: b3 } });
    const abgelaufen = signiertesEreignis('checkout.session.expired', { ...s3 });
    const vAbl = await verarbeiteZahlungsEreignis((await stripeAnbieter.leseEreignis(abgelaufen.body, stripeKopf(abgelaufen.sig)))!);
    pruefe(vAbl.ok && vAbl.wirkung === 'fehlgeschlagen', 'checkout.session.expired → fehlgeschlagen');
    pruefe((await zahlungsstatus(b3)) === 'failed', 'abgelaufene Zahlung: Bestellung „failed"');

    // Unbekannte Bestellung → nicht relevant (kein Treffer)
    const fremd = signiertesEreignis('checkout.session.completed', { id: 'cs_fremd', payment_status: 'paid', amount_total: 1000, currency: 'eur', metadata: { bestellId: '00000000-0000-0000-0000-000000000000' } });
    const eFremd = await stripeAnbieter.leseEreignis(fremd.body, stripeKopf(fremd.sig));
    if (eFremd) {
      const vFremd = await verarbeiteZahlungsEreignis(eFremd);
      pruefe(!vFremd.ok && vFremd.wiederholen === false, 'unbekannte Bestellung → fachlich abgelehnt (keine Wiederzustellung)');
    } else {
      pruefe(true, 'unbekannte Bestellung ohne Treffer bereits im Adapter aussortiert');
    }

    // ── E. Registry liefert im PRODUKTIVmodus den Stripe-Adapter ──────
    console.log('\n── E. Registry im Produktivmodus ──');
    const vorherEnv = process.env.E2E_TESTMODUS;
    const vorherNode = process.env.NODE_ENV;
    delete process.env.E2E_TESTMODUS;
    (process.env as Record<string, string>).NODE_ENV = 'production';
    const anbieter = waehleZahlungsAnbieter('stripe');
    pruefe(anbieter.id === 'stripe', `waehleZahlungsAnbieter('stripe') liefert den Stripe-Adapter (id=${anbieter.id})`);
    if (vorherEnv) process.env.E2E_TESTMODUS = vorherEnv;
    (process.env as Record<string, string | undefined>).NODE_ENV = vorherNode;
  } finally {
    for (const id of angelegteBestellungen) {
      await db.query('delete from orders where id=$1', [id]);
    }
    console.log(`\n${angelegteBestellungen.length} Testbestellung(en) entfernt.`);
    await db.end();
  }

  const durch = pruefungen.filter((p) => !p.ok);
  console.log('\n' + '='.repeat(74));
  console.log(`=== ${pruefungen.length - durch.length}/${pruefungen.length} Prüfungen bestanden (echtes Stripe-Testmodus) ===`);
  for (const p of durch) console.log(`  ✘ ${p.text}`);
  if (durch.length > 0) process.exitCode = 1;
}

void main();
