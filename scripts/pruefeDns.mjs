/**
 * ═══════════════════════════════════════════════════════════════════════
 * DNS-PRÜFUNG FÜR DEN E-MAIL-VERSAND
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Prüft die öffentliche DNS-Konfiguration vor der Domain-Verifikation bei
 * Resend – und weist nach, dass der bestehende Mailverkehr der Hauptdomain
 * dabei unangetastet geblieben ist.
 *
 * Aufruf:
 *   node scripts/pruefeDns.mjs --basis      Ist-Zustand als Referenz sichern
 *   node scripts/pruefeDns.mjs              prüfen und mit der Referenz vergleichen
 *
 * ── Warum die Referenz VOR der Änderung entsteht ──────────────────────
 * „Die Hauptdomain ist unverändert" lässt sich nur behaupten, wenn der
 * vorherige Zustand festgehalten wurde. Ohne Referenz bliebe es eine
 * Vermutung.
 *
 * ── Warum mehrere Resolver ────────────────────────────────────────────
 * Ein Eintrag kann beim eigenen Anbieter schon sichtbar sein, während ihn
 * Google und Cloudflare noch nicht kennen. Erst wenn mehrere unabhängige
 * Resolver dasselbe liefern, ist die Änderung wirklich verbreitet.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const HAUPT = 'embroidery-republic.com';
const SUB = `send.${HAUPT}`;
const DKIM = `resend._domainkey.${SUB}`;
const RESOLVER = [
  ['Google', '8.8.8.8'],
  ['Cloudflare', '1.1.1.1'],
  ['Quad9', '9.9.9.9'],
];
const REFERENZ = 'dns-referenz.json';

/** Fragt einen Eintrag ab. Liefert die gefundenen Werte als Liste. */
function frage(typ, name, resolver) {
  try {
    const aus = execFileSync('nslookup', ['-type=' + typ, name, resolver], {
      encoding: 'utf8',
      timeout: 15000,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const werte = [];
    if (typ === 'TXT') {
      // nslookup bricht lange TXT-Werte auf mehrere Zeilen um.
      const treffer = aus.match(/"([^"]*)"/g) ?? [];
      let puffer = '';
      for (const t of treffer) {
        const roh = t.slice(1, -1);
        if (roh.startsWith('v=spf1') || roh.startsWith('v=DKIM1') || roh.startsWith('p=') || roh.startsWith('k=')) {
          if (puffer) werte.push(puffer);
          puffer = roh;
        } else {
          puffer += roh; // Fortsetzung desselben Wertes
        }
      }
      if (puffer) werte.push(puffer);
    } else if (typ === 'MX') {
      for (const m of aus.matchAll(/mail exchanger = (\S+)/g)) werte.push(m[1]);
    }
    return werte;
  } catch {
    return [];
  }
}

/** Fragt bei allen Resolvern und meldet, ob sie übereinstimmen. */
function frageAlle(typ, name) {
  const je = RESOLVER.map(([bez, ip]) => [bez, frage(typ, name, ip)]);
  const signaturen = new Set(je.map(([, w]) => JSON.stringify([...w].sort())));
  return { je, einig: signaturen.size === 1, werte: je[0][1] };
}

const nurBasis = process.argv.includes('--basis');
const befunde = [];
const merke = (ok, text, detail = '') => {
  befunde.push({ ok, text, detail });
  console.log(`${ok ? '✓' : '✗'} ${text}${detail ? '\n    ' + detail : ''}`);
};

console.log('='.repeat(72));
console.log(nurBasis ? 'DNS-REFERENZ ANLEGEN' : 'DNS-PRÜFUNG');
console.log('='.repeat(72));

// ── Hauptdomain ──────────────────────────────────────────────────────
const rootSpf = frageAlle('TXT', HAUPT);
const rootMx = frageAlle('MX', HAUPT);
const rootSpfWerte = rootSpf.werte.filter((w) => w.startsWith('v=spf1'));

console.log(`\n── Hauptdomain ${HAUPT} ──`);
console.log(`   SPF: ${rootSpfWerte.join(' | ') || '(keiner)'}`);
console.log(`   MX : ${rootMx.werte.join(', ') || '(keine)'}`);

if (nurBasis) {
  writeFileSync(
    REFERENZ,
    JSON.stringify({ erstellt: new Date().toISOString(), rootSpf: rootSpfWerte, rootMx: rootMx.werte }, null, 2),
    'utf8'
  );
  console.log(`\nReferenz gesichert in ${REFERENZ}. Jetzt können die Subdomain-Einträge angelegt werden.`);
  process.exit(0);
}

// ── Vergleich mit der Referenz ───────────────────────────────────────
if (existsSync(REFERENZ)) {
  const ref = JSON.parse(readFileSync(REFERENZ, 'utf8'));
  const gleich = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
  merke(gleich(ref.rootSpf, rootSpfWerte), 'Root-SPF unverändert gegenüber der Referenz',
    gleich(ref.rootSpf, rootSpfWerte) ? '' : `vorher: ${ref.rootSpf.join(' | ')}\n    jetzt : ${rootSpfWerte.join(' | ')}`);
  merke(gleich(ref.rootMx, rootMx.werte), 'Root-MX unverändert (Postfach läuft weiter)',
    gleich(ref.rootMx, rootMx.werte) ? '' : `vorher: ${ref.rootMx.join(', ')}\n    jetzt : ${rootMx.werte.join(', ')}`);
} else {
  merke(false, `Keine Referenzdatei ${REFERENZ} – „unverändert" ist nicht belegbar.`);
}

merke(rootSpfWerte.length === 1, `Hauptdomain hat genau einen SPF-Eintrag (gefunden: ${rootSpfWerte.length})`);

// ── Subdomain ────────────────────────────────────────────────────────
console.log(`\n── Subdomain ${SUB} ──`);
const subTxt = frageAlle('TXT', SUB);
const subSpf = subTxt.werte.filter((w) => w.startsWith('v=spf1'));
const subMx = frageAlle('MX', SUB);
console.log(`   SPF: ${subSpf.join(' | ') || '(keiner)'}`);
console.log(`   MX : ${subMx.werte.join(', ') || '(keine)'}`);

merke(subSpf.length === 1, `Subdomain hat genau einen SPF-Eintrag (gefunden: ${subSpf.length})`,
  subSpf.length > 1 ? 'Zwei SPF-Einträge machen BEIDE ungültig – zusammenführen.' : '');
if (subSpf.length === 1) {
  const s = subSpf[0];
  merke(s.startsWith('v=spf1'), 'SPF beginnt korrekt mit v=spf1');
  merke(/\s[-~?+]all\s*$/.test(s), 'SPF endet mit einer all-Regel', s);
}
merke(subMx.werte.length > 0, 'MX auf der Subdomain vorhanden (Bounce-Verarbeitung)', subMx.werte.join(', '));

// ── DKIM ─────────────────────────────────────────────────────────────
console.log(`\n── DKIM ${DKIM} ──`);
const dkim = frageAlle('TXT', DKIM);
const dkimWert = dkim.werte.find((w) => w.includes('p=')) ?? '';
merke(dkimWert.length > 0, 'DKIM-Eintrag wird aufgelöst');
if (dkimWert) {
  const p = (dkimWert.match(/p=([A-Za-z0-9+/=]*)/) ?? [])[1] ?? '';
  console.log(`   Schlüssellänge: ${p.length} Zeichen`);
  merke(p.length >= 200, 'DKIM-Schlüssel wirkt vollständig (nicht abgeschnitten)',
    p.length < 200 ? 'Ein RSA-2048-Schlüssel hat rund 390 Zeichen. Zu kurz = beim Einfügen abgeschnitten.' : '');
  merke(!/\s/.test(p), 'DKIM-Schlüssel enthält keine Leerzeichen/Umbrüche');
}

// ── Verschachtelte Namen ─────────────────────────────────────────────
console.log('\n── Typische Tippfehler ──');
for (const falsch of [`${SUB}.${HAUPT}`, `resend._domainkey.${HAUPT}.${HAUPT}`]) {
  const t = frage('TXT', falsch, '8.8.8.8');
  merke(t.length === 0, `kein verschachtelter Name ${falsch}`,
    t.length ? 'Bei IONOS wurde vermutlich die volle Domain statt nur des Hostteils eingetragen.' : '');
}

// ── Verbreitung ──────────────────────────────────────────────────────
console.log('\n── Weltweite Verbreitung ──');
for (const [bez, eintrag] of [['Subdomain-SPF', subTxt], ['DKIM', dkim], ['Subdomain-MX', subMx]]) {
  merke(eintrag.einig, `${bez}: alle Resolver antworten gleich`,
    eintrag.einig ? '' : eintrag.je.map(([b, w]) => `${b}: ${w.length} Eintrag/Einträge`).join('  ·  '));
}

// ── Ergebnis ─────────────────────────────────────────────────────────
const fehler = befunde.filter((b) => !b.ok).length;
console.log('\n' + '='.repeat(72));
console.log(fehler === 0
  ? 'ALLE PRÜFUNGEN BESTANDEN – die Subdomain kann in Resend verifiziert werden.'
  : `${fehler} Prüfung(en) fehlgeschlagen – bitte zuerst beheben.`);
console.log('='.repeat(72));
process.exitCode = fehler === 0 ? 0 : 1;
