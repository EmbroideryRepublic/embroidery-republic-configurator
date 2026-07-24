/**
 * Erzeugt das Recherche-Arbeitsblatt für die fehlenden Herstellermaße.
 *
 * Das Blatt ist zugleich das Gerüst des geforderten Abschlussberichts: eine
 * Zeile je Produkt, vorbefüllt mit allem, was im Projekt bereits belegt ist
 * (Marke, Artikelnummer, Schnitt, Brustbreite/Körperlänge aus dem sizeGuide)
 * und mit leeren Spalten für genau die Werte, die noch fehlen.
 *
 * Zusätzlich vermerkt jede Zeile, ob die Konturmessung für dieses Produkt
 * getragen hat – das entscheidet später, ob überhaupt eine Rückfallebene
 * gebraucht wird.
 *
 * Aufruf: npx tsx --tsconfig tsconfig.scripts.json scripts/buildResearchWorksheet.mts
 */
import { writeFileSync } from 'node:fs';

const { PRODUCTS } = await import('../src/config/products/index.ts');

/** Produkte, bei denen die Achsel NICHT aus der Kontur erkennbar war
 *  (Messlauf 2026-07-20, scripts/measureContourFactor.mts). Für diese gibt
 *  es keine validierte Bildgrundlage – hier sind Herstellermaße die einzige
 *  Quelle, ein Ausweichen auf den Faktor ist ausgeschlossen. */
const OHNE_KONTUR = new Set([
  'fotl-original-longsleeve',
  'fotl-iconic195-longsleeve',
  'fotl-baseball-longsleeve',
  'sols-north-fleece',
  'gildan-ladies-vneck-t',
  'gildan-zip-hoodie',
  'justhoods-college-hoodie',
  'justhoods-zoodie',
  'justhoods-awdis-sweat',
  'justhoods-contrast-hoodie',
  'justhoods-quarterzip-sweat',
  'bandc-inspire-hoodie',
  'bandc-inspire-zip-hood',
  'jn-halfzip-sweat',
  'fotl-ladies-valueweight-vneck',
]);

function artikelnummer(p: Record<string, unknown>): string {
  // Je nach Marke unterschiedlich abgelegt – alles Bekannte durchprobieren,
  // nichts erfinden.
  const kandidaten = ['manufacturerSku', 'sku', 'articleNumber', 'artikelnummer'];
  for (const k of kandidaten) {
    const v = p[k];
    if (typeof v === 'string' && v.trim()) return v;
  }
  const dd = p.detailedDescription as Record<string, unknown> | undefined;
  if (dd) {
    for (const k of kandidaten) {
      const v = dd[k];
      if (typeof v === 'string' && v.trim()) return v;
    }
  }
  return '';
}

const zeilen: string[] = [];
const proMarke = new Map<string, number>();

for (const p of PRODUCTS) {
  const marke = String(p.brand);
  proMarke.set(marke, (proMarke.get(marke) ?? 0) + 1);
}

for (const marke of [...proMarke.keys()].sort()) {
  const produkte = PRODUCTS.filter((p) => String(p.brand) === marke);
  zeilen.push(`\n### ${marke} (${produkte.length} Produkte)\n`);
  zeilen.push('Quelle (Datenblatt/Größentabelle): _noch einzutragen_\n');
  zeilen.push(
    '| Produkt-ID | Art.-Nr. | Schnitt | Brust M | Länge M | Ärmellänge | Schulterbreite | Oberarm | Kontur | Quelle |'
  );
  zeilen.push('|---|---|---|---|---|---|---|---|---|---|');

  for (const p of produkte) {
    const m =
      p.sizeGuide?.measurements?.find((x) => x.size === 'M') ?? p.sizeGuide?.measurements?.[0];
    const kontur = OHNE_KONTUR.has(p.id) ? '**nein**' : 'ja';
    zeilen.push(
      `| \`${p.id}\` | ${artikelnummer(p as never) || '—'} | ${p.productType} | ${m?.breiteCm ?? '?'} | ${m?.hoeheCm ?? '?'} | | | | ${kontur} | |`
    );
  }
}

const kopf = `# Recherche: fehlende Herstellermaße für das hybride Flächenmodell

> **Status: offen.** Dieses Blatt wird während der Recherche gefüllt und ist
> anschließend der Abschlussbericht. Solange Spalten leer sind, bleibt
> \`printAreas.ts\` unverändert.

## Regeln für das Ausfüllen

1. **Nur offizielle Quellen** – Herstellerdatenblatt, offizielle Größentabelle,
   technische Maßskizze. Händlerangaben sind keine Quelle.
2. **Technische Zeichnungen haben Vorrang** vor einfachen Größentabellen, weil
   sie Schulter- und Ärmelmaße eindeutig definieren.
3. **Nicht veröffentlichte Maße bleiben leer** und werden als \`n.v.\`
   eingetragen. Keine Schätzung, kein Durchschnitt, keine Übertragung aus einer
   anderen Marke.
4. **Quelle je Zeile** eintragen (URL + Abrufdatum), nicht nur je Marke, falls
   sie sich unterscheiden.

## Was bereits belegt ist

Brustbreite und Körperlänge je Größe liegen für alle 43 Produkte im
\`sizeGuide\` und stammen aus Herstellertabellen. Sie sind hier nur zur
Kontrolle in Größe M abgedruckt und **nicht** Gegenstand der Recherche.

## Spalte „Kontur"

\`ja\` = die Achsel war in der Bildkontur erkennbar, es gibt eine zweite,
unabhängige Messung (28 Produkte). \`nein\` = Ärmel liegen am Körper an, die
Kontur liefert keine Trennung von Rumpf und Ärmel (15 Produkte). Für diese
Produkte sind die Herstellermaße die **einzige** Grundlage – fehlen sie, ist
das Produkt gesondert zu behandeln und ausdrücklich zu kennzeichnen.

## Offene Grundsatzfrage

Falls die Oberarm-/Bizepsweite bei einer Marke nicht veröffentlicht ist,
betrifft das die Ärmelfläche. Für Produkte mit \`Kontur: ja\` existiert eine
Rückfallebene über die Bildmessung. Für Produkte mit \`Kontur: nein\` existiert
**keine** – hier ist eine bewusste Entscheidung nötig, keine Ersatzannahme.
`;

const inhalt = `${kopf}\n## Erfassung je Marke\n${zeilen.join('\n')}\n`;
writeFileSync('docs/recherche-herstellermasse.md', inhalt, 'utf8');

console.log('docs/recherche-herstellermasse.md geschrieben');
console.log(`Produkte gesamt : ${PRODUCTS.length}`);
console.log(`Marken          : ${proMarke.size}`);
console.log(`ohne Kontur     : ${PRODUCTS.filter((p) => OHNE_KONTUR.has(p.id)).length}`);
for (const [marke, n] of [...proMarke.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${marke.padEnd(20)} ${n}`);
}
