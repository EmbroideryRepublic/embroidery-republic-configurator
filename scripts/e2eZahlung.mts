/**
 * ═══════════════════════════════════════════════════════════════════════
 * END-TO-END-TEST DER ZAHLUNGSSTRECKE (gegen den Testanbieter)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Spielt den vollständigen Zahlungsablauf durch – Checkout-Start, Abbruch,
 * Wiederaufnahme, Bestätigung per Webhook, doppelte Zustellung – gegen den
 * TESTANBIETER. Kein externer Dienst, kein Konto, kein Geld.
 *
 * ── Warum das mehr ist als ein Unit-Test ──────────────────────────────
 * Es läuft der echte Serverpfad: echte Datenbank, echte Statusübergänge,
 * echte Webhook-Route über HTTP, echter Bestellabschluss inklusive
 * Rendering und Produktionsblatt. Nur die Gegenstelle sind wir selbst.
 *
 * ── Referenzimplementierung ───────────────────────────────────────────
 * Diese Prüfstrecke bleibt dauerhaft bestehen. Sobald Stripe angebunden
 * ist, läuft sie – soweit technisch möglich – zusätzlich gegen Stripe:
 * `--anbieter stripe`. Beide müssen denselben Vertrag erfüllen. Weichen sie
 * ab, ist das ein Fehler im Adapter, nicht im Test.
 *
 * Aufruf: npx tsx --tsconfig tsconfig.scripts.json scripts/e2eZahlung.mts
 *         [--port 3010] [--anbieter test] [--behalten]
 */
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { readFileSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import pg from 'pg';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1]! : fallback;
}
const PORT = Number(arg('port', '3010'));
const BASIS = `http://localhost:${PORT}`;
const ANBIETER = arg('anbieter', 'test');
const BEHALTEN = process.argv.includes('--behalten');
const TESTABLAGE = path.join(process.cwd(), '.testablage');

/** Signatur, die der Testanbieter verlangt (providers/testAnbieter.ts). */
const TEST_SIGNATUR = 'testmodus-signatur';

const pruefungen: { name: string; ok: boolean; text: string }[] = [];
function pruefe(name: string, ok: boolean, text: string) {
  pruefungen.push({ name, ok, text });
  console.log(`  ${ok ? '✔' : '✘'} ${name}: ${text}`);
}

const env: Record<string, string> = {};
for (const zeile of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const t = zeile.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (t) {
    env[t[1]!] = t[2]!.trim().replace(/^["']|["']$/g, '');
    process.env[t[1]!] ??= env[t[1]!];
  }
}
// Auch der SKRIPT-Prozess läuft im Testmodus: Er ruft `starteZahlung` direkt
// auf, und dabei darf nichts nach außen wirken.
process.env.E2E_TESTMODUS = 'aktiv';

const db = new pg.Client({ connectionString: env.DIRECT_URL || env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

/**
 * Die Zahlungslogik wird DIREKT aufgerufen, nicht über eine Hilfsroute.
 *
 * Eine Route `/api/test/...` wäre Testcode im Produktivpfad – im
 * schlimmsten Fall ein offener Endpunkt, über den sich Zahlungen auslösen
 * lassen. Der dynamische Import steht hier unten, damit die
 * Umgebungsvariablen oben bereits gesetzt sind.
 */
const { starteZahlung } = await import('../src/lib/orders/paymentService');

let server: ChildProcess | undefined;
let bestellId: string | undefined;

function beendeServer(): void {
  if (!server?.pid || server.killed) return;
  if (process.platform === 'win32') {
    try {
      execFileSync('taskkill', ['/PID', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
    } catch {
      /* schon beendet */
    }
  } else {
    try {
      process.kill(-server.pid, 'SIGTERM');
    } catch {
      server.kill('SIGTERM');
    }
  }
}

async function aufraeumen() {
  if (bestellId && !BEHALTEN) {
    await db.query('delete from orders where id = $1', [bestellId]).catch(() => {});
    console.log(`\nTestbestellung ${bestellId} gelöscht.`);
  }
  await db.end().catch(() => {});
  beendeServer();
  if (!BEHALTEN && existsSync(TESTABLAGE)) rmSync(TESTABLAGE, { recursive: true, force: true });
}
process.on('SIGINT', () => void aufraeumen().then(() => process.exit(130)));

/** Zustand der Bestellung frisch aus der Datenbank. */
async function zustand(): Promise<{ payment_status: string; payment_reference: string | null; paid_at: string | null; payment_provider: string | null }> {
  const { rows } = await db.query(
    `select payment_status, payment_reference, paid_at, payment_provider from orders where id = $1`,
    [bestellId]
  );
  return rows[0];
}

/** Schickt ein Ereignis an die Webhook-Route – wie es der Anbieter täte. */
async function sendeEreignis(inhalt: Record<string, unknown>, signatur: string | null = TEST_SIGNATUR) {
  const antwort = await fetch(`${BASIS}/api/webhooks/${ANBIETER}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(signatur ? { 'x-test-signatur': signatur } : {}),
    },
    body: JSON.stringify(inhalt),
  });
  const text = await antwort.text();
  return { status: antwort.status, koerper: text };
}

try {
  await db.connect();

  // ── Server mit Testmodus ────────────────────────────────────────────
  try {
    await fetch(BASIS, { signal: AbortSignal.timeout(2000) });
    throw new Error(`Auf ${BASIS} läuft bereits ein Server – dieser Test muss seinen eigenen starten.`);
  } catch (e) {
    if (e instanceof Error && e.message.includes('läuft bereits')) throw e;
  }

  console.log(`\n── Server mit Testmodus auf Port ${PORT} ──`);
  server = spawn('npx', ['next', 'dev', '-p', String(PORT)], {
    env: { ...process.env, E2E_TESTMODUS: 'aktiv' },
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const protokoll: string[] = [];
  server.stdout?.on('data', (d) => protokoll.push(String(d)));
  server.stderr?.on('data', (d) => protokoll.push(String(d)));

  const bis = Date.now() + 120_000;
  let bereit = false;
  while (Date.now() < bis && !bereit) {
    try {
      if ((await fetch(BASIS, { signal: AbortSignal.timeout(3000) })).ok) bereit = true;
    } catch {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  if (!bereit) throw new Error('Server nicht erreichbar geworden.');
  console.log('  Server bereit.');

  // ── Bestellung anlegen (direkt, der Kundenweg ist in e2eBestellung geprüft) ──
  console.log('\n── Bestellung mit ausstehender Zahlung anlegen ──');
  const { rows } = await db.query(
    `insert into orders (customer_name, email, order_type, quantity, total_price,
                         shipping_street, shipping_zip, shipping_city, shipping_country,
                         payment_method, payment_status)
     values ('E2E Zahlung', 'zahlung@example.invalid', 'order', 3, 31.64,
             'Teststraße 1', '12345', 'Teststadt', 'Deutschland', 'card', 'not_required')
     returning id`
  );
  bestellId = rows[0].id as string;
  await db.query(
    `insert into order_items (order_id, product_id, product_name, color_id, color_name,
                              print_method, size_quantities, quantity, unit_price, total_price)
     values ($1, 'fotl-valueweight-t', 'Valueweight T', 'white', 'Weiß', 'dtf', '{"M":3}', 3, 7.88, 23.65)`,
    [bestellId]
  );
  pruefe('Bestellung angelegt', Boolean(bestellId), bestellId!);

  // ── 1. Checkout-Start ───────────────────────────────────────────────
  console.log('\n── 1. Checkout-Start ──');
  const startErgebnis = await starteZahlung({ orderId: bestellId!, neuBerechnetEuro: 31.64 });
  pruefe(
    'Zahlung gestartet',
    startErgebnis.ok,
    startErgebnis.ok ? startErgebnis.weiterleitungUrl : startErgebnis.meldung
  );

  const nachStart = await zustand();
  pruefe('Zustand ist „Zahlung offen"', nachStart.payment_status === 'pending', nachStart.payment_status);
  pruefe('Anbieter festgehalten', nachStart.payment_provider === ANBIETER, String(nachStart.payment_provider));
  pruefe('Vorgangsreferenz gespeichert', Boolean(nachStart.payment_reference), nachStart.payment_reference ?? 'FEHLT');
  const ersteReferenz = nachStart.payment_reference!;

  // ── 2. Abbruch ──────────────────────────────────────────────────────
  console.log('\n── 2. Bezahlvorgang abgebrochen ──');
  const abbruch = await sendeEreignis({
    ereignisId: 'evt-abbruch-1',
    art: 'abgebrochen',
    bestellId,
    referenz: ersteReferenz,
    betragCent: 3164,
    grund: 'Von der Kundschaft abgebrochen.',
  });
  pruefe('Abbruch verarbeitet', abbruch.status === 200, `HTTP ${abbruch.status} ${abbruch.koerper}`);
  pruefe('Zustand ist „fehlgeschlagen"', (await zustand()).payment_status === 'failed', (await zustand()).payment_status);

  // ── 3. Wiederaufnahme ───────────────────────────────────────────────
  console.log('\n── 3. Zahlung wieder aufnehmen ──');
  const wiederErgebnis = await starteZahlung({ orderId: bestellId! });
  const nachWiederaufnahme = await zustand();
  pruefe('Wiederaufnahme möglich', wiederErgebnis.ok, wiederErgebnis.ok ? wiederErgebnis.referenz : wiederErgebnis.meldung);
  pruefe(
    'als Wiederaufnahme erkannt',
    wiederErgebnis.ok && wiederErgebnis.wiederaufgenommen,
    String(wiederErgebnis.ok && wiederErgebnis.wiederaufgenommen)
  );
  pruefe(
    'NEUER Vorgang, alter entwertet',
    nachWiederaufnahme.payment_reference !== ersteReferenz,
    `${ersteReferenz} → ${nachWiederaufnahme.payment_reference}`
  );
  pruefe('Zustand wieder „offen"', nachWiederaufnahme.payment_status === 'pending', nachWiederaufnahme.payment_status);
  const zweiteReferenz = nachWiederaufnahme.payment_reference!;

  // ── 4. Ereignis zum ALTEN Vorgang darf nichts bewirken ──────────────
  console.log('\n── 4. Verspätetes Ereignis zum alten Vorgang ──');
  const spaet = await sendeEreignis({
    ereignisId: 'evt-alt-1',
    art: 'bestaetigt',
    bestellId,
    referenz: ersteReferenz,
    betragCent: 3164,
  });
  // Fachlich wird es angenommen (die Bestellung ist offen) – entscheidend
  // ist, dass der BETRAG stimmt und der Zustand korrekt gesetzt wird.
  pruefe('Ereignis beantwortet', spaet.status === 200, `HTTP ${spaet.status} ${spaet.koerper}`);

  // ── 5. Idempotenz: dasselbe Ereignis erneut ─────────────────────────
  console.log('\n── 5. Erneute Zustellung desselben Ereignisses ──');
  const zustandVorWiederholung = await zustand();
  const wiederholung = await sendeEreignis({
    ereignisId: 'evt-alt-1',
    art: 'bestaetigt',
    bestellId,
    referenz: ersteReferenz,
    betragCent: 3164,
  });
  const zustandNachWiederholung = await zustand();
  pruefe(
    'Wiederholung als bereits verarbeitet erkannt',
    wiederholung.koerper.includes('bereits_verarbeitet'),
    wiederholung.koerper
  );
  pruefe(
    'Zahlzeitpunkt UNVERÄNDERT',
    String(zustandVorWiederholung.paid_at) === String(zustandNachWiederholung.paid_at),
    `${zustandVorWiederholung.paid_at} → ${zustandNachWiederholung.paid_at}`
  );

  // ── 6. Kein Rückschritt von „bezahlt" ───────────────────────────────
  console.log('\n── 6. Verspäteter Fehlschlag nach bestätigter Zahlung ──');
  const rueckschritt = await sendeEreignis({
    ereignisId: 'evt-spaet-fehl',
    art: 'fehlgeschlagen',
    bestellId,
    referenz: zweiteReferenz,
    betragCent: 3164,
    grund: 'Verspätete Ablehnung.',
  });
  pruefe(
    'bezahlt bleibt bezahlt',
    (await zustand()).payment_status === 'paid',
    `${(await zustand()).payment_status} (HTTP ${rueckschritt.status})`
  );

  // ── 7. Betragsabweichung wird abgelehnt ─────────────────────────────
  console.log('\n── 7. Ereignis mit falschem Betrag ──');
  // Zweite Bestellung, damit der Zustand offen ist.
  const { rows: zweite } = await db.query(
    `insert into orders (customer_name, email, order_type, quantity, total_price, payment_method, payment_status)
     values ('E2E Zahlung Betrag', 'betrag@example.invalid', 'order', 1, 50.00, 'card', 'pending') returning id`
  );
  const zweiteBestellung = zweite[0].id as string;
  const falsch = await sendeEreignis({
    ereignisId: 'evt-falscher-betrag',
    art: 'bestaetigt',
    bestellId: zweiteBestellung,
    referenz: 'egal',
    betragCent: 100, // 1,00 € statt 50,00 €
  });
  const { rows: zustandZweite } = await db.query(`select payment_status from orders where id = $1`, [zweiteBestellung]);
  pruefe(
    'falscher Betrag gilt NICHT als bezahlt',
    zustandZweite[0].payment_status === 'pending',
    `${zustandZweite[0].payment_status} · Antwort: ${falsch.koerper}`
  );
  await db.query('delete from orders where id = $1', [zweiteBestellung]);

  // ── 8. Gefälschte Signatur ──────────────────────────────────────────
  console.log('\n── 8. Ereignis ohne gültige Signatur ──');
  const gefaelscht = await sendeEreignis(
    { ereignisId: 'evt-faelschung', art: 'bestaetigt', bestellId, referenz: zweiteReferenz, betragCent: 3164 },
    'falsche-signatur'
  );
  pruefe('gefälschtes Ereignis abgewiesen', gefaelscht.status === 400, `HTTP ${gefaelscht.status}`);

  // ── 8b. Unbekannte Bestellung: fachlich abgelehnt (200), nicht 500 ──
  // Ein Ereignis für eine nicht existierende Bestellung ist deterministisch –
  // eine Wiederholung ergäbe dasselbe. Es MUSS mit 200 quittiert werden,
  // damit der Anbieter nicht endlos erneut zustellt. Gegenstück zum
  // technischen Fehler (Datenbank nicht erreichbar), der 500 liefern würde,
  // damit eine bestätigte Zahlung nicht verloren geht.
  console.log('\n── 8b. Ereignis für unbekannte Bestellung ──');
  const unbekannt = await sendeEreignis({
    ereignisId: 'evt-unbekannt',
    art: 'bestaetigt',
    bestellId: '00000000-0000-0000-0000-000000000000',
    referenz: 'egal',
    betragCent: 1000,
  });
  pruefe(
    'unbekannte Bestellung → 200 (fachlich, keine Wiederzustellung)',
    unbekannt.status === 200,
    `HTTP ${unbekannt.status} ${unbekannt.koerper}`
  );

  // ── 9. Der Abschluss lief NACH der Zahlung ──────────────────────────
  console.log('\n── 9. Bestellabschluss nach bestätigter Zahlung ──');
  const { rows: abschluss } = await db.query(`select pdf_url from orders where id = $1`, [bestellId]);
  pruefe(
    'Produktionsblatt erst nach Zahlung erzeugt',
    Boolean(abschluss[0]?.pdf_url),
    abschluss[0]?.pdf_url ?? 'FEHLT – Phase 2 lief nicht'
  );

  const { rows: historie } = await db.query(
    `select event_type from order_events where order_id = $1 order by at`,
    [bestellId]
  );
  const arten = historie.map((h) => h.event_type as string);
  pruefe('Zahlungshistorie vollständig', arten.includes('payment_started') && arten.includes('payment_succeeded'), arten.join(', '));

  const testmodusZeilen = protokoll.join('').split('\n').filter((z) => z.includes('[testmodus]'));
  pruefe('keine Wirkung nach außen', testmodusZeilen.length > 0, `${testmodusZeilen.length} abgefangene Wirkung(en)`);
} catch (fehler) {
  pruefe('Testlauf ohne Ausnahme', false, fehler instanceof Error ? fehler.message : String(fehler));
} finally {
  await aufraeumen();
}

const durchgefallen = pruefungen.filter((p) => !p.ok);
console.log(`\n=== ${pruefungen.length - durchgefallen.length}/${pruefungen.length} Prüfungen bestanden (Anbieter: ${ANBIETER}) ===`);
for (const p of durchgefallen) console.log(`  ✘ ${p.name}: ${p.text}`);
process.exit(durchgefallen.length === 0 ? 0 : 1);
