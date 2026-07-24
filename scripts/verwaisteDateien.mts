/**
 * ═══════════════════════════════════════════════════════════════════════
 * VERWAISTE DATEIEN FINDEN UND ENTFERNEN
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Aufruf:
 *   npm run dateien:pruefen          nur melden (Standard)
 *   npm run dateien:pruefen -- --loeschen   tatsächlich entfernen
 *
 * ── Warum es diesen Lauf gibt ─────────────────────────────────────────
 * Seit der atomaren Bestellung (K1) liegen Datei-Uploads VOR der
 * Transaktion. Scheitert sie danach, bleiben Dateien ohne zugehörige
 * Bestellung zurück. Kein Datenverlust und kein falscher Zustand – nur
 * belegter Speicher.
 *
 * ── Warum nicht im Fehlerfall löschen ─────────────────────────────────
 * Ein `catch`-Block, der die Dateien entfernt, hilft nur, solange der
 * Prozess lebt. Genau bei Absturz, Zeitüberschreitung oder Neustart – den
 * Fällen, um die es geht – greift er nicht. Schlimmer: Bei einem
 * Wiederholungsversuch mit derselben Kennung würde er die Dateien einer
 * inzwischen erfolgreichen Bestellung löschen.
 *
 * ── Es wird nichts geraten ────────────────────────────────────────────
 * Gelöscht wird nur, wenn BEIDE Bedingungen erfüllt sind:
 *   1. Es existiert KEINE Bestellung mit dieser Kennung.
 *   2. Der Ordner ist älter als die Schutzfrist.
 *
 * Die Frist ist der Sicherheitsabstand zu Bestellvorgängen, die gerade
 * laufen. Ein Bestellvorgang dauert Sekunden; 48 Stunden sind großzügig.
 */
import { readFileSync } from 'node:fs';

// Dieselbe .env.local wie der Server – als eigenständiger Lauf gibt es keine
// Next.js-Umgebung, die sie einliest.
for (const zeile of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const t = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(zeile);
  if (t) process.env[t[1]!] = t[2]!.trim().replace(/^["']|["']$/g, '');
}

const { createAdminClient } = await import('@/lib/supabase/server');

/** Ordner unter dieser Frist werden nie angefasst. */
const SCHUTZFRIST_STUNDEN = 48;
const BUCKET = 'production-files';
const WURZEL = 'orders';

const loeschen = process.argv.includes('--loeschen');

interface Fund {
  kennung: string;
  dateien: string[];
  bytes: number;
  aeltestesDatum: Date;
}

async function main(): Promise<void> {
  const db = createAdminClient();

  console.log('='.repeat(78));
  console.log('VERWAISTE DATEIEN');
  console.log(loeschen ? 'Modus: LÖSCHEN' : 'Modus: nur melden (mit --loeschen wird entfernt)');
  console.log(`Schutzfrist: ${SCHUTZFRIST_STUNDEN} Stunden`);
  console.log('='.repeat(78));

  // ── 1. Alle Bestellordner auflisten ─────────────────────────────────
  const { data: ordner, error: listenFehler } = await db.storage.from(BUCKET).list(WURZEL, { limit: 10000 });
  if (listenFehler) {
    console.error('Der Speicher konnte nicht gelesen werden:', listenFehler.message);
    process.exitCode = 1;
    return;
  }
  if (!ordner || ordner.length === 0) {
    console.log('\nKeine Bestellordner vorhanden – nichts zu tun.');
    return;
  }
  console.log(`\n${ordner.length} Bestellordner im Speicher.`);

  // ── 2. Welche Kennungen haben eine Bestellung? ──────────────────────
  // In einer Abfrage statt einer je Ordner: Bei 10.000 Ordnern wären das
  // sonst 10.000 Rundreisen zur Datenbank.
  const kennungen = ordner.map((o) => o.name).filter((n) => /^[0-9a-f-]{36}$/i.test(n));
  const { data: bestellungen, error: dbFehler } = await db.from('orders').select('id').in('id', kennungen);
  if (dbFehler) {
    console.error('Die Bestellungen konnten nicht gelesen werden:', dbFehler.message);
    process.exitCode = 1;
    return;
  }
  const vorhanden = new Set((bestellungen ?? []).map((b) => b.id as string));
  console.log(`${vorhanden.size} davon haben eine Bestellung.`);

  // Ordnernamen, die keine gültige Kennung sind, werden NIE angefasst –
  // sie stammen nicht aus dem Bestellvorgang und wir raten nicht.
  const unbekannteNamen = ordner.filter((o) => !/^[0-9a-f-]{36}$/i.test(o.name));
  if (unbekannteNamen.length > 0) {
    console.log(`${unbekannteNamen.length} Ordner mit unerwartetem Namen – bleiben unberührt.`);
  }

  // ── 3. Verwaiste Ordner sammeln ─────────────────────────────────────
  const grenze = new Date(Date.now() - SCHUTZFRIST_STUNDEN * 60 * 60 * 1000);
  const funde: Fund[] = [];
  const geschuetzt: string[] = [];

  for (const o of ordner) {
    if (!/^[0-9a-f-]{36}$/i.test(o.name)) continue;
    if (vorhanden.has(o.name)) continue;

    const { data: dateien } = await db.storage.from(BUCKET).list(`${WURZEL}/${o.name}`, { limit: 1000 });
    if (!dateien || dateien.length === 0) continue;

    const daten = dateien
      .map((d) => new Date((d.created_at as string) ?? (d.updated_at as string) ?? Date.now()))
      .filter((d) => !Number.isNaN(d.getTime()));
    const aeltestes = daten.length > 0 ? new Date(Math.min(...daten.map((d) => d.getTime()))) : new Date();

    if (aeltestes > grenze) {
      geschuetzt.push(o.name);
      continue;
    }

    funde.push({
      kennung: o.name,
      dateien: dateien.map((d) => `${WURZEL}/${o.name}/${d.name}`),
      bytes: dateien.reduce((s, d) => s + (((d.metadata as { size?: number } | null)?.size) ?? 0), 0),
      aeltestesDatum: aeltestes,
    });
  }

  if (geschuetzt.length > 0) {
    console.log(`${geschuetzt.length} verwaiste Ordner sind jünger als die Schutzfrist – bleiben unberührt.`);
  }

  if (funde.length === 0) {
    console.log('\nKeine verwaisten Dateien gefunden.');
    return;
  }

  // ── 4. Bericht ──────────────────────────────────────────────────────
  const gesamtBytes = funde.reduce((s, f) => s + f.bytes, 0);
  console.log('\n' + '─'.repeat(78));
  console.log(`${funde.length} verwaiste Bestellordner, ${(gesamtBytes / 1024 / 1024).toFixed(1)} MB`);
  console.log('─'.repeat(78));
  for (const f of funde) {
    console.log(
      `  ${f.kennung}  ${String(f.dateien.length).padStart(3)} Datei(en)  ` +
        `${(f.bytes / 1024).toFixed(0).padStart(7)} KB  seit ${f.aeltestesDatum.toISOString().slice(0, 10)}`
    );
  }

  if (!loeschen) {
    console.log('\nNichts geändert. Zum Entfernen erneut mit --loeschen aufrufen.');
    return;
  }

  // ── 5. Löschen ──────────────────────────────────────────────────────
  let entfernt = 0;
  for (const f of funde) {
    const { error } = await db.storage.from(BUCKET).remove(f.dateien);
    if (error) {
      console.error(`  ✘ ${f.kennung}: ${error.message}`);
      continue;
    }
    entfernt += f.dateien.length;
    console.log(`  ✔ ${f.kennung} entfernt (${f.dateien.length} Datei(en))`);
  }
  console.log(`\n${entfernt} Datei(en) entfernt, ${(gesamtBytes / 1024 / 1024).toFixed(1)} MB freigegeben.`);
}

void main();
