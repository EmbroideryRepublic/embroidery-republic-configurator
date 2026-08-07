/**
 * Prüft die Einkaufspreis-Datengrundlage.
 *
 * Beantwortet vier Fragen:
 *   1. Wie verteilen sich die Preise auf die drei Qualitätsstufen?
 *   2. Welche Produkte taugen bereits zur Verkaufskalkulation?
 *   3. Rechnet der Shop irgendwo mit einem ANDEREN Wert als dem bekannten?
 *      (der gefährlichste Fall – die Kalkulation stützt sich dann auf eine
 *      Zahl, die wir selbst für überholt halten)
 *   4. Fehlt zu einem Produkt der Nachweis ganz?
 *
 * Aufruf: npm run ek:pruefen  ·  mit --csv <datei> zusätzlich als Vorlage
 */
import { writeFileSync } from 'node:fs';
import { PRODUCTS } from '@/config/products/index';
import {
  einkaufspreisNachweis,
  istEinkaufspreisUngeprueft,
  taugtZurKalkulation,
  weichtVomKatalogAb,
  type EinkaufspreisNachweis,
  type EinkaufspreisStufe,
} from '@/config/pricing/einkaufspreise';
import { formatiereGeld } from '@/lib/format';

interface Zeile {
  id: string;
  name: string;
  marke: string;
  katalogpreis: number;
  nachweis?: EinkaufspreisNachweis;
  abweichungCent: number;
}

const zeilen: Zeile[] = PRODUCTS.map((p) => {
  const nachweis = einkaufspreisNachweis(p.id);
  return {
    id: p.id,
    name: p.name,
    marke: p.brand,
    katalogpreis: p.purchasePrice,
    nachweis,
    abweichungCent: nachweis ? Math.round((nachweis.preis - p.purchasePrice) * 100) : 0,
  };
}).sort((a, b) => a.marke.localeCompare(b.marke) || a.name.localeCompare(b.name));

const jeStufe = (s: EinkaufspreisStufe) => zeilen.filter((z) => z.nachweis?.stufe === s);
const verifiziert = jeStufe('verifiziert');
const bekannt = jeStufe('bekannt');
const platzhalter = jeStufe('platzhalter');
const ohneNachweis = zeilen.filter((z) => !z.nachweis);
const abweichungen = zeilen.filter((z) => weichtVomKatalogAb(z.id));
const kalkulierbar = zeilen.filter((z) => taugtZurKalkulation(z.id)).length;

const L = '='.repeat(94);
console.log(`\n${L}\nEINKAUFSPREISE – DATENGRUNDLAGE (${zeilen.length} Produkte)\n${L}`);

const balken = (n: number) => '█'.repeat(Math.round((n / zeilen.length) * 40));
console.log(
  `\n  verifiziert  ${String(verifiziert.length).padStart(3)}  ${balken(verifiziert.length)}` +
    `\n     belastbar, taugt zur Kalkulation` +
    `\n\n  bekannt      ${String(bekannt.length).padStart(3)}  ${balken(bekannt.length)}` +
    `\n     aus der Praxis, Aktualität noch zu prüfen` +
    `\n\n  platzhalter  ${String(platzhalter.length).padStart(3)}  ${balken(platzhalter.length)}` +
    `\n     NICHT als Kalkulationsgrundlage verwendbar`
);
if (ohneNachweis.length > 0) {
  console.log(`\n  ohne Nachweis ${String(ohneNachweis.length).padStart(2)}  – zählt wie „platzhalter"`);
}
console.log(
  `\n  → kalkulierbar: ${kalkulierbar} von ${zeilen.length} ` +
    `(${Math.round((kalkulierbar / zeilen.length) * 100)} %)`
);

// ── Der wichtigste Befund: Rechnet der Shop mit dem falschen Wert? ──────
if (abweichungen.length > 0) {
  console.log(`\n${'─'.repeat(94)}`);
  console.log('⚠  SHOP RECHNET MIT ANDEREM WERT ALS BEKANNT');
  console.log('─'.repeat(94));
  for (const z of abweichungen) {
    const n = z.nachweis!;
    const richtung = z.abweichungCent > 0 ? 'zu NIEDRIG' : 'zu HOCH';
    console.log(
      `\n  ${z.marke} · ${z.name}` +
        `\n     Stufe ${n.stufe}:${' '.repeat(Math.max(1, 14 - n.stufe.length))}${formatiereGeld(n.preis)}` +
        `\n     Shop rechnet mit:   ${formatiereGeld(z.katalogpreis)}   ← ${richtung}` +
        `\n     Differenz:          ${formatiereGeld(Math.abs(z.abweichungCent) / 100)}`
    );
    if (n.quelle) console.log(`     Quelle:              ${n.quelle}`);
  }
  console.log(
    `\n  Der Verkaufspreis folgt über computeBasePrice() unmittelbar aus dem` +
      `\n  Einkaufspreis. Solange die Werte auseinanderlaufen, kalkuliert der Shop` +
      `\n  auf einer Zahl, die wir selbst für überholt halten.`
  );
}

// ── Was noch zu beschaffen ist ─────────────────────────────────────────
console.log(`\n${'─'.repeat(94)}`);
console.log('NOCH ZU PRÜFEN – nach Bezugsquelle (erleichtert die Abfrage im Portal)');
console.log('─'.repeat(94));

const offen = zeilen.filter((z) => istEinkaufspreisUngeprueft(z.id));
const jeLieferant = new Map<string, Zeile[]>();
for (const z of offen) {
  const lieferant = z.nachweis?.lieferant ?? 'ohne Bezugsquelle';
  jeLieferant.set(lieferant, [...(jeLieferant.get(lieferant) ?? []), z]);
}

for (const [lieferant, liste] of [...jeLieferant].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`\n  ${lieferant} (${liste.length})`);
  for (const z of liste) {
    const kennzeichen = z.nachweis?.stufe === 'bekannt' ? '~' : '?';
    const art = z.nachweis?.artikelnummer ? ` [${z.nachweis.artikelnummer}]` : '';
    console.log(
      `   ${kennzeichen} ${z.marke.padEnd(18).slice(0, 18)} ${z.name.padEnd(36).slice(0, 36)} ` +
        `${formatiereGeld(z.nachweis?.preis ?? z.katalogpreis).padStart(9)}${art}`
    );
  }
}
console.log('\n   ~ bekannt (Aktualität prüfen)   ? Platzhalter');

console.log(`\n${L}`);
if (kalkulierbar === zeilen.length && abweichungen.length === 0) {
  console.log('✔ Alle Einkaufspreise taugen zur Kalkulation.');
} else {
  console.log(
    `${zeilen.length - kalkulierbar} von ${zeilen.length} Produkten haben KEINEN kalkulationsfähigen Einkaufspreis.`
  );
  console.log('Endgültige Verkaufspreise erst nach Abschluss der Erhebung festlegen.');
}
console.log(L);

// ── Erfassungsvorlage ───────────────────────────────────────────────────
const csvIndex = process.argv.indexOf('--csv');
if (csvIndex !== -1) {
  const ziel = process.argv[csvIndex + 1] ?? 'ek-preise-erfassung.csv';
  const kopf =
    'produkt_id;marke;name;stufe;preis_bekannt;preis_im_shop;lieferant;artikelnummer;EK_ECHT;QUELLE;STAND;STAFFEL';
  const inhalt = [
    kopf,
    ...zeilen.map((z) =>
      [
        z.id,
        z.marke,
        z.name,
        z.nachweis?.stufe ?? 'ohne Nachweis',
        (z.nachweis?.preis ?? z.katalogpreis).toFixed(2).replace('.', ','),
        z.katalogpreis.toFixed(2).replace('.', ','),
        z.nachweis?.lieferant ?? '',
        z.nachweis?.artikelnummer ?? '',
        '',
        '',
        '',
        '',
      ].join(';')
    ),
  ].join('\n');
  writeFileSync(ziel, '﻿' + inhalt, 'utf8');
  console.log(`\nErfassungsvorlage: ${ziel}`);
  console.log('  Auszufüllen: EK_ECHT · QUELLE · STAND · STAFFEL');
}

// Absichtlich KEIN Fehler-Exitcode: Eine unvollständige Datengrundlage ist
// ein bekannter Zustand, kein Fehler der Auslieferung. Das Skript berichtet.
