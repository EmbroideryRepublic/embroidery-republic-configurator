/**
 * Wächter der Ereignis-Messung („Weg zur Bestellung“, Migration 0040).
 *
 * Die Messung muss datensparsam und von der Bestell- und Zahlungslogik getrennt bleiben. Diese Tests halten fest:
 *   • nur Namen aus der festen Liste werden angenommen
 *   • die Auswertung rechnet richtig
 *   • die Migration speichert keine IP, keine Datei-, Produkt-, Preis- oder Personendaten und hat keine Bindung an Bestellungen
 *   • der Client schreibt nichts auf das Endgerät
 *   • die Messpunkte stehen nur an den vier vorgesehenen Stellen – nie in Bestell-, Zahlungs- oder Warenkorb-Logik
 *   • der Schalter ist AUS, solange die Datenschutzerklärung nicht ergänzt wurde
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { BESUCH_EREIGNISSE, BESUCH_EREIGNIS_NAMEN, EREIGNIS_MESSUNG_AKTIV } from '@/config/besuch';
import { bereinigeEreignis } from '../erfassen';
import { baueQuellenZeilen, baueTrichter } from '../ereignisse';

const WURZEL = process.cwd();
const lies = (rel: string) => readFileSync(path.join(WURZEL, rel), 'utf8');

test('Ereignisse: nur Namen der festen Liste werden angenommen', () => {
  for (const e of BESUCH_EREIGNISSE) assert.equal(bereinigeEreignis(e), e);
  assert.equal(bereinigeEreignis('  In_Den_Warenkorb '), 'in_den_warenkorb');
  for (const roh of ['', 'warenkorb', 'in_den_warenkorb; drop table', '<script>', 'kasse_gestartet', 42, null, undefined, {}, ['in_den_warenkorb']]) {
    assert.equal(bereinigeEreignis(roh), null, String(roh));
  }
  for (const e of BESUCH_EREIGNISSE) assert.ok(BESUCH_EREIGNIS_NAMEN[e].length > 3);
});

test('Trichter: Anteile an allen Besuchern und am geöffneten Konfigurator', () => {
  const t = baueTrichter(
    [
      { ereignis: 'konfigurator_geoeffnet', besucher: 40 },
      { ereignis: 'motiv_hochgeladen', besucher: 10 },
      { ereignis: 'in_den_warenkorb', besucher: 4 },
    ],
    200
  );
  assert.deepEqual(t.map((s) => s.ereignis), [...BESUCH_EREIGNISSE]);
  assert.equal(t[0]!.anteilAnAllen, 0.2);
  assert.equal(t[0]!.anteilAnGeoeffnet, null);
  assert.equal(t[1]!.anteilAnGeoeffnet, 0.25);
  assert.equal(t[2]!.besucher, 0, 'fehlendes Ereignis zählt 0');
  assert.equal(t[3]!.anteilAnGeoeffnet, 0.1);
});

test('Trichter: ohne Besucher keine Division durch null', () => {
  const t = baueTrichter([], 0);
  for (const s of t) {
    assert.equal(s.besucher, 0);
    assert.equal(s.anteilAnAllen, null);
    assert.equal(s.anteilAnGeoeffnet, null);
  }
});

test('Quellen-Zeilen: je Quelle alle Ereignisse, unbekannte Ereignisse werden ignoriert, sortiert nach Warenkörben', () => {
  const z = baueQuellenZeilen([
    { quelle: 'pinterest', ereignis: 'konfigurator_geoeffnet', besucher: 3 },
    { quelle: 'pinterest', ereignis: 'in_den_warenkorb', besucher: 1 },
    { quelle: 'ohne-kennzeichnung', ereignis: 'konfigurator_geoeffnet', besucher: 9 },
    { quelle: 'ohne-kennzeichnung', ereignis: 'unbekannt', besucher: 99 },
  ]);
  assert.deepEqual(z.map((x) => x.quelle), ['pinterest', 'ohne-kennzeichnung']);
  assert.equal(z[0]!.je.in_den_warenkorb, 1);
  assert.equal(z[1]!.je.konfigurator_geoeffnet, 9);
  assert.equal(z[1]!.je.motiv_hochgeladen, 0);
});

test('Migration 0040: nur Zahlen und Kennungen, nichts zu IP, Datei, Produkt, Preis, Person oder Bestellung', () => {
  const sql = lies('supabase/migrations/0040_besuch_ereignisse.sql')
    .split(/\r?\n/)
    .filter((z) => !z.trim().startsWith('--'))
    .join('\n');
  const spaltenBlock = sql.match(/create table if not exists public\.besuch_ereignis[\s\S]*?\n\);/g)?.join('\n') ?? '';
  assert.ok(spaltenBlock.length > 100, 'Tabellen nicht gefunden');
  assert.doesNotMatch(spaltenBlock, /\b(ip|ip_adresse|user_agent|useragent|produkt|product|datei|file|preis|price|name|email|mail|order|bestell|kunde|customer)\w*\s+(text|integer|numeric|uuid|inet|jsonb)/i);
  assert.ok(!/\bforeign key\b|\breferences\b/i.test(sql), 'eine Bindung an andere Tabellen widerspricht der Trennung');
  assert.ok(!/\b(orders|order_items|payments|customers|invoices|shipments)\b/i.test(sql), 'die Migration darf Bestell- und Zahlungstabellen nicht berühren');
});

test('Migration 0040: Row Level Security ohne Policy, alle Funktionen für Browser-Rollen gesperrt', () => {
  const sql = lies('supabase/migrations/0040_besuch_ereignisse.sql');
  for (const t of ['besuch_ereignisse', 'besuch_ereignis_kennungen']) {
    assert.match(sql, new RegExp(`alter table public\\.${t} enable row level security`), `${t}: RLS fehlt`);
    assert.ok(!new RegExp(`create policy[^;]*${t}`, 'i').test(sql), `${t}: eine Policy würde die Sperre aufheben`);
  }
  assert.match(sql, /revoke all on table public\.besuch_ereignisse, public\.besuch_ereignis_kennungen from anon, authenticated/);
  for (const f of ['erfasse_besuchs_ereignis(date, text, text, text)', 'lade_ereignisstatistik(date)', 'raeume_besuch_ereignisse_auf()']) {
    assert.ok(sql.includes(`revoke all on function public.${f} from public, anon, authenticated`), `nicht gesperrt: ${f}`);
  }
});

test('Client: kein Cookie, kein Local/Session Storage, keine Geräteangaben, nur der Ereignisname wird gesendet', () => {
  const quelle = lies('src/lib/besuch/ereignisMelden.ts')
    .split(/\r?\n/)
    .filter((z) => !z.trim().startsWith('*') && !z.trim().startsWith('//') && !z.trim().startsWith('/*'))
    .join('\n');
  assert.doesNotMatch(quelle, /localStorage|sessionStorage|indexedDB|document\.cookie|document\.referrer|screen\.|navigator\.(userAgent|language|platform|hardwareConcurrency)/);
  assert.match(quelle, /JSON\.stringify\(\{ ereignis \}\)/, 'die Meldung enthält mehr als den Ereignisnamen');
});

function alleQuelldateien(ordner: string, treffer: string[] = []): string[] {
  for (const name of readdirSync(ordner)) {
    const voll = path.join(ordner, name);
    if (statSync(voll).isDirectory()) {
      if (name === '__tests__' || name === 'node_modules') continue;
      alleQuelldateien(voll, treffer);
    } else if (/\.(ts|tsx)$/.test(name)) treffer.push(voll);
  }
  return treffer;
}

test('Messpunkte: genau die vier vorgesehenen Dateien, nie in Bestell-, Zahlungs- oder Warenkorb-Speicher', () => {
  const dateien = alleQuelldateien(path.join(WURZEL, 'src'))
    .filter((f) => /meldeBestellwegSchritt\(/.test(readFileSync(f, 'utf8')))
    .map((f) => path.relative(WURZEL, f).replace(/\\/g, '/'))
    .sort();
  assert.deepEqual(dateien, [
    'src/components/configurator/ConfiguratorPrototype.tsx',
    'src/components/configurator/LogoUploader.tsx',
    'src/components/configurator/SummaryPanel.tsx',
    'src/components/configurator/TextToolPanel.tsx',
    'src/lib/besuch/ereignisMelden.ts',
  ]);
  // Jeder Aufruf steht NACH der eigentlichen Aktion – die Messung ändert deren Verlauf nicht.
  const summary = lies('src/components/configurator/SummaryPanel.tsx');
  assert.ok(summary.indexOf('addCartItem(item);') < summary.indexOf("meldeBestellwegSchritt('in_den_warenkorb')"), 'Warenkorb: Messung vor der Aktion');
  const logo = lies('src/components/configurator/LogoUploader.tsx');
  assert.ok(logo.indexOf('addElement(element);') < logo.indexOf("meldeBestellwegSchritt('motiv_hochgeladen')"), 'Upload: Messung vor der Aktion');
  // Nichts davon liegt in Server-, Bestell- oder Zahlungscode.
  for (const verboten of ['src/stores/cartStore.ts', 'src/lib/orders', 'src/lib/payments', 'src/app/api/webhooks', 'src/app/bestellung']) {
    for (const d of dateien) assert.ok(!d.startsWith(verboten), `${d} liegt in ${verboten}`);
  }
});

test('Schalter: AUS, bis der ergänzte Datenschutz-Satz freigegeben ist – dann bewusst auf true setzen und diesen Test anpassen', () => {
  assert.equal(EREIGNIS_MESSUNG_AKTIV, false);
  // Die Route antwortet auch bei „aus“ immer mit 204 und speichert nichts (der Schalter ist die erste Prüfung).
  const route = lies('src/app/api/ereignis/route.ts');
  assert.ok(route.indexOf('EREIGNIS_MESSUNG_AKTIV') < route.indexOf('createAdminClient()'), 'Schalter wird nicht vor dem Schreiben geprüft');
  assert.ok(route.indexOf('EREIGNIS_MESSUNG_AKTIV') < route.indexOf('request.text()'), 'Schalter wird nicht vor dem Lesen geprüft');
});
