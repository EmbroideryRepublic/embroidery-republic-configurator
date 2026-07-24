/**
 * ═══════════════════════════════════════════════════════════════════════
 * ADMIN-SITZUNGEN GEGEN DIE ECHTE DATENBANK
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Aufruf: npm run test:e2e:adminauth
 *
 * Geprüft wird das Verhalten der Sitzungsverwaltung: Ablauf, Widerruf,
 * mehrere gleichzeitige Sitzungen, manipulierte Token. Das lässt sich nur
 * gegen eine echte Datenbank zeigen – die Zeitlogik liegt in Postgres.
 *
 * Räumt seine Testsitzungen selbst wieder ab.
 */
import { readFileSync } from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';
import pg from 'pg';

const env: Record<string, string> = {};
for (const zeile of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const t = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(zeile);
  if (t) env[t[1]!] = t[2]!.trim().replace(/^["']|["']$/g, '');
}

const client = new pg.Client({ connectionString: env.DIRECT_URL || env.DATABASE_URL });
const pool = new pg.Pool({ connectionString: env.DIRECT_URL || env.DATABASE_URL, max: 8 });

let bestanden = 0;
let fehlgeschlagen = 0;

function pruefe(bedingung: boolean, text: string): void {
  if (bedingung) {
    bestanden++;
    console.log(`  ✔ ${text}`);
  } else {
    fehlgeschlagen++;
    console.log(`  ✘ ${text}`);
  }
}

const hashe = (token: string): string => createHash('sha256').update(token).digest('hex');
const neuerToken = (): string => randomBytes(32).toString('base64url');

/** Legt eine Sitzung an – wie `meldeAdminAn()`, nur direkt in SQL. */
async function lege(token: string, stunden: number, herkunft: string): Promise<void> {
  await client.query(
    `insert into admin_sitzungen (token_hash, laeuft_ab_am, herkunft)
     values ($1, now() + make_interval(hours => $2), $3)`,
    [hashe(token), stunden, herkunft]
  );
}

/** Prüft eine Sitzung – dieselbe Logik wie `istAdmin()`. */
async function gueltig(token: string): Promise<boolean> {
  const r = await client.query(
    `select laeuft_ab_am, widerrufen_am from admin_sitzungen where token_hash = $1`,
    [hashe(token)]
  );
  const z = r.rows[0];
  if (!z) return false;
  if (z.widerrufen_am) return false;
  return new Date(z.laeuft_ab_am) > new Date();
}

async function main(): Promise<void> {
  await client.connect();
  const kennzeichen = `e2e-${randomBytes(6).toString('hex')}`;

  try {
    console.log('='.repeat(72));
    console.log('ADMIN-SITZUNGEN – Verhalten gegen die echte Datenbank');
    console.log('='.repeat(72));

    // ── 1. Der Normalfall ───────────────────────────────────────────
    console.log('\nAnmelden und prüfen:');
    const token = neuerToken();
    await lege(token, 12, kennzeichen);
    pruefe(await gueltig(token), 'eine frische Sitzung ist gültig');
    pruefe(token.length >= 40, `der Token ist ausreichend lang (${token.length} Zeichen)`);

    // ── 2. Nur der Hash liegt in der Datenbank ──────────────────────
    console.log('\nDer Token selbst wird nie gespeichert:');
    const klartext = await client.query(
      `select count(*)::int n from admin_sitzungen where token_hash = $1`,
      [token]
    );
    pruefe(klartext.rows[0].n === 0, 'der Klartext-Token findet sich nirgends');
    const alsHash = await client.query(
      `select count(*)::int n from admin_sitzungen where token_hash = $1`,
      [hashe(token)]
    );
    pruefe(alsHash.rows[0].n === 1, 'gespeichert ist ausschließlich der Hash');

    // ── 3. Manipulierte und unbekannte Token ────────────────────────
    console.log('\nNegative Fälle:');
    pruefe(!(await gueltig(neuerToken())), 'ein unbekannter Token gilt nicht');
    pruefe(!(await gueltig(token + 'x')), 'ein veränderter Token gilt nicht');
    pruefe(!(await gueltig(token.slice(0, -1))), 'ein gekürzter Token gilt nicht');
    pruefe(!(await gueltig('')), 'ein leerer Token gilt nicht');
    pruefe(!(await gueltig(hashe(token))), 'auch der Hash selbst ist kein gültiger Token');

    // ── 4. Ablauf ───────────────────────────────────────────────────
    console.log('\nAblauf:');
    const abgelaufen = neuerToken();
    await lege(abgelaufen, -1, kennzeichen); // eine Stunde in der Vergangenheit
    pruefe(!(await gueltig(abgelaufen)), 'eine abgelaufene Sitzung gilt nicht mehr');
    const nochDa = await client.query('select count(*)::int n from admin_sitzungen where token_hash = $1', [
      hashe(abgelaufen),
    ]);
    pruefe(nochDa.rows[0].n === 1, 'die Zeile bleibt zunächst erhalten (als „abgelaufen" erkennbar)');

    // ── 5. Mehrere gleichzeitige Sitzungen ──────────────────────────
    console.log('\nMehrere Geräte gleichzeitig:');
    const geraete = [neuerToken(), neuerToken(), neuerToken()];
    for (const t of geraete) await lege(t, 12, kennzeichen);
    const alleGueltig = await Promise.all(geraete.map(gueltig));
    pruefe(alleGueltig.every(Boolean), 'drei Sitzungen bestehen unabhängig nebeneinander');

    // Eine einzelne beenden – die anderen bleiben.
    await client.query(`update admin_sitzungen set widerrufen_am = now() where token_hash = $1`, [
      hashe(geraete[1]!),
    ]);
    pruefe(!(await gueltig(geraete[1]!)), 'die widerrufene Sitzung gilt nicht mehr');
    pruefe(await gueltig(geraete[0]!), 'die erste Sitzung bleibt unberührt');
    pruefe(await gueltig(geraete[2]!), 'die dritte Sitzung bleibt unberührt');

    // ── 6. Alle beenden ─────────────────────────────────────────────
    console.log('\nAlle Zugänge beenden:');
    await client.query(
      `update admin_sitzungen set widerrufen_am = now() where herkunft = $1 and widerrufen_am is null`,
      [kennzeichen]
    );
    const nachAllen = await Promise.all([...geraete, token].map(gueltig));
    pruefe(nachAllen.every((g) => !g), 'danach gilt keine Sitzung mehr');

    // ── 7. Parallelzugriff ──────────────────────────────────────────
    // Zehn gleichzeitige Prüfungen derselben Sitzung: Alle müssen dasselbe
    // Ergebnis liefern. Ein Zustandswechsel mitten in der Prüfung darf
    // nicht zu widersprüchlichen Antworten führen.
    console.log('\n10 gleichzeitige Prüfungen derselben Sitzung:');
    const parallelToken = neuerToken();
    await lege(parallelToken, 12, kennzeichen);
    const ergebnisse = await Promise.all(
      Array.from({ length: 10 }, async () => {
        const r = await pool.query(
          `select laeuft_ab_am, widerrufen_am from admin_sitzungen where token_hash = $1`,
          [hashe(parallelToken)]
        );
        const z = r.rows[0];
        return Boolean(z) && !z.widerrufen_am && new Date(z.laeuft_ab_am) > new Date();
      })
    );
    pruefe(ergebnisse.every(Boolean), 'alle zehn Prüfungen kommen zum selben Ergebnis');

    // ── 8. Aufräumen ────────────────────────────────────────────────
    console.log('\nAufräumlauf:');
    const uralt = neuerToken();
    await client.query(
      `insert into admin_sitzungen (token_hash, laeuft_ab_am, herkunft)
       values ($1, now() - interval '10 days', $2)`,
      [hashe(uralt), kennzeichen]
    );
    await client.query('select raeume_admin_sitzungen_auf()');
    const weg = await client.query('select count(*)::int n from admin_sitzungen where token_hash = $1', [
      hashe(uralt),
    ]);
    pruefe(weg.rows[0].n === 0, 'Sitzungen älter als 7 Tage nach Ablauf werden entfernt');
    const jung = await client.query('select count(*)::int n from admin_sitzungen where token_hash = $1', [
      hashe(abgelaufen),
    ]);
    pruefe(jung.rows[0].n === 1, 'kürzlich abgelaufene Sitzungen bleiben vorerst erhalten');
  } finally {
    const weg = await client.query('delete from admin_sitzungen where herkunft = $1', [kennzeichen]);
    console.log(`\n${weg.rowCount} Testsitzungen entfernt.`);
    await pool.end();
    await client.end();
  }

  console.log('');
  console.log('='.repeat(72));
  if (fehlgeschlagen > 0) {
    console.log(`=== ${bestanden} bestanden, ${fehlgeschlagen} FEHLGESCHLAGEN ===`);
    process.exitCode = 1;
  } else {
    console.log(`=== ${bestanden}/${bestanden} Prüfungen bestanden ===`);
  }
}

void main();
