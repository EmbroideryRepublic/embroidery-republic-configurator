/**
 * Erzeugt src/config/farbdubletten.generated.ts: Farben, die im Shop nicht
 * angeboten werden, weil eine ANDERE Farbe desselben Produkts bytegleich
 * dasselbe Foto zeigt.
 *
 * Warum das vorkommt: Einige Katalogpaletten führen dieselbe Herstellerfarbe
 * zweimal – meist einmal benannt („Navy") und einmal nur als Hexwert
 * („101145"), weil die Lieferantendaten dort keinen Namen lieferten. Der Kunde
 * sähe zwei Farbfelder und dahinter dasselbe Kleidungsstück.
 *
 * Behalten wird die Farbe mit dem ECHTEN Namen; nur die namenlose bzw. später
 * kommende Dublette wird ausgeblendet. Die Produktdefinition bleibt unangetastet
 * (Bestellvalidierung und Lieferanten-Mapping brauchen die vollständige Palette).
 *
 * ACHTUNG: Zwei bytegleiche Bilder bei zwei WIRKLICH verschiedenen Farben sind
 * kein Dublettenfall, sondern ein Importfehler – dann ist eine der beiden Farben
 * falsch zugeordnet und gehört korrigiert, nicht ausgeblendet. Deshalb meldet
 * dieses Skript solche Fälle getrennt und trägt sie NICHT ein, wenn beide Farben
 * einen echten Namen tragen.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/generateFarbdubletten.mts
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { PRODUCTS } from '../src/config/products/index.ts';
import { ASSET_MANIFEST } from '../src/lib/assets/assetManifest.generated.ts';

/** Ein Name, der nur der Hexwert ist („101145", „B8B8B8"), ist kein Name. */
const namenlos = (name: string, hex: string) =>
  name.replace(/[^0-9a-f]/gi, '').toLowerCase() === hex.replace(/[^0-9a-f]/gi, '').toLowerCase();

const ausgeblendet: Record<string, string[]> = {};
const konflikte: string[] = [];

for (const p of PRODUCTS) {
  const nach = new Map<string, { id: string; name: string; hex: string }[]>();
  for (const c of p.colors) {
    const pfad = ASSET_MANIFEST[p.id]?.[c.id]?.views?.front;
    if (!pfad) continue;
    const f = join(process.cwd(), 'public', pfad.replace(/^\//, '').replace(/\.webp$/i, '.png'));
    if (!existsSync(f)) continue;
    const h = createHash('md5').update(readFileSync(f)).digest('hex');
    (nach.get(h) ?? nach.set(h, []).get(h)!).push({ id: c.id, name: c.name, hex: c.hex });
  }
  for (const gruppe of nach.values()) {
    if (gruppe.length < 2) continue;
    const echt = gruppe.filter((c) => !namenlos(c.name, c.hex));
    if (echt.length === gruppe.length) {
      konflikte.push(`${p.id}: ${gruppe.map((c) => c.id).join(' == ')}`);
      continue;
    }
    // Behalten: die erste Farbe mit echtem Namen, sonst die erste überhaupt.
    const behalten = echt[0] ?? gruppe[0]!;
    for (const c of gruppe) {
      if (c.id === behalten.id) continue;
      (ausgeblendet[p.id] ??= []).push(c.id);
    }
  }
}

const zeilen = Object.entries(ausgeblendet)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([id, farben]) => `  '${id}': [${farben.map((f) => `'${f}'`).join(', ')}],`)
  .join('\n');

writeFileSync(
  'src/config/farbdubletten.generated.ts',
  `/* GENERIERT von scripts/generateFarbdubletten.mts – nicht von Hand ändern. */
/**
 * Farben, die eine ANDERE Farbe desselben Produkts bytegleich wiederholen.
 *
 * Ursache sind doppelte Katalogeinträge: dieselbe Herstellerfarbe einmal
 * benannt und einmal nur als Hexwert geführt. Der Kunde bekäme zwei Farbfelder
 * mit demselben Foto dahinter. Ausgeblendet wird die namenlose Dublette; die
 * Produktdefinition bleibt vollständig.
 */
export const FARBDUBLETTEN: Record<string, readonly string[]> = {
${zeilen}
};

/**
 * Bytegleiche Bilder bei zwei BENANNTEN Farben – also keine Dublette, sondern
 * eine Fehlzuordnung: Eine der beiden Farben zeigt das Bild der anderen. Solche
 * Fälle werden NICHT ausgeblendet (das würde den Fehler verstecken), sondern
 * hier sichtbar gehalten, bis das richtige Bild beschafft ist.
 */
export const FARBGLEICHHEIT_OFFEN: readonly string[] = [
${konflikte.map((k) => `  '${k}',`).join('\n')}
];
`
);

const anzahl = Object.values(ausgeblendet).reduce((s, f) => s + f.length, 0);
console.log(`${anzahl} doppelte Farbeinträge in ${Object.keys(ausgeblendet).length} Produkten → src/config/farbdubletten.generated.ts`);
for (const [id, farben] of Object.entries(ausgeblendet)) console.log(`  ${id}: ${farben.join(', ')}`);
if (konflikte.length) {
  console.log(`\n${konflikte.length} FEHLZUORDNUNGEN – zwei benannte Farben mit demselben Bild. Nicht ausgeblendet, sondern zu korrigieren:`);
  for (const k of konflikte) console.log(`  ${k}`);
}
