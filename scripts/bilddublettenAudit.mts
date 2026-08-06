/**
 * Bilddubletten-Audit: findet produktuebergreifend (fast) identische Vorderansichten.
 *
 * Hintergrund (ADR 0006): Beim Import kann versehentlich die Bildstrecke eines
 * ANDEREN Artikels landen – typischerweise die Damen-/Herren-Schwester oder ein
 * benachbartes Modell derselben Marke. Ein Byte-Hash-Vergleich reicht dafuer nicht:
 * stammen die Bilder aus zwei verschiedenen Quellen (andere Aufloesung/Kompression),
 * sind sie NICHT byte-identisch, zeigen aber dasselbe Kleidungsstueck. Belegter Fall:
 * B&C ID.501 – dem Herren-Eintrag waren die Damen-Bilder (FWI51) zugeordnet.
 *
 * Deshalb wird perzeptuell verglichen: jede Vorderansicht wird auf 16x16 Graustufen
 * reduziert; die mittlere absolute Abweichung (MAD) zweier Signaturen misst, wie
 * aehnlich die Aufnahmen sind.
 *   MAD < 1   → praktisch dieselbe Aufnahme  → verdaechtig, pruefen
 *   MAD 1..3  → aehnliche Studioaufnahme (gleiche Marke/Fotostrecke) → i.d.R. normal
 *
 * Treffer sind nicht automatisch Fehler: dasselbe Herstellerprodukt kann bewusst unter
 * zwei Katalog-IDs gefuehrt werden. Jeder Treffer gehoert aber geprueft und – wenn
 * legitim – in scripts/import/dubletten-ok.json eingetragen, damit das Audit sauber
 * durchlaeuft.
 *
 * Aufruf: npx tsx scripts/bilddublettenAudit.mts
 * Exit 1, wenn ein nicht freigegebener Verdacht existiert.
 */
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import sharp from 'sharp';
import { PRODUCTS } from '../src/config/products/index.ts';

/** Ab dieser Aehnlichkeit gilt eine Aufnahme als "praktisch dieselbe". */
const SCHWELLE = 1.0;

let freigegeben: Record<string, string> = {};
try {
  freigegeben = JSON.parse(readFileSync('scripts/import/dubletten-ok.json', 'utf-8'));
} catch {
  /* keine Freigabeliste – dann ist jeder Treffer ein Befund */
}

const ids = PRODUCTS.map((p) => p.id).sort((a, b) => b.length - a.length);
/** Ordnername (produktId oder produktId-farbId) → produktId. Laengste ID zuerst. */
const zuProdukt = (ordner: string) => ids.find((id) => ordner === id || ordner.startsWith(`${id}-`)) ?? '?';

const signatur = (datei: string) => sharp(datei).resize(16, 16, { fit: 'fill' }).greyscale().raw().toBuffer();

const eintraege: { ordner: string; produkt: string; sig: Buffer }[] = [];
for (const ordner of readdirSync('public/products')) {
  const datei = `public/products/${ordner}/front.png`;
  if (!existsSync(datei)) continue;
  eintraege.push({ ordner, produkt: zuProdukt(ordner), sig: await signatur(datei) });
}

const mad = (a: Buffer, b: Buffer) => {
  let summe = 0;
  for (let i = 0; i < a.length; i++) summe += Math.abs(a[i] - b[i]);
  return summe / a.length;
};

const paare = new Map<string, { farben: number; minMad: number; beispiel: string }>();
for (let i = 0; i < eintraege.length; i++) {
  for (let j = i + 1; j < eintraege.length; j++) {
    const a = eintraege[i];
    const b = eintraege[j];
    if (a.produkt === b.produkt) continue;
    const d = mad(a.sig, b.sig);
    if (d >= SCHWELLE) continue;
    const schluessel = [a.produkt, b.produkt].sort().join(' || ');
    const vorhanden = paare.get(schluessel);
    if (!vorhanden) paare.set(schluessel, { farben: 1, minMad: d, beispiel: `${a.ordner} ~ ${b.ordner}` });
    else {
      vorhanden.farben++;
      if (d < vorhanden.minMad) { vorhanden.minMad = d; vorhanden.beispiel = `${a.ordner} ~ ${b.ordner}`; }
    }
  }
}

const offen = [...paare.entries()].filter(([k]) => !freigegeben[k]).sort((a, b) => b[1].farben - a[1].farben);
console.log(`${eintraege.length} Vorderansichten aus ${new Set(eintraege.map((e) => e.produkt)).size} Produkten geprueft.`);
console.log(`${paare.size} Produktpaare mit praktisch gleicher Aufnahme (MAD < ${SCHWELLE}), davon ${paare.size - offen.length} freigegeben.\n`);

for (const [schluessel, t] of offen) {
  console.log(`VERDACHT  ${t.farben} Farbpaare · MAD ${t.minMad.toFixed(2)}\n   ${schluessel}\n   z.B. ${t.beispiel}`);
}

if (offen.length) {
  console.log(`\n${offen.length} ungeklaerte Dubletten. Je Fall pruefen, ob beide Katalogeintraege wirklich dasselbe`);
  console.log('Herstellerprodukt sind. Wenn ja: Schluessel in scripts/import/dubletten-ok.json mit Begruendung eintragen.');
  process.exit(1);
}
console.log('Keine ungeklaerten Bilddubletten.');
