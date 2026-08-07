/**
 * ═══════════════════════════════════════════════════════════════════════
 * DSGVO: MOTIVDATEIEN ABGESCHLOSSENER BESTELLUNGEN ENTFERNEN
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Aufruf:
 *   npm run dsgvo:altdateien              nur melden (Standard)
 *   npm run dsgvo:altdateien -- --loeschen   tatsächlich entfernen
 *
 * ── Warum ein eigener, manuell auszulösender Lauf – nicht Teil des Crons ─
 * Anders als das reine Aufräumen von Tabellenzeilen (Migration 0022,
 * automatisch über die Cron-Route) verändert dieser Lauf den DATEISPEICHER
 * einer Bestellung, die weiterhin als Zeile besteht (die Bestellung selbst
 * bleibt bis zur steuerlichen Aufbewahrungsfrist erhalten – nur die
 * Motivdateien nicht). Dasselbe Vorsichtsprinzip wie beim bestehenden
 * `scripts/verwaisteDateien.mts`: ein Speicher-Löschvorgang ist nicht
 * rückgängig zu machen, deshalb Trockenlauf zuerst und ausdrückliche
 * Freigabe für den Ernstfall – hier zusätzlich vorsichtiger, weil es nicht
 * um verwaiste, sondern um gültige Bestellungen geht.
 *
 * ── Bedingung: BEIDE müssen erfüllt sein ──────────────────────────────
 *   1. Die Bestellung ist abgeschlossen ODER storniert
 *      (completed_at bzw. cancelled_at ist gesetzt).
 *   2. Dieser Zeitpunkt liegt länger als BESTELLDATEIEN_LOESCHEN_NACH_MONATEN
 *      zurück (config/dsgvo.ts).
 *
 * Laufende Bestellungen (weder abgeschlossen noch storniert) werden NIE
 * angefasst, unabhängig vom Alter – ihre Motivdateien werden noch aktiv
 * gebraucht (Produktion, Nachbestellung, Rückfragen).
 *
 * Betrifft ausschließlich den Dateispeicher. Die Bestellzeile selbst bleibt
 * unverändert; ihre Anonymisierung folgt separat und viel später
 * (`anonymisiere_alte_bestellungen`, 10 Jahre statt 24 Monate).
 */
import { readFileSync } from 'node:fs';

// Dieselbe .env.local wie der Server – als eigenständiger Lauf gibt es keine
// Next.js-Umgebung, die sie einliest.
for (const zeile of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const t = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(zeile);
  if (t) process.env[t[1]!] = t[2]!.trim().replace(/^["']|["']$/g, '');
}

const { createAdminClient } = await import('@/lib/supabase/server');
const { BESTELLDATEIEN_LOESCHEN_NACH_MONATEN } = await import('@/config/dsgvo');

const BUCKET = 'production-files';
const WURZEL = 'orders';

const loeschen = process.argv.includes('--loeschen');

interface Fund {
  orderId: string;
  bestelltAm: string;
  abgeschlossenAm: string;
  dateien: string[];
  bytes: number;
}

async function main(): Promise<void> {
  const db = createAdminClient();
  const grenze = new Date(Date.now() - BESTELLDATEIEN_LOESCHEN_NACH_MONATEN * 30 * 24 * 60 * 60 * 1000);

  console.log('='.repeat(78));
  console.log('DSGVO – MOTIVDATEIEN ABGESCHLOSSENER BESTELLUNGEN');
  console.log(loeschen ? 'Modus: LÖSCHEN' : 'Modus: nur melden (mit --loeschen wird entfernt)');
  console.log(`Frist: ${BESTELLDATEIEN_LOESCHEN_NACH_MONATEN} Monate nach Abschluss/Stornierung`);
  console.log(`Grenzdatum: ${grenze.toISOString().slice(0, 10)}`);
  console.log('='.repeat(78));

  // ── 1. Qualifizierende Bestellungen ─────────────────────────────────
  // Abgeschlossen ODER storniert, und der jeweilige Zeitpunkt liegt vor der
  // Grenze. `.or()` mit zwei getrennten Bedingungen, weil eine Bestellung
  // nie beide Zeitstempel gleichzeitig trägt.
  const { data: bestellungen, error } = await db
    .from('orders')
    .select('id, created_at, completed_at, cancelled_at')
    .eq('order_type', 'order')
    .or(
      `and(completed_at.not.is.null,completed_at.lt.${grenze.toISOString()}),` +
        `and(cancelled_at.not.is.null,cancelled_at.lt.${grenze.toISOString()})`
    );

  if (error) {
    console.error('Die Bestellungen konnten nicht gelesen werden:', error.message);
    process.exitCode = 1;
    return;
  }
  if (!bestellungen || bestellungen.length === 0) {
    console.log('\nKeine Bestellung erreicht die Frist – nichts zu tun.');
    return;
  }
  console.log(`\n${bestellungen.length} Bestellung(en) jenseits der Frist.`);

  // ── 2. Zugehörige Dateien im Speicher sammeln ───────────────────────
  const funde: Fund[] = [];
  for (const b of bestellungen) {
    const orderId = b.id as string;
    const { data: dateien } = await db.storage.from(BUCKET).list(`${WURZEL}/${orderId}`, { limit: 1000 });
    if (!dateien || dateien.length === 0) continue;

    funde.push({
      orderId,
      bestelltAm: ((b.created_at as string) ?? '').slice(0, 10),
      abgeschlossenAm: (((b.completed_at ?? b.cancelled_at) as string) ?? '').slice(0, 10),
      dateien: dateien.map((d) => `${WURZEL}/${orderId}/${d.name}`),
      bytes: dateien.reduce((s, d) => s + (((d.metadata as { size?: number } | null)?.size) ?? 0), 0),
    });
  }

  if (funde.length === 0) {
    console.log('\nDiese Bestellungen haben keine Dateien mehr im Speicher – nichts zu tun.');
    return;
  }

  // ── 3. Bericht ──────────────────────────────────────────────────────
  const gesamtBytes = funde.reduce((s, f) => s + f.bytes, 0);
  console.log('\n' + '─'.repeat(78));
  console.log(`${funde.length} Bestellung(en) mit Motivdateien, ${(gesamtBytes / 1024 / 1024).toFixed(1)} MB`);
  console.log('─'.repeat(78));
  for (const f of funde) {
    console.log(
      `  ${f.orderId}  bestellt ${f.bestelltAm}  abgeschlossen ${f.abgeschlossenAm}  ` +
        `${String(f.dateien.length).padStart(3)} Datei(en)  ${(f.bytes / 1024).toFixed(0).padStart(7)} KB`
    );
  }

  if (!loeschen) {
    console.log('\nNichts geändert. Zum Entfernen erneut mit --loeschen aufrufen.');
    console.log('Die Bestellzeile selbst bleibt in jedem Fall unverändert (nur der Dateispeicher betroffen).');
    return;
  }

  // ── 4. Löschen ──────────────────────────────────────────────────────
  let entfernt = 0;
  for (const f of funde) {
    const { error: loeschFehler } = await db.storage.from(BUCKET).remove(f.dateien);
    if (loeschFehler) {
      console.error(`  ✘ ${f.orderId}: ${loeschFehler.message}`);
      continue;
    }
    entfernt += f.dateien.length;
    console.log(`  ✔ ${f.orderId} entfernt (${f.dateien.length} Datei(en))`);
  }
  console.log(`\n${entfernt} Datei(en) entfernt, ${(gesamtBytes / 1024 / 1024).toFixed(1)} MB freigegeben.`);
}

void main();
