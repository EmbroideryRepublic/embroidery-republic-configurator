/**
 * Freisteller + dunkler Hintergrund für helle Produktfotos (Packshot auf Weiß → Kleidungsstück auf dunklem Verlauf).
 * Aufgerufen von scripts/dunkleHintergruende.mts; die Originale bleiben unberührt.
 *
 * Verfahren: Flutfüllung des weißen Hintergrunds vom Bildrand aus (kein globaler Schwellwert – weiße Stoffteile blieben sonst
 * stehen), Schwelle nach Stofftönung (fast weißer Stoff: streng), Streupunkte weg, Verschluss kleiner Ausbrüche, Kantenband mit
 * Entmischen von Weiß (kein heller Saum), dunkler Verlauf in den Markenfarben mit weichem Schatten.
 */
import sharp from 'sharp';

const W = 620, H = 720;

/** Binäre Box-Dilatation/-Erosion (quadratisches Element, Radius r) – getrennt in x/y, O(n). */
function boxMorph(m, w, h, r, dilatieren) {
  const tmp = new Uint8Array(w * h), out = new Uint8Array(w * h);
  const ziel = dilatieren ? 1 : 0;
  // Zeilen
  for (let y = 0; y < h; y++) {
    let cnt = 0; const base = y * w;
    for (let x = -r; x < w + r; x++) {
      const add = x + r, rem = x - r - 1;
      if (add < w && add >= 0 && m[base + add]) cnt++;
      if (rem >= 0 && rem < w && m[base + rem]) cnt--;
      if (x >= 0 && x < w) tmp[base + x] = dilatieren ? (cnt > 0 ? 1 : 0) : (cnt === Math.min(w - 1, x + r) - Math.max(0, x - r) + 1 ? 1 : 0);
    }
  }
  // Spalten
  for (let x = 0; x < w; x++) {
    let cnt = 0;
    for (let y = -r; y < h + r; y++) {
      const add = y + r, rem = y - r - 1;
      if (add < h && add >= 0 && tmp[add * w + x]) cnt++;
      if (rem >= 0 && rem < h && tmp[rem * w + x]) cnt--;
      if (y >= 0 && y < h) out[y * w + x] = dilatieren ? (cnt > 0 ? 1 : 0) : (cnt === Math.min(h - 1, y + r) - Math.max(0, y - r) + 1 ? 1 : 0);
    }
  }
  return out;
}

/** Hintergrundmaske: 1 = Hintergrund. Flutfüllung vom Rand + abgeschlossene, rein weiße Flächen (Armlöcher, Kapuzenöffnung). */
function hintergrund(px, w, h, tb = 250, tbExakt = 254, minFlaeche = 120, maxFlaeche = 30000, ringMax = 225) {
  const idx = (x, y) => y * w + x;
  const weiss = (i, t) => px[i * 3] >= t && px[i * 3 + 1] >= t && px[i * 3 + 2] >= t;
  const bg = new Uint8Array(w * h);
  const stack = [];
  const push = (x, y) => { const i = idx(x, y); if (!bg[i] && weiss(i, tb)) { bg[i] = 1; stack.push(i); } };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  while (stack.length) {
    const i = stack.pop(); const x = i % w, y = (i / w) | 0;
    if (x > 0) push(x - 1, y); if (x < w - 1) push(x + 1, y); if (y > 0) push(x, y - 1); if (y < h - 1) push(x, y + 1);
  }
  // abgeschlossene Flächen aus (nahezu) exaktem Weiß
  const gesehen = new Uint8Array(w * h);
  for (let s = 0; s < w * h; s++) {
    if (bg[s] || gesehen[s] || !weiss(s, tbExakt)) continue;
    const reg = []; const st = [s]; gesehen[s] = 1;
    while (st.length) {
      const i = st.pop(); reg.push(i); const x = i % w, y = (i / w) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue; const j = idx(nx, ny); if (!gesehen[j] && !bg[j] && weiss(j, tbExakt)) { gesehen[j] = 1; st.push(j); } }
    }
    if (reg.length >= minFlaeche && reg.length <= maxFlaeche) {
      // Ring (3 px) um die Fläche: Echte Löcher (Armloch, Kapuzenöffnung) sind von dunklerem Stoffrand umgeben, überbelichtete Stellen im weißen Stoff nicht.
      const imReg = new Set(reg); let sum = 0, n = 0;
      for (const i of reg) { const x = i % w, y = (i / w) | 0; for (const [dx, dy] of [[3, 0], [-3, 0], [0, 3], [0, -3]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue; const j = idx(nx, ny); if (imReg.has(j) || bg[j]) continue; sum += Math.min(px[j * 3], px[j * 3 + 1], px[j * 3 + 2]); n++; } }
      if (n > 0 && sum / n < ringMax) for (const i of reg) bg[i] = 1;
    }
  }
  return bg;
}

/** Dunkles Bild: Kleidungsstück freigestellt auf dunklem Verlauf mit weichem Schatten. Gibt {webp, png, anteil} zurück. */
export async function dunkel(pfad, opt = {}) {
  const { data, info } = await sharp(pfad).flatten({ background: '#fff' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const maskenData = await sharp(pfad).flatten({ background: '#fff' }).removeAlpha().median(3).raw().toBuffer();
  const w = info.width, h = info.height;
  // Schwelle je nach Stofftönung: Fast weißer Stoff braucht eine strenge Schwelle (sonst läuft die Füllung ins Kleidungsstück),
  // farbiger Stoff verträgt eine großzügige (die Fotos haben Kompressionsrauschen im „weißen“ Hintergrund, 235–255).
  let minSumme = 0, minN = 0;
  for (let y = Math.round(h * 0.4); y < Math.round(h * 0.6); y++) for (let x = Math.round(w * 0.38); x < Math.round(w * 0.62); x++) { const i = (y * w + x) * 3; minSumme += Math.min(data[i], data[i + 1], data[i + 2]); minN++; }
  const kernMin = minSumme / minN;
  const verschlussR = opt.verschluss ?? (kernMin >= 240 ? 5 : 0);
  const tb = opt.tb ?? (kernMin >= 240 ? 250 : Math.max(225, Math.min(250, Math.round(255 - Math.max(6, 0.5 * (255 - kernMin))))));
  const weissStoff = kernMin >= 240; // fast weißer Stoff: nur kleine, deutlich umrandete Löcher entfernen (große weiße Flächen im Stoff sind Überbelichtung)
  // Mit Modellmaske (ISNet, Graustufen 0–255, gleiche Maße) statt Flutfüllung: für fast weiße Stoffe, bei denen weiß auf weiß
  // keine Schwelle trägt. bg = Modell sagt „kein Kleidungsstück“.
  let bg; let grosseLoecher = 0;
  if (opt.maske) {
    const m = await sharp(opt.maske).resize(w, h).greyscale().raw().toBuffer();
    bg = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) bg[i] = m[i] < 128 ? 1 : 0;
    // Abgeschlossene Hintergrundflächen (nicht vom Rand erreichbar): unter 1.200 px sind Fehler der Maske → als Stoff füllen; größere melden
    const vomRand = new Uint8Array(w * h); const st = [];
    for (let x = 0; x < w; x++) for (const y of [0, h - 1]) { const i = y * w + x; if (bg[i] && !vomRand[i]) { vomRand[i] = 1; st.push(i); } }
    for (let y = 0; y < h; y++) for (const x of [0, w - 1]) { const i = y * w + x; if (bg[i] && !vomRand[i]) { vomRand[i] = 1; st.push(i); } }
    while (st.length) { const i = st.pop(); const x = i % w, y = (i / w) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue; const j = ny * w + nx; if (bg[j] && !vomRand[j]) { vomRand[j] = 1; st.push(j); } } }
    const besucht = new Uint8Array(w * h);
    for (let s0 = 0; s0 < w * h; s0++) {
      if (!bg[s0] || vomRand[s0] || besucht[s0]) continue;
      const reg = []; const q = [s0]; besucht[s0] = 1;
      while (q.length) { const i = q.pop(); reg.push(i); const x = i % w, y = (i / w) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue; const j = ny * w + nx; if (bg[j] && !vomRand[j] && !besucht[j]) { besucht[j] = 1; q.push(j); } } }
      if (reg.length < 1200) for (const i of reg) bg[i] = 0; else grosseLoecher++;
    }
  } else {
    bg = hintergrund(maskenData, w, h, tb, opt.tbExakt ?? 254, 120, weissStoff ? 0 : 30000, weissStoff ? 212 : 225);
  }
  // Streupunkte außerhalb des Kleidungsstücks (Rauschen im Hintergrund) entfernen: nur zusammenhängende Stoffflächen ≥ 800 px bleiben
  {
    const gesehen = new Uint8Array(w * h);
    for (let s0 = 0; s0 < w * h; s0++) {
      if (bg[s0] || gesehen[s0]) continue;
      const reg = []; const st = [s0]; gesehen[s0] = 1;
      while (st.length) { const i = st.pop(); reg.push(i); const x = i % w, y = (i / w) | 0; if (x > 0 && !bg[i - 1] && !gesehen[i - 1]) { gesehen[i - 1] = 1; st.push(i - 1); } if (x < w - 1 && !bg[i + 1] && !gesehen[i + 1]) { gesehen[i + 1] = 1; st.push(i + 1); } if (y > 0 && !bg[i - w] && !gesehen[i - w]) { gesehen[i - w] = 1; st.push(i - w); } if (y < h - 1 && !bg[i + w] && !gesehen[i + w]) { gesehen[i + w] = 1; st.push(i + w); } }
      if (reg.length < 800) for (const i of reg) bg[i] = 1;
    }
  }
  // Verschluss: kleine Ausbrüche der Füllung am Stoffrand (weiße Stoffe) zurückholen – Schließen der Stoffmaske
  if (verschlussR > 0) {
    const st0 = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) st0[i] = bg[i] ? 0 : 1;
    const zu = boxMorph(boxMorph(st0, w, h, verschlussR, true), w, h, verschlussR, false);
    for (let i = 0; i < w * h; i++) if (zu[i]) bg[i] = 0;
  }
  // Randband: Stoffpixel höchstens 3 px vom Hintergrund entfernt. Innen (≥ 3 px) bleibt unverändert.
  const stoff = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) stoff[i] = bg[i] ? 0 : 1;
  let innen = Uint8Array.from(stoff);
  for (let pass = 0; pass < 3; pass++) {
    const e = Uint8Array.from(innen);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (!innen[i]) continue; if (x === 0 || y === 0 || x === w - 1 || y === h - 1 || !innen[i - 1] || !innen[i + 1] || !innen[i - w] || !innen[i + w]) e[i] = 0; }
    innen = e;
  }
  // Farbe des Inneren nach außen fortsetzen (4 Durchläufe)
  const farbe = Buffer.from(data); const gesetzt = Uint8Array.from(innen);
  for (let pass = 0; pass < 5; pass++) {
    const neuG = Uint8Array.from(gesetzt); const neuF = Buffer.from(farbe);
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const i = y * w + x; if (gesetzt[i]) continue;
      let r = 0, g = 0, b = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const j = (y + dy) * w + x + dx; if (gesetzt[j]) { r += farbe[j * 3]; g += farbe[j * 3 + 1]; b += farbe[j * 3 + 2]; n++; } }
      if (n) { neuF[i * 3] = r / n; neuF[i * 3 + 1] = g / n; neuF[i * 3 + 2] = b / n; neuG[i] = 1; }
    }
    farbe.set(neuF); gesetzt.set(neuG);
  }
  // Binäre Hilfs-Alpha (für fast weißen Stoff, bei dem Entmischen nicht geht)
  const a0 = Buffer.alloc(w * h); for (let i = 0; i < w * h; i++) a0[i] = stoff[i] ? 255 : 0;
  const glatt = await sharp(a0, { raw: { width: w, height: h, channels: 1 } }).blur(0.9).extractChannel(0).raw().toBuffer();
  const alphaRoh = Buffer.alloc(w * h);
  const rgb = Buffer.from(data);
  for (let i = 0; i < w * h; i++) {
    if (innen[i]) { alphaRoh[i] = 255; continue; }
    if (!gesetzt[i]) { alphaRoh[i] = 0; continue; }
    const cr = farbe[i * 3], cg = farbe[i * 3 + 1], cb = farbe[i * 3 + 2];
    let summe = 0, gew = 0;
    for (const [c, p] of [[cr, data[i * 3]], [cg, data[i * 3 + 1]], [cb, data[i * 3 + 2]]]) { const d = 255 - c; if (d > 28) { summe += Math.max(0, Math.min(1, (255 - p) / d)) * d; gew += d; } }
    const hilf = Math.max(0, Math.min(1, (glatt[i] / 255 - 0.5) * 1.9 + 0.42));
    const entm = gew > 40 ? summe / gew : hilf;
    alphaRoh[i] = Math.round(255 * Math.min(1, entm) * (stoff[i] ? 1 : Math.min(1, hilf * 1.2)));
    rgb[i * 3] = cr; rgb[i * 3 + 1] = cg; rgb[i * 3 + 2] = cb;
  }
  const alpha = await sharp(alphaRoh, { raw: { width: w, height: h, channels: 1 } }).blur(0.6).extractChannel(0).raw().toBuffer();
  const garment = await sharp(rgb, { raw: { width: w, height: h, channels: 3 } }).joinChannel(alpha, { raw: { width: w, height: h, channels: 1 } }).png().toBuffer();
  // Hintergrund: radialer Verlauf, dazu weicher Schatten/Leuchten unter dem Stück
  const c0 = opt.mitte ?? '#34312e', c1 = opt.rand ?? '#141210';
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><radialGradient id="g" cx="50%" cy="46%" r="72%"><stop offset="0" stop-color="${c0}"/><stop offset="1" stop-color="${c1}"/></radialGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/></svg>`);
  const schattenAlpha = await sharp(alpha, { raw: { width: w, height: h, channels: 1 } }).blur(16).extractChannel(0).raw().toBuffer();
  const schatten = await sharp({ create: { width: w, height: h, channels: 3, background: '#000' } }).joinChannel(Buffer.from(schattenAlpha.map((v) => Math.round(v * 0.55))), { raw: { width: w, height: h, channels: 1 } }).png().toBuffer();
  const erweitert = await sharp(schatten).extend({ top: 10, bottom: 0, left: 0, right: 0, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const schattenVersetzt = await sharp(erweitert).extract({ left: 0, top: 0, width: w, height: h }).png().toBuffer();
  const bild = await sharp(svg).png().composite([{ input: schattenVersetzt }, { input: garment }]).flatten().toBuffer();
  const anteil = bg.reduce((s, v) => s + v, 0) / (w * h);
  // Kennzahlen: Anteil Stoff im äußersten Rahmen (4 px) und Spiegelsymmetrie der Stoffmaske
  let rahmenStoff = 0, rahmenN = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (x < 4 || y < 4 || x >= w - 4 || y >= h - 4) { rahmenN++; if (!bg[y * w + x]) rahmenStoff++; }
  let ue = 0, vv = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const a1 = !bg[y * w + x], a2 = !bg[y * w + (w - 1 - x)]; if (a1 && a2) ue++; if (a1 || a2) vv++; }
  // Plausibilität: Fläche der Stoffmaske im Verhältnis zu ihrem stark geschlossenen Gegenstück (Löcher/Ausbrüche senken den Wert)
  const stoffEnde = new Uint8Array(w * h); let flaeche = 0; for (let i = 0; i < w * h; i++) if (!bg[i]) { stoffEnde[i] = 1; flaeche++; }
  const zu40 = boxMorph(boxMorph(stoffEnde, w, h, 40, true), w, h, 40, false);
  let flaeche40 = 0; for (let i = 0; i < w * h; i++) if (zu40[i]) flaeche40++;
  const fuellung = flaeche / Math.max(1, flaeche40);
  // Rechteck-Test: Füllt die Stoffmaske fast ihren ganzen Umriss-Kasten, steht das Kleidungsstück in einem hellen Kasten (Foto mit getöntem Hintergrund)
  let bx0 = w, by0 = h, bx1 = -1, by1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (stoffEnde[y * w + x]) { if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y; }
  const kastenFuellung = bx1 < 0 ? 0 : flaeche / ((bx1 - bx0 + 1) * (by1 - by0 + 1));
  return { png: bild, fuellung, kastenFuellung, grosseLoecher, webp: await sharp(bild).webp({ quality: 85, effort: 5 }).toBuffer(), anteilHintergrund: anteil, rahmen: rahmenStoff / rahmenN, symmetrie: vv ? ue / vv : 0, kernMin: Math.round(kernMin) };
}
