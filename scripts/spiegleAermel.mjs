/**
 * Ärmelfotos: Fehlt die Aufnahme der Gegenseite, wird die vorhandene gespiegelt.
 *
 * ── Warum ───────────────────────────────────────────────────────────────
 * Viele Lieferanten fotografieren nur EINEN Ärmel. Ohne Gegenseite blieb "Ärmel rechts" im Konfigurator
 * verborgen (die Ansicht erscheint nur, wenn JEDE wählbare Farbe ein Foto hat), obwohl Textilien seitensymmetrisch
 * sind: Das Foto des linken Ärmels, horizontal gespiegelt, ist die Ansicht des rechten – und umgekehrt.
 *
 * Festlegung (siehe scripts/aermelSeiten.mjs): `sleeve-left` zeigt die linke Seite des Trägers (Vorderseite im Bild
 * nach LINKS), `sleeve-right` die rechte (nach RECHTS). Eine Spiegelung vertauscht genau das, die Festlegung bleibt
 * erfüllt.
 *
 * ── Was "anlegen" tut ───────────────────────────────────────────────────
 * Für jede Farbvariante mit GENAU einem Ärmelfoto wird das andere erzeugt, als .webp UND .png (Server-Render-
 * Geschwister, siehe src/lib/assets/index.ts::rasterPfad), im selben Ordner wie das Original. Dieselbe Spiegelung
 * und Kodierung wie in aermelSeiten.mjs ("korrigieren"). Echte Aufnahmen werden NIE überschrieben.
 * Jede erzeugte Datei steht in scripts/assetSpiegelungen.json (Ziel → Quelle + Prüfsumme der Quelle), damit
 *  - eine gespiegelte Datei jederzeit als solche erkennbar ist (echte Aufnahme kann sie später ersetzen: dann
 *    den Eintrag löschen),
 *  - veraltete Spiegelungen auffallen, wenn die Quelle neu importiert oder korrigiert wurde ("pruefen" meldet sie,
 *    "anlegen" erzeugt sie neu).
 *
 * Danach IMMER (siehe scripts/import/ABLAUF.md):
 *   npx tsx scripts/generateAssetManifest.mts
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/generatePrintAreaData.mts
 *
 * Aufruf:
 *   node scripts/spiegleAermel.mjs pruefen   Probelauf; Exit 1, wenn etwas fehlt oder veraltet ist
 *   node scripts/spiegleAermel.mjs anlegen   legt Fehlendes an und erneuert Veraltetes (idempotent)
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const WURZEL = process.cwd();
const PUBLIC = path.join(WURZEL, 'public');
const LEDGER = path.join(WURZEL, 'scripts', 'assetSpiegelungen.json');
const MODUS = process.argv[2];
if (MODUS !== 'pruefen' && MODUS !== 'anlegen') {
  console.error('Aufruf: node scripts/spiegleAermel.mjs pruefen|anlegen');
  process.exit(2);
}

const text = fs.readFileSync(path.join(WURZEL, 'src/lib/assets/assetManifest.generated.ts'), 'utf8');
const manifest = JSON.parse(text.match(/export const ASSET_MANIFEST[^=]*=\s*(\{[\s\S]*\});\s*$/)[1]);
const ledger = fs.existsSync(LEDGER) ? JSON.parse(fs.readFileSync(LEDGER, 'utf8')) : {};

const absolut = (p) => path.join(PUBLIC, p);
const hash = (p) => crypto.createHash('sha1').update(fs.readFileSync(absolut(p))).digest('hex').slice(0, 16);
const rasterVon = (webp) => webp.replace(/\.webp$/, '.png');
const gegenseite = (p) => (p.includes('sleeve-left') ? p.replace('sleeve-left', 'sleeve-right') : p.replace('sleeve-right', 'sleeve-left'));

// ── Plan: Ziel → Quelle ────────────────────────────────────────────────
/** @type {Map<string, {quelle: string, grund: 'fehlt'|'veraltet', farben: string[]}>} */
const plan = new Map();
const proProdukt = new Map();
for (const [produkt, farben] of Object.entries(manifest)) {
  for (const [farbe, e] of Object.entries(farben)) {
    if (e.status !== 'real') continue;
    const l = e.views.sleeve_left;
    const r = e.views.sleeve_right;
    if (!!l === !!r) continue; // beide oder keins: nichts zu tun
    const quelle = l ?? r;
    const ziel = gegenseite(quelle);
    if (fs.existsSync(absolut(ziel))) continue; // Datei liegt schon da (Manifest nur noch nicht neu erzeugt)
    if (!plan.has(ziel)) plan.set(ziel, { quelle, grund: 'fehlt', farben: [] });
    plan.get(ziel).farben.push(`${produkt}/${farbe}`);
    proProdukt.set(produkt, (proProdukt.get(produkt) ?? 0) + 1);
  }
}
// Veraltete Spiegelungen: die Quelle hat sich seit dem Anlegen verändert (oder fehlt, dann nur melden).
const verwaist = [];
for (const [ziel, eintrag] of Object.entries(ledger)) {
  if (!fs.existsSync(absolut(eintrag.quelle))) { verwaist.push(ziel); continue; }
  if (hash(eintrag.quelle) !== eintrag.sha && !plan.has(ziel)) plan.set(ziel, { quelle: eintrag.quelle, grund: 'veraltet', farben: [] });
}

const fehlt = [...plan.values()].filter((p) => p.grund === 'fehlt').length;
const veraltet = [...plan.values()].filter((p) => p.grund === 'veraltet').length;
console.log(`Zu spiegeln: ${fehlt} fehlende Gegenseiten (${proProdukt.size} Produkte), ${veraltet} veraltete Spiegelungen.`);
if (verwaist.length) console.log(`Hinweis: ${verwaist.length} Ledger-Einträge ohne Quelldatei (Quelle gelöscht): ${verwaist.slice(0, 3).join(', ')} …`);

if (MODUS === 'pruefen') {
  for (const [produkt, n] of [...proProdukt.entries()].slice(0, 80)) console.log(`  ${String(n).padStart(3)} Farben  ${produkt}`);
  process.exit(plan.size > 0 ? 1 : 0);
}

// ── Anlegen ───────────────────────────────────────────────────────────
let neu = 0;
for (const [ziel, p] of plan) {
  const quellWebp = absolut(p.quelle);
  const quellPng = absolut(rasterVon(p.quelle));
  if (!fs.existsSync(quellWebp)) { console.warn(`Quelle fehlt, übersprungen: ${p.quelle}`); continue; }
  if (!fs.existsSync(quellPng)) { console.warn(`PNG-Geschwister der Quelle fehlt, übersprungen: ${rasterVon(p.quelle)}`); continue; }
  // Veraltete Spiegelung nur überschreiben, wenn sie wirklich eine unsere ist (steht im Ledger).
  if (fs.existsSync(absolut(ziel)) && !ledger[ziel]) { console.warn(`Echte Aufnahme, nicht überschrieben: ${ziel}`); continue; }
  const sha = hash(p.quelle);
  fs.writeFileSync(absolut(ziel), await sharp(quellWebp).flop().webp({ quality: 92, effort: 4 }).toBuffer());
  fs.writeFileSync(absolut(rasterVon(ziel)), await sharp(quellPng).flop().png({ compressionLevel: 9 }).toBuffer());
  ledger[ziel] = { quelle: p.quelle, sha };
  neu++;
}
const geordnet = Object.fromEntries(Object.entries(ledger).sort(([a], [b]) => a.localeCompare(b)));
fs.writeFileSync(LEDGER, JSON.stringify(geordnet, null, 1) + '\n');
console.log(`${neu} Gegenseiten angelegt (je .webp + .png). Ledger: ${Object.keys(geordnet).length} Einträge.`);
console.log('Weiter: npx tsx scripts/generateAssetManifest.mts, dann generatePrintAreaData.mts.');
