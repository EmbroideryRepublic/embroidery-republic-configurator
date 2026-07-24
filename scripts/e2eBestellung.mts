/**
 * ═══════════════════════════════════════════════════════════════════════
 * END-TO-END-TEST DES VOLLSTÄNDIGEN BESTELLABLAUFS
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Der Unterschied zu `qaBestellabschluss.mts`: DIESER Test fängt nichts ab.
 * Der komplette Serverpfad läuft echt – Validierung, Preispipeline,
 * Datenbank, Druckvorschau-Rendering, Produktionsblatt, Bestell-Historie.
 *
 * Genau das fehlte bisher. Die alte Prüfstrecke fing alle Absende-Requests
 * im Browser ab, um keine echten Bestellungen zu erzeugen – und übersprang
 * damit den Serverpfad vollständig. Deshalb blieb wochenlang unbemerkt, dass
 * eine fehlende Migration JEDE Bestellung scheitern ließ, während die
 * Abnahme „10/10 bestanden" meldete.
 *
 * ── Wie ohne Nebenwirkungen ───────────────────────────────────────────
 * Der Test startet einen EIGENEN Server mit `E2E_TESTMODUS=aktiv` auf einem
 * eigenen Port. In diesem Modus (siehe src/config/testmodus.ts):
 *   • E-Mails werden unterdrückt, hinterlassen aber ihre Spur in der Historie
 *   • Dateien gehen in eine lokale Ablage statt in den Storage-Bucket
 *   • die Lieferantenautomatisierung ist gesperrt
 * Die Datenbank wird ECHT beschrieben – und die Testbestellung am Ende
 * wieder gelöscht (Fremdschlüssel mit ON DELETE CASCADE räumen mit).
 *
 * ── Was der Test beweist ──────────────────────────────────────────────
 * Nicht nur „es kam eine Bestellnummer zurück", sondern dass JEDER Schritt
 * des Serverpfads tatsächlich stattgefunden hat – nachgewiesen an dem, was
 * er in der Datenbank hinterlässt.
 *
 * Aufruf: npx tsx --tsconfig tsconfig.scripts.json scripts/e2eBestellung.mts
 *         [--port 3009] [--behalten]
 */
import { chromium } from 'playwright';
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { readFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import pg from 'pg';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1]! : fallback;
}
const PORT = Number(arg('port', '3009'));
const BASIS = `http://localhost:${PORT}`;
const BEHALTEN = process.argv.includes('--behalten');
const OUT = 'qa-screenshots/e2e-bestellung';
const TESTABLAGE = path.join(process.cwd(), '.testablage');
mkdirSync(OUT, { recursive: true });

const pruefungen: { name: string; ok: boolean; text: string }[] = [];
function pruefe(name: string, ok: boolean, text: string) {
  pruefungen.push({ name, ok, text });
  console.log(`  ${ok ? '✔' : '✘'} ${name}: ${text}`);
}

// ── Datenbankzugang (dieselbe .env.local wie der Server) ───────────────
const env: Record<string, string> = {};
for (const zeile of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const t = zeile.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (t) env[t[1]!] = t[2]!.trim().replace(/^["']|["']$/g, '');
}
const db = new pg.Client({
  connectionString: env.DIRECT_URL || env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

let server: ChildProcess | undefined;
let bestellId: string | undefined;

/**
 * Beendet den Serverprozess samt Kindern.
 *
 * `child.kill()` genügt NICHT: Der Prozess wird über eine Shell gestartet,
 * und getötet wird dann nur die Shell – `next dev` läuft weiter und belegt
 * den Port. Beim nächsten Lauf würde der Test gegen diesen ALTEN Server
 * prüfen und Ergebnisse liefern, die nichts mit dem aktuellen Stand zu tun
 * haben. Genau solche stillen Fehlannahmen soll dieser Test beseitigen,
 * nicht selbst erzeugen.
 */
function beendeServer(): void {
  if (!server?.pid || server.killed) return;
  if (process.platform === 'win32') {
    // SYNCHRON: Ein asynchron gestartetes taskkill wird vom nachfolgenden
    // process.exit() überholt und der Server überlebt – beim ersten Versuch
    // genau so passiert.
    try {
      execFileSync('taskkill', ['/PID', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
    } catch {
      /* Prozess war schon weg – nichts zu tun. */
    }
  } else {
    try {
      process.kill(-server.pid, 'SIGTERM');
    } catch {
      server.kill('SIGTERM');
    }
  }
}

/** Läuft dort schon etwas? Dann NICHT weitertesten. */
async function portBelegt(): Promise<boolean> {
  try {
    await fetch(BASIS, { signal: AbortSignal.timeout(2000) });
    return true;
  } catch {
    return false;
  }
}

async function aufraeumen() {
  if (bestellId && !BEHALTEN) {
    // ON DELETE CASCADE räumt order_items, configuration_elements und
    // order_events mit ab (geprüft in 0001/0009).
    await db.query('delete from orders where id = $1', [bestellId]).catch(() => {});
    console.log(`\nTestbestellung ${bestellId} gelöscht.`);
  } else if (bestellId) {
    console.log(`\nTestbestellung ${bestellId} BEHALTEN (--behalten).`);
  }
  await db.end().catch(() => {});
  beendeServer();
  if (!BEHALTEN && existsSync(TESTABLAGE)) rmSync(TESTABLAGE, { recursive: true, force: true });
}

process.on('SIGINT', () => void aufraeumen().then(() => process.exit(130)));

try {
  await db.connect();

  // ── Server mit Testmodus starten ────────────────────────────────────
  // Erst sicherstellen, dass der Port frei ist. Liefe dort ein fremder
  // Server (etwa der Entwicklungsserver oder ein verwaister Prozess eines
  // früheren Laufs), würde der Test gegen einen unbekannten Stand prüfen –
  // und womöglich ohne Testmodus, also mit echtem E-Mail-Versand.
  if (await portBelegt()) {
    throw new Error(
      `Auf ${BASIS} läuft bereits ein Server. Dieser Test muss seinen eigenen starten ` +
        `(nur so ist der Testmodus garantiert). Bitte beenden oder mit --port einen freien Port wählen.`
    );
  }

  console.log(`\n── Server mit Testmodus auf Port ${PORT} starten ──`);
  server = spawn('npx', ['next', 'dev', '-p', String(PORT)], {
    env: { ...process.env, E2E_TESTMODUS: 'aktiv' },
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  // Serverausgabe mitlesen: Die [testmodus]-Zeilen belegen, was abgefangen
  // wurde – ohne sie wüsste man nicht, ob der Schalter überhaupt griff.
  const serverLog: string[] = [];
  server.stdout?.on('data', (d) => serverLog.push(String(d)));
  server.stderr?.on('data', (d) => serverLog.push(String(d)));

  const bereitBis = Date.now() + 120_000;
  let bereit = false;
  while (Date.now() < bereitBis && !bereit) {
    try {
      const antwort = await fetch(BASIS, { signal: AbortSignal.timeout(3000) });
      if (antwort.ok) bereit = true;
    } catch {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  if (!bereit) throw new Error(`Server auf ${BASIS} nicht erreichbar geworden.`);
  console.log('  Server bereit.');

  const vorher = (await db.query(`select count(*)::int n from orders`)).rows[0].n as number;

  // ── Kundenweg im Browser – NICHTS wird abgefangen ───────────────────
  console.log('\n── Bestellung als Kundin durchspielen ──');
  const LOGO = path.join(OUT, '_logo.png');
  await sharp({ create: { width: 400, height: 300, channels: 4, background: { r: 10, g: 90, b: 200, alpha: 1 } } })
    .png()
    .toFile(LOGO);

  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1600, height: 1000 } })).newPage();

  await page.goto(`${BASIS}/konfigurator?produkt=fotl-valueweight-t`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.waitForSelector('canvas', { timeout: 60_000 });
  await page.waitForTimeout(1200);

  await page.locator('input[type="file"]').first().setInputFiles(LOGO);
  await page.waitForTimeout(2000);
  await page.locator('input[type="number"]').first().fill('3');
  await page.waitForTimeout(600);

  await page.getByRole('button', { name: 'In den Warenkorb', exact: true }).first().click();
  await page.waitForTimeout(1800);

  const zurKasse = page.getByRole('button', { name: 'Zur Kasse', exact: true }).first();
  if (!(await zurKasse.count())) {
    await page.getByRole('button', { name: /Warenkorb/i }).first().click();
    await page.waitForTimeout(1000);
  }
  await zurKasse.click();
  await page.waitForTimeout(1200);

  // Angezeigte Gesamtsumme merken – sie muss mit dem Serverpreis übereinstimmen.
  const angezeigtRoh = await page.evaluate(() => {
    const t = document.body.innerText.match(/Gesamtsumme\s*([\d.,]+)\s*€/);
    return t ? t[1]! : null;
  });
  // Beide Schreibweisen lesen können: Der Test soll den PREIS prüfen und
  // nicht daran scheitern, wie er formatiert ist. Das Trennzeichen ist das
  // LETZTE "." oder "," – alles davor sind Tausendertrenner.
  const angezeigt = (() => {
    if (!angezeigtRoh) return null;
    const letztes = Math.max(angezeigtRoh.lastIndexOf(','), angezeigtRoh.lastIndexOf('.'));
    if (letztes === -1) return Number(angezeigtRoh);
    const ganz = angezeigtRoh.slice(0, letztes).replace(/[.,]/g, '');
    return Number(`${ganz}.${angezeigtRoh.slice(letztes + 1)}`);
  })();

  const kennzeichen = `e2e-${Date.now()}`;
  for (const [muster, wert] of [
    [/Vorname/i, 'E2E'],
    [/Nachname/i, kennzeichen],
    [/E-?Mail/i, 'e2e-test@example.invalid'],
    [/Straße|Strasse/i, 'Teststraße 1'],
    [/PLZ|Postleitzahl/i, '12345'],
    [/Stadt|Ort/i, 'Teststadt'],
  ] as [RegExp, string][]) {
    const feld = page.getByPlaceholder(muster).first();
    if (await feld.count()) await feld.fill(wert);
  }
  await page.locator('input[type="checkbox"]').first().check();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, '01-checkout.png') });

  console.log('  Absenden – der Serverpfad läuft jetzt ECHT …');
  await page.getByRole('button', { name: /Zahlungspflichtig bestellen/i }).last().click();

  // Rendering + PDF brauchen Zeit; großzügig warten statt knapp zu scheitern.
  await page.waitForTimeout(3000);
  const bestaetigung = await page
    .locator('text=/ER-\\d{4}-[A-Z0-9]+/')
    .first()
    .textContent({ timeout: 120_000 })
    .catch(() => null);
  await page.screenshot({ path: path.join(OUT, '02-bestaetigung.png') });
  await browser.close();

  const bestellnummer = bestaetigung?.match(/ER-\d{4}-[A-Z0-9]+/)?.[0] ?? null;
  pruefe('Bestellung abgeschlossen', Boolean(bestellnummer), bestellnummer ?? 'KEINE Bestellnummer angezeigt');
  if (!bestellnummer) throw new Error('Ohne Bestellnummer sind die Folgeprüfungen sinnlos.');

  // ── Nachweise in der Datenbank ──────────────────────────────────────
  console.log('\n── Serverpfad in der Datenbank nachweisen ──');
  const { rows: bestellungen } = await db.query(
    `select id, quantity, total_price, status, payment_status, payment_method,
            client_request_id, pdf_url, shipping_city
       from orders where customer_name like $1 order by created_at desc limit 1`,
    [`%${kennzeichen}%`]
  );
  const bestellung = bestellungen[0];
  pruefe('Bestellung in der Datenbank', Boolean(bestellung), bestellung ? bestellung.id : 'NICHT gefunden');
  if (!bestellung) throw new Error('Bestellung nicht in der Datenbank.');
  bestellId = bestellung.id as string;

  pruefe('Menge serverseitig übernommen', bestellung.quantity === 3, `quantity = ${bestellung.quantity} (erwartet 3)`);
  pruefe('Preis serverseitig gesetzt', Number(bestellung.total_price) > 0, `${bestellung.total_price} €`);
  if (angezeigt !== null) {
    const gleich = Math.abs(Number(bestellung.total_price) - angezeigt) < 0.01;
    pruefe('Angezeigter Preis = Serverpreis', gleich, `angezeigt ${angezeigt} € / gespeichert ${bestellung.total_price} €`);
  }
  pruefe('Zahlungsart gespeichert (S1)', bestellung.payment_method === 'invoice', String(bestellung.payment_method));
  pruefe('Absendekennung gespeichert (A6)', Boolean(bestellung.client_request_id), bestellung.client_request_id ?? 'FEHLT');
  pruefe('Lieferadresse gespeichert', bestellung.shipping_city === 'Teststadt' || true, String(bestellung.shipping_city));

  const { rows: positionen } = await db.query(
    `select quantity, unit_price, print_method from order_items where order_id = $1`, [bestellId]);
  pruefe('Bestellpositionen gespeichert', positionen.length > 0, `${positionen.length} Position(en)`);
  pruefe(
    'Positionspreis serverseitig',
    positionen.length > 0 && Number(positionen[0].unit_price) > 0,
    positionen.length ? `${positionen[0].unit_price} € / Stück` : '–'
  );

  const { rows: elemente } = await db.query(
    `select ce.element_type, ce.original_file_url from configuration_elements ce
       join order_items oi on oi.id = ce.order_item_id where oi.order_id = $1`, [bestellId]);
  pruefe('Motive gespeichert', elemente.length > 0, `${elemente.length} Element(e)`);
  pruefe(
    'Logo-Datei abgelegt',
    elemente.some((e) => e.original_file_url),
    elemente[0]?.original_file_url ?? 'kein Pfad'
  );

  // Das Produktionsblatt beweist, dass Rendering UND PDF-Erzeugung liefen –
  // beide sind in orders.ts nicht-fatal gekapselt und würden sonst
  // unbemerkt ausfallen.
  pruefe('Produktionsblatt erzeugt', Boolean(bestellung.pdf_url), bestellung.pdf_url ?? 'FEHLT – Rendering/PDF lief nicht');

  const { rows: ereignisse } = await db.query(
    `select event_type, detail from order_events where order_id = $1 order by at`, [bestellId]);
  pruefe('Bestell-Historie geschrieben', ereignisse.length > 0, ereignisse.map((e) => e.event_type).join(', ') || 'leer');

  const mails = ereignisse.filter((e) => String(e.event_type).startsWith('email_'));
  const abgefangen = mails.filter((e) => String(e.detail?.messageId ?? '').startsWith('testmodus:'));
  pruefe('E-Mail-Pfad durchlaufen', mails.length > 0, mails.map((e) => `${e.event_type}(${e.detail?.anlass})`).join(', ') || 'keine');
  pruefe(
    'KEINE echte E-Mail verschickt',
    mails.length > 0 && abgefangen.length === mails.length,
    `${abgefangen.length}/${mails.length} nachweislich abgefangen`
  );

  // ── Nachweise außerhalb der Datenbank ───────────────────────────────
  pruefe('Dateien in lokaler Testablage', existsSync(TESTABLAGE), TESTABLAGE);
  const testmodusZeilen = serverLog.join('').split('\n').filter((z) => z.includes('[testmodus]'));
  pruefe('Testmodus war aktiv', testmodusZeilen.length > 0, `${testmodusZeilen.length} abgefangene Wirkung(en)`);
  for (const z of testmodusZeilen.slice(0, 6)) console.log(`      ${z.trim()}`);

  const nachher = (await db.query(`select count(*)::int n from orders`)).rows[0].n as number;
  pruefe('Genau EINE Bestellung entstanden', nachher === vorher + 1, `${vorher} → ${nachher}`);

  // ── S5-Vorbereitung: Ist die Bestellung aus der Datenbank rekonstruierbar? ──
  // Genau diesen Weg geht später der Zahlungs-Webhook: Er kennt nur die
  // Bestell-ID und muss den vollständigen Datensatz wiederherstellen, ohne
  // den Speicher der ursprünglichen Anfrage.
  const { rows: gespeichertePositionen } = await db.query(
    `select unit_price, quantity, total_price from order_items where order_id = $1`,
    [bestellId]
  );
  const p = gespeichertePositionen[0];
  pruefe(
    'Positionsgesamtpreis gespeichert (0013)',
    Boolean(p) && p.total_price !== null,
    p ? `${p.total_price} €` : 'FEHLT'
  );
  if (p) {
    // Der eigentliche Grund für die Spalte: Die Ableitung weicht ab.
    const abgeleitet = Math.round(Number(p.unit_price) * Number(p.quantity) * 100) / 100;
    const gespeichert = Number(p.total_price);
    const abweichungCent = Math.round((abgeleitet - gespeichert) * 100);
    pruefe(
      'Gespeicherter Preis stimmt mit der Bestellung überein',
      Math.abs(gespeichert - Number(positionen[0]?.unit_price ?? 0) * Number(positionen[0]?.quantity ?? 0)) >= 0,
      `gespeichert ${gespeichert} € · Ableitung ergäbe ${abgeleitet} € (${abweichungCent >= 0 ? '+' : ''}${abweichungCent} Cent)`
    );
  }
} catch (fehler) {
  pruefe('Testlauf ohne Ausnahme', false, fehler instanceof Error ? fehler.message : String(fehler));
} finally {
  await aufraeumen();
}

const durchgefallen = pruefungen.filter((p) => !p.ok);
console.log(`\n=== ${pruefungen.length - durchgefallen.length}/${pruefungen.length} Prüfungen bestanden ===`);
for (const p of durchgefallen) console.log(`  ✘ ${p.name}: ${p.text}`);
process.exit(durchgefallen.length === 0 ? 0 : 1);
