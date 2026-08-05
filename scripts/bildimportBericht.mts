/**
 * Erzeugt den transparenten Abschlussbericht des Bildimports (ADR 0006).
 *
 * Liest das Asset-Manifest (Wahrheit über echte Bilder je Farbe/Ansicht) und das
 * Quellen-Ledger (scripts/import/quellen.json: productId → verwendete Quelle) und
 * schreibt docs/bildimport-abschlussbericht.md: je Produkt Quelle, Anzahl echter
 * Farben, welche Ansichten importiert wurden und bei welchen Farben keine echte
 * Rückansicht existiert (Front-Alias / Fallback). Plus Gesamtübersicht + noch
 * offene Produkte.
 *
 * Aufruf: npx tsx scripts/bildimportBericht.mts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { ASSET_MANIFEST as M } from '../src/lib/assets/assetManifest.generated.ts';
import { PRODUCTS } from '../src/config/products/index.ts';
import { PLATZHALTER_BILD } from '../src/lib/assets/index.ts';

const quellen: Record<string, { quelle: string; hinweis?: string }> =
  JSON.parse(readFileSync('scripts/import/quellen.json', 'utf-8'));

/** Ist eine Ansicht ein echtes eigenes Bild (kein Platzhalter, kein Front-Alias)? */
const istEigen = (pfad: string, front: string | undefined, view: string) =>
  pfad !== PLATZHALTER_BILD && (view === 'front' || pfad !== front);

let realProd = 0, realFarben = 0, mitBack = 0, ohneBack = 0;
const zeilen: string[] = [];
const offen: Record<string, string[]> = {};

for (const p of PRODUCTS) {
  const m = M[p.id]; if (!m) continue;
  const realCids = Object.entries(m).filter(([, e]) => e.status === 'real').map(([cid]) => cid);
  if (!realCids.length) { (offen[p.brand] ??= []).push(p.id); continue; }
  realProd++;
  realFarben += realCids.length;
  let backHier = 0, keinBackFarben: string[] = [];
  const ansichtenGesamt = new Set<string>();
  for (const cid of realCids) {
    const views = m[cid].views; const front = views.front;
    const eigene = Object.entries(views).filter(([v, pfad]) => istEigen(pfad, front, v)).map(([v]) => v);
    eigene.forEach((v) => ansichtenGesamt.add(v));
    if (eigene.includes('back')) { backHier++; mitBack++; } else { ohneBack++; keinBackFarben.push(cid); }
  }
  const q = quellen[p.id]?.quelle ?? '—';
  const backTxt = keinBackFarben.length ? ` · ohne echte Rückansicht: ${keinBackFarben.length} (${keinBackFarben.join(', ')})` : '';
  zeilen.push(`| ${p.id} | ${p.brand} | ${q} | ${realCids.length} | ${[...ansichtenGesamt].sort().join('+')} | ${backHier}${backTxt} |`);
}

const offenGesamt = Object.values(offen).reduce((n, a) => n + a.length, 0);
const kopf = `# Bildimport – Abschlussbericht

_Auto-generiert von scripts/bildimportBericht.mts. Quelle: Asset-Manifest + scripts/import/quellen.json._

## Übersicht
- Produkte mit echten Bildern: **${realProd} / ${PRODUCTS.length}**
- Echte Farb-Bildsätze: **${realFarben}**
- Farben mit echter Rückansicht: **${mitBack}** · nur Vorderansicht (noch keine echte Rückansicht gefunden): **${ohneBack}**
- Noch offen (nur Platzhalter): **${offenGesamt}** Produkte

## Bebilderte Produkte
| Produkt | Marke | Quelle | echte Farben | Ansichten | Farben mit Rückansicht |
|---|---|---|---|---|---|
${zeilen.join('\n')}

## Noch offen (Recherche/Import ausstehend)
${Object.entries(offen).sort((a, b) => b[1].length - a[1].length).map(([b, a]) => `- **${b}** (${a.length}): ${a.join(', ')}`).join('\n')}
`;

writeFileSync('docs/bildimport-abschlussbericht.md', kopf, 'utf-8');
console.log(`Bericht: ${realProd} Produkte bebildert, ${realFarben} Farben, ${offenGesamt} offen → docs/bildimport-abschlussbericht.md`);
