/**
 * Ärmelfotos: Zeigt das Foto unter "sleeve-left" wirklich die LINKE Seite des Trägers?
 *
 * ── Warum es das gibt (Fund vom 2026-11-10) ─────────────────────────────
 * Im Admin stand "Ärmel links" über einem Foto, das den RECHTEN Ärmel zeigt. Ursache: Der Bildimport legt das
 * Seitenfoto des Lieferanten unter `sleeve-left` ab, ohne zu prüfen, welche Seite es zeigt. Jeder Lieferant hält das
 * anders (bei Spreadshirt/JustHoods z. B. ist "links" die Sicht von links auf das Teil, die Vorderseite zeigt dann nach
 * rechts). Ergebnis: Bei rund zwei Dritteln der Farbvarianten stand Bezeichnung und Foto im Widerspruch – der Kunde
 * sah im Konfigurator denselben Widerspruch.
 *
 * Festlegung: `sleeve-left` zeigt IMMER die linke Seite des Trägers (Vorderseite im Bild nach LINKS), `sleeve-right`
 * die rechte (Vorderseite nach RECHTS).
 *
 * ── Wie die Seite erkannt wird (zwei unabhängige Verfahren) ─────────────
 *  1. Kopfprofil: In der Seitenansicht liegt der höchste Punkt der Silhouette (Kapuze, Nacken) HINTEN; zur Vorderseite
 *     fällt der Umriss ab. Liegt der hohe Teil links im Bild, zeigt die Vorderseite nach rechts (= rechte Trägerseite).
 *  2. Umrissvergleich innerhalb eines Produkts: Jede Farbe wird mit dem Umriss der anderen Farben normal und gespiegelt
 *     verglichen – so fällt eine einzelne gespiegelt fotografierte Farbe auf.
 * Eine Farbe weicht von der Mehrheit ihres Produkts nur ab, wenn BEIDE Verfahren es so sehen. Produkte mit schwachem
 * Signal (|Mittel| < 8, fast symmetrische Teile) werden NICHT angefasst, sondern nur aufgelistet – lieber unverändert
 * als geraten.
 * Gegengeprüft (Sichtprüfung): 8 Hoodies (Kapuzenband) und 16 Damenmodelle (Brustwölbung) – 24 von 24 richtig; bei
 * Paaren zeigt das rechte Foto in 298 von 299 Fällen die erwartete Gegenseite.
 *
 * ── Was "korrigieren" tut (in Ort und Stelle, .webp UND .png) ───────────
 *  - links zeigt rechts, rechtes Foto zeigt links  → beide Dateien tauschen (keine Neukodierung, keine neuen Blobs)
 *  - links zeigt rechts, KEIN rechtes Foto         → linkes Foto horizontal spiegeln
 *  Alle anderen Auffälligkeiten (z. B. beide Fotos zeigen dieselbe Seite) werden nur gemeldet.
 *  Danach: `npx tsx --tsconfig tsconfig.scripts.json scripts/generatePrintAreaData.mts` – die Druckflächen werden aus
 *  den Fotos vermessen und müssen zur neuen Lage passen.
 *
 * Aufruf:
 *   node scripts/aermelSeiten.mjs pruefen        Probelauf, ändert nichts; Exit-Code 1, wenn etwas zu korrigieren ist
 *   node scripts/aermelSeiten.mjs korrigieren    wendet die Korrektur an (idempotent: danach gibt es nichts mehr zu tun)
 * Nach jedem Bildimport mit Ärmelfotos `pruefen` ausführen.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const WURZEL = process.cwd();
const PUBLIC = path.join(WURZEL, 'public');
const MODUS = process.argv[2];
if (MODUS !== 'pruefen' && MODUS !== 'korrigieren') {
  console.error('Aufruf: node scripts/aermelSeiten.mjs pruefen|korrigieren');
  process.exit(2);
}

const MIN_SIGNAL = 8; // |mittlerer Höhenunterschied| in Pixeln (Raster 120×140); darunter: nicht sicher bestimmbar
const text = fs.readFileSync(path.join(WURZEL, 'src/lib/assets/assetManifest.generated.ts'), 'utf8');
const manifest = JSON.parse(text.match(/export const ASSET_MANIFEST[^=]*=\s*(\{[\s\S]*\});\s*$/)[1]);

// ── Verfahren 1: Kopfprofil ────────────────────────────────────────────
const B = 120, H = 140;
async function kopfMaske(pfad) {
  const { data } = await sharp(path.join(PUBLIC, pfad))
    .resize(B, H, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const m = new Uint8Array(B * H);
  for (let i = 0; i < B * H; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2], a = data[i * 4 + 3];
    m[i] = a > 128 && !(r > 245 && g > 245 && b > 245) ? 1 : 0;
  }
  return m;
}
function kopfUrteil(m) {
  let xmin = B, xmax = -1;
  const top = new Array(B).fill(null);
  for (let x = 0; x < B; x++) for (let y = 0; y < H; y++) if (m[y * B + x]) { top[x] = y; xmin = Math.min(xmin, x); xmax = Math.max(xmax, x); break; }
  if (xmax < 0) return { s: '?', w: 0 };
  const w = xmax - xmin + 1;
  const mittel = (von, bis) => { let s = 0, n = 0; for (let x = von; x <= bis; x++) if (top[x] !== null) { s += top[x]; n++; } return n ? s / n : null; };
  const links = mittel(xmin, xmin + Math.floor(w * 0.35));
  const rechts = mittel(xmax - Math.floor(w * 0.35), xmax);
  if (links === null || rechts === null) return { s: '?', w: 0 };
  const wert = rechts - links; // > 0: linke Bildseite liegt höher → hinten links → Vorderseite rechts → rechte Trägerseite
  return { s: wert > 2 ? 'rechts' : wert < -2 ? 'links' : '?', w: wert };
}

// ── Verfahren 2: Umrissvergleich ───────────────────────────────────────
const NB = 64, NH = 96;
async function umrissMaske(pfad) {
  const GB = 240, GH = 280;
  const { data } = await sharp(path.join(PUBLIC, pfad))
    .resize(GB, GH, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const da = (x, y) => { const i = (y * GB + x) * 4; return data[i + 3] > 128 && !(data[i] > 245 && data[i + 1] > 245 && data[i + 2] > 245); };
  let x0 = GB, x1 = -1, y0 = GH, y1 = -1;
  for (let y = 0; y < GH; y++) for (let x = 0; x < GB; x++) if (da(x, y)) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const m = new Uint8Array(NB * NH);
  if (x1 < 0) return m;
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
  for (let y = 0; y < NH; y++) for (let x = 0; x < NB; x++) m[y * NB + x] = da(x0 + Math.floor((x + 0.5) * bw / NB), y0 + Math.floor((y + 0.5) * bh / NH)) ? 1 : 0;
  return m;
}
const spiegeln = (m) => { const r = new Uint8Array(m.length); for (let y = 0; y < NH; y++) for (let x = 0; x < NB; x++) r[y * NB + x] = m[y * NB + (NB - 1 - x)]; return r; };
const iou = (a, b) => { let i = 0, u = 0; for (let k = 0; k < a.length; k++) { if (a[k] && b[k]) i++; if (a[k] || b[k]) u++; } return u ? i / u : 0; };

// ── Auswertung ─────────────────────────────────────────────────────────
const plan = []; // { id, farbe, aktion }
const nurMelden = [];
const nichtBestimmbar = [];
let geprueft = 0, richtig = 0;

for (const [id, farben] of Object.entries(manifest)) {
  const eintraege = Object.entries(farben).filter(([, f]) => f.views.sleeve_left);
  if (!eintraege.length) continue;

  const daten = {};
  for (const [farbe, f] of eintraege) {
    const l = kopfUrteil(await kopfMaske(f.views.sleeve_left));
    const r = f.views.sleeve_right ? kopfUrteil(await kopfMaske(f.views.sleeve_right)) : null;
    daten[farbe] = { l, r, maske: await umrissMaske(f.views.sleeve_left), lPfad: f.views.sleeve_left, rPfad: f.views.sleeve_right ?? null };
  }
  const namen = Object.keys(daten);
  const stimmen = { rechts: 0, links: 0 };
  let summe = 0;
  for (const n of namen) { if (daten[n].l.s !== '?') stimmen[daten[n].l.s]++; summe += daten[n].l.w; }
  const mittel = summe / namen.length;
  const mehrheit = stimmen.rechts === 0 && stimmen.links === 0 ? '?' : stimmen.rechts >= stimmen.links ? 'rechts' : 'links';
  geprueft += namen.length;
  if (mehrheit === '?' || Math.abs(mittel) < MIN_SIGNAL) {
    nichtBestimmbar.push(`${id} (Signal ${mittel.toFixed(1)}, ${namen.length} Farben)`);
    continue;
  }

  // Umriss: Referenzfarbe = die mit der größten mittleren Ähnlichkeit zu allen anderen (in beliebiger Lage)
  let refName = namen[0], besser = -1;
  for (const a of namen) {
    let s = 0;
    for (const b of namen) if (b !== a) s += Math.max(iou(daten[a].maske, daten[b].maske), iou(daten[a].maske, spiegeln(daten[b].maske)));
    if (s > besser) { besser = s; refName = a; }
  }
  const ref = daten[refName].maske;
  const gleichLage = (n) => iou(daten[n].maske, ref) >= iou(spiegeln(daten[n].maske), ref);
  const refStimmen = { rechts: 0, links: 0 };
  for (const n of namen) if (gleichLage(n) && daten[n].l.s !== '?') refStimmen[daten[n].l.s]++;
  const refLage = refStimmen.rechts >= refStimmen.links ? 'rechts' : 'links';
  const andereLage = refLage === 'rechts' ? 'links' : 'rechts';

  for (const n of namen) {
    const d = daten[n];
    const umriss = gleichLage(n) ? refLage : andereLage;
    // Abweichung von der Produktmehrheit nur, wenn BEIDE Verfahren sie sehen
    const seite = d.l.s !== '?' && d.l.s !== mehrheit && umriss !== mehrheit ? d.l.s : mehrheit;
    if (seite === 'links') {
      richtig++;
      if (d.r && d.r.s === 'links') nurMelden.push(`${id}/${n}: beide Fotos zeigen die LINKE Seite (rechtes Foto ist keine Gegenseite)`);
      continue;
    }
    if (!d.rPfad) plan.push({ id, farbe: n, aktion: 'spiegeln', lPfad: d.lPfad });
    else if (d.r.s === 'links') plan.push({ id, farbe: n, aktion: 'tauschen', lPfad: d.lPfad, rPfad: d.rPfad });
    else nurMelden.push(`${id}/${n}: linkes Foto zeigt rechts, rechtes Foto ist ${d.r.s === '?' ? 'nicht bestimmbar' : 'ebenfalls rechts'} – nicht automatisch korrigiert`);
  }
}

const proAktion = (a) => plan.filter((p) => p.aktion === a).length;
console.log(`Geprüfte Farbvarianten: ${geprueft} | bereits richtig (links zeigt links): ${richtig}`);
console.log(`Zu korrigieren: ${plan.length}  (tauschen: ${proAktion('tauschen')}, spiegeln: ${proAktion('spiegeln')})`);
console.log(`Nur gemeldet (nicht automatisch): ${nurMelden.length}`);
for (const m of nurMelden.slice(0, 40)) console.log('  ' + m);
console.log(`Produkte mit zu schwachem Signal, bewusst NICHT angefasst: ${nichtBestimmbar.length}`);
for (const m of nichtBestimmbar) console.log('  ' + m);

if (MODUS === 'pruefen') process.exit(plan.length ? 1 : 0);

// ── Anwenden ──────────────────────────────────────────────────────────
const rasterVon = (webp) => webp.replace(/\.webp$/, '.png');
const lesen = (p) => fs.readFileSync(path.join(PUBLIC, p));
const schreiben = (p, buf) => fs.writeFileSync(path.join(PUBLIC, p), buf);
let fertig = 0;
for (const p of plan) {
  for (const [webp, png] of [[p.lPfad, rasterVon(p.lPfad)]]) {
    if (p.aktion === 'tauschen') {
      const rWebp = p.rPfad, rPng = rasterVon(p.rPfad);
      const lw = lesen(webp), rw = lesen(rWebp);
      schreiben(webp, rw); schreiben(rWebp, lw);
      if (fs.existsSync(path.join(PUBLIC, png)) && fs.existsSync(path.join(PUBLIC, rPng))) {
        const lp = lesen(png), rp = lesen(rPng);
        schreiben(png, rp); schreiben(rPng, lp);
      }
    } else {
      schreiben(webp, await sharp(lesen(webp)).flop().webp({ quality: 92, effort: 4 }).toBuffer());
      if (fs.existsSync(path.join(PUBLIC, png))) schreiben(png, await sharp(lesen(png)).flop().png({ compressionLevel: 9 }).toBuffer());
    }
  }
  fertig++;
}
console.log(`Korrigiert: ${fertig} Farbvarianten. Jetzt die Druckflächen neu erzeugen (siehe Kopfkommentar).`);
