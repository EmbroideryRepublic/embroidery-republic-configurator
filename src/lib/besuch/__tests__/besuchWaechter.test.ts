/**
 * Besucherzähler – Wächter für Zusagen, die sich nicht in einer einzelnen
 * Funktion zeigen, sondern im Zusammenspiel der Dateien.
 *
 * Die Datenschutzerklärung stützt sich auf diese Zusagen. Jede Prüfung hier
 * schützt eine davon davor, später unbemerkt aufgeweicht zu werden:
 *   • das Endgerät bleibt unberührt (kein Speicher, keine Merkmale)
 *   • die Route verrät nichts und arbeitet in der richtigen Reihenfolge
 *   • in der Datenbank steht keine IP-Adresse, die Tabellen sind gesperrt
 *   • die Aufräumung der Tageskennungen ist wirklich angeschlossen
 *   • der Zähler läuft NUR, wenn die Datenschutzerklärung ihn benennt
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const lies = (...teile: string[]) => readFileSync(join(...teile), 'utf8');

/** Entfernt Kommentare, damit ein Verbot im Erklärtext nicht selbst als Verstoß zählt. */
function ohneKommentare(quelle: string): string {
  return quelle.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const KOMPONENTE = join('src', 'components', 'layout', 'Besuchszaehler.tsx');
const ROUTE = join('src', 'app', 'api', 'besuch', 'route.ts');
const MIGRATION = join('supabase', 'migrations', '0037_besuchszaehler.sql');

// ── Endgerät: nichts speichern, nichts auslesen ──────────────────────────

test('die Meldekomponente berührt das Endgerät nicht', () => {
  const code = ohneKommentare(lies(KOMPONENTE));
  const verboten =
    /localStorage|sessionStorage|indexedDB|document\.cookie|cookieStore|document\.referrer|navigator\.(userAgent|language|languages|platform|hardwareConcurrency|deviceMemory|plugins)|\bscreen\.|devicePixelRatio|innerWidth|innerHeight|canvas|fingerprint/i;
  const treffer = code.match(verboten);
  assert.equal(treffer, null, `Die Meldung darf nichts speichern oder auslesen – gefunden: ${treffer?.[0]}`);
});

test('die Meldekomponente sendet nur Pfad und Quelle – und nur an den eigenen Zähler', () => {
  const code = ohneKommentare(lies(KOMPONENTE));
  assert.match(code, /JSON\.stringify\(\{\s*pfad,\s*quelle\s*\}\)/, 'die Nutzlast darf nur pfad und quelle enthalten');
  const ziele = [...code.matchAll(/(?:sendBeacon|fetch)\(\s*'([^']+)'/g)].map((m) => m[1]);
  assert.ok(ziele.length >= 1, 'es muss mindestens ein Meldeweg vorhanden sein');
  assert.ok(ziele.every((z) => z === '/api/besuch'), `Meldungen gehen an: ${ziele.join(', ')}`);
});

test('nicht öffentliche Bereiche meldet schon die Komponente gar nicht erst', () => {
  const code = lies(KOMPONENTE);
  for (const bereich of ['/admin', '/api', '/bestellung', '/konto', '/auth']) {
    assert.ok(code.includes(`'${bereich}'`), `${bereich} fehlt in der Ausschlussliste der Komponente`);
  }
});

// ── Route: verschwiegen, in der richtigen Reihenfolge ────────────────────

test('die Route antwortet nie mit Inhalt', () => {
  const code = ohneKommentare(lies(ROUTE));
  assert.match(code, /status:\s*204/);
  assert.ok(!/NextResponse\.json\(|Response\.json\(/.test(code), 'die Route darf nichts zurückgeben, was den Grund verrät');
});

test('die Route filtert zuerst, begrenzt danach und schreibt erst dann in die Datenbank', () => {
  const code = ohneKommentare(lies(ROUTE));
  const filter = code.indexOf('ausschlussGrund(');
  const pfad = code.indexOf('normalisierePfad(');
  const limit = code.indexOf("pruefeRateLimit('besuch')");
  const schreiben = code.indexOf("rpc('erfasse_besuch'");
  assert.ok(filter > 0 && pfad > 0 && limit > 0 && schreiben > 0, 'ein Schritt fehlt');
  assert.ok(filter < pfad, 'Roboter und Widersprüche müssen vor allem anderen ausscheiden');
  assert.ok(pfad < limit, 'ungültige Pfade dürfen kein Rate-Limit-Budget verbrauchen');
  assert.ok(limit < schreiben, 'die Begrenzung muss vor dem Schreiben greifen');
});

test('die Route zählt nur in Produktion und nur auf der echten Domain', () => {
  const code = ohneKommentare(lies(ROUTE));
  assert.match(code, /NODE_ENV\s*!==\s*'production'/);
  assert.match(code, /istZaehlHost\(/);
});

test('die Route schreibt weder Adresse noch Kennung noch Browserkennung ins Protokoll', () => {
  const code = ohneKommentare(lies(ROUTE));
  const logZeilen = code.split(/\r?\n/).filter((z) => /console\./.test(z));
  assert.ok(logZeilen.length > 0);
  for (const zeile of logZeilen) {
    assert.ok(
      !/ermittleIp|kennung|user-agent|userAgent|\bip\b/i.test(zeile),
      `Diese Protokollzeile könnte Besucherdaten enthalten: ${zeile.trim()}`
    );
  }
});

// ── Datenbank: keine Adresse, alles gesperrt ─────────────────────────────

const TABELLEN = ['besuch_summe', 'besuch_seiten', 'besuch_quellen', 'besuch_kennungen'];
const FUNKTIONEN = ['erfasse_besuch(date, text, text, text)', 'lade_besuchsstatistik(date)', 'raeume_besuch_kennungen_auf()'];

test('keine Spalte nimmt eine IP-Adresse auf', () => {
  const sql = lies(MIGRATION)
    .split(/\r?\n/)
    .filter((z) => !z.trim().startsWith('--'))
    .join('\n');
  assert.ok(!/^\s*(ip|ip_adresse|ipadresse|remote_addr|client_ip|user_agent|useragent)\b/im.test(sql), 'eine Spalte für IP/Browserkennung wäre ein Rückschritt');
  assert.ok(!/\binet\b/i.test(sql), 'ein Netzwerkadress-Typ hat in dieser Migration nichts zu suchen');
});

test('jede Tabelle ist per Row Level Security gesperrt und hat keine Policy', () => {
  const sql = lies(MIGRATION);
  for (const tabelle of TABELLEN) {
    assert.match(sql, new RegExp(`alter table public\\.${tabelle} enable row level security`), `${tabelle}: RLS fehlt`);
    assert.ok(!new RegExp(`create policy[^;]*public\\.${tabelle}`, 'i').test(sql), `${tabelle}: eine Policy würde die Sperre aufheben`);
  }
  assert.match(sql, /revoke all on table[\s\S]*besuch_kennungen[\s\S]*from anon, authenticated/);
});

test('jede Funktion ist für public, anon und authenticated gesperrt', () => {
  const sql = lies(MIGRATION);
  for (const funktion of FUNKTIONEN) {
    const gesperrt = `revoke all on function public.${funktion} from public, anon, authenticated`;
    assert.ok(sql.includes(gesperrt), `nicht gesperrt: ${funktion}`);
  }
});

// ── Aufräumung ───────────────────────────────────────────────────────────

test('die Aufräumung der Tageskennungen hängt am Cron', () => {
  const cron = lies('src', 'app', 'api', 'cron', 'process-supplier-orders', 'route.ts');
  assert.ok(cron.includes("rpc('raeume_besuch_kennungen_auf')"), 'ohne diesen Aufruf bliebe die Löschzusage allein an der Datenbank-Sicherung hängen');
});

test('die Aufräumung hängt den Cron nicht auf, solange die Migration fehlt – und verschluckt keine anderen Fehler', () => {
  // Der Code darf vor der Migration live gehen, ohne dass der Cron alle zehn
  // Minuten ein ERROR-Ereignis erzeugt, das echte Alarme überdeckt.
  const cron = ohneKommentare(lies('src', 'app', 'api', 'cron', 'process-supplier-orders', 'route.ts'));
  assert.match(cron, /FUNKTION_FEHLT\s*=\s*new Set\(\['PGRST202',\s*'42883'\]\)/, 'die zwei Codes für „Funktion nicht gefunden"');
  assert.match(cron, /besuchFehler\s*=\s*besuch\.error\s*&&\s*!FUNKTION_FEHLT\.has\(besuch\.error\.code\)/);
  // In der Fehlerkette darf nicht mehr der rohe Fehler stehen – sonst greift die Ausnahme nicht.
  assert.ok(!/limits\.error\s*\|\|\s*besuch\.error/.test(cron), 'die Fehlerkette nutzt noch den rohen besuch.error');
  assert.match(cron, /limits\.error\s*\|\|\s*besuchFehler/);
});

// ── Adminbereich ─────────────────────────────────────────────────────────

test('die Auswertung ist nur für angemeldete Betreiber lesbar', () => {
  for (const datei of [join('src', 'app', 'admin', 'besucher', 'page.tsx'), join('src', 'components', 'admin', 'BesucherStreifen.tsx')]) {
    assert.match(ohneKommentare(lies(datei)), /await istAdmin\(\)/, `${datei}: eigene Prüfung fehlt`);
  }
});

test('der Menüpunkt „Besucher" führt zur Auswertung', () => {
  assert.match(lies('src', 'app', 'admin', 'layout.tsx'), /href="\/admin\/besucher"/);
});

// ── Datenschutzerklärung ─────────────────────────────────────────────────

test('der Zähler läuft nur, wenn die Datenschutzerklärung ihn benennt – und widerspricht ihm nicht mehr', () => {
  const layout = ohneKommentare(lies('src', 'app', 'layout.tsx'));
  const aktiv = /<Besuchszaehler\b/.test(layout);
  if (!aktiv) return; // Solange er nicht eingebunden ist, gibt es nichts zu erklären.

  const datenschutz = lies('src', 'app', 'datenschutz', 'page.tsx');
  assert.ok(
    /Reichweitenmessung/.test(datenschutz),
    'der Zähler ist aktiv, aber die Datenschutzerklärung (src/app/datenschutz/page.tsx) nennt keine „Reichweitenmessung"'
  );
  assert.ok(
    !/keine\s+Analyse-Werkzeuge/.test(datenschutz.replace(/\s+/g, ' ')),
    'die Datenschutzerklärung behauptet weiterhin, es gebe keine Analyse-Werkzeuge'
  );
});
