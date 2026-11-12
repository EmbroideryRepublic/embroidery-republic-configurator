// Kinderbekleidung von textil-grosshandel.eu einlesen (nur öffentliche Produktseiten, kein Login, kein Konto).
// Liest je Modell: Name, Marke, Material, Grammatur, Größentabelle ("Abmessungen"), und je Farbe Name, Farbwert,
// Preis und die Flachfotos (front/back) aus den strukturierten Daten der Variantenseite.
//
// Aufruf:   node scripts/import/scrapeKinder.mjs [artnr,artnr,…]   → schreibt scripts/import/kinder-raw.json
// Weiter:   npx tsx --tsconfig tsconfig.scripts.json scripts/importiereKinder.mts   (siehe scripts/import/ABLAUF.md)
// Hinweis:  ~1 Anfrage je Farbe mit 220 ms Pause; ein Lauf über alle Modelle dauert einige Minuten.
import fs from 'node:fs';

const BASIS = 'https://www.textil-grosshandel.eu';
const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' };
// Nur Modelle mit Vorder- UND Rückfoto im Flachbildstil (…-front…/…-back…) und einem der unterstützten Größenschemata.
const PRODUKTE = [
  '/kids-valueweight-t/f140k', '/kids-e150-t-shirt/bctk001', '/kids-e190-t-shirt/bctk002', '/heavy-cotton-youth-t-shirt/g5000k',
  '/kids-classic-hooded-sweat/f421nk', '/heavy-blend-youth-hooded-sweatshirt/g18500k',
  '/kids-awdis-sweat/jh030k', '/heavy-blend-youth-crewneck-sweatshirt/g18000k',
  '/kids-classic-hooded-sweat-jacket/f401nk', '/kids-valueweight-long-sleeve-t/f240k',
];
const nurDiese = process.argv[2] ? process.argv[2].split(',') : null;
const warte = (ms) => new Promise((r) => setTimeout(r, ms));

async function hole(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, { headers: UA, redirect: 'follow' });
      if (res.ok) return await res.text();
    } catch { /* erneut */ }
    await warte(800);
  }
  throw new Error('nicht abrufbar: ' + url);
}
const dec = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const zahl = (s) => Number(String(s).replace(',', '.'));
function ldGruppe(h) {
  for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { const o = JSON.parse(m[1]); if (o['@type'] === 'ProductGroup') return o; } catch { /* nächstes */ }
  }
  return null;
}
function textZeilen(h) {
  const t = h.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, '\n').replace(/\n\s*\n+/g, '\n');
  return t.split('\n').map((s) => dec(s.trim())).filter(Boolean);
}
function nach(lines, label) { const i = lines.indexOf(label); return i >= 0 ? lines[i + 1] : undefined; }
function varianten(h) {
  const out = [];
  const teile = h.split(/data-option-name="/).slice(1);
  for (const t of teile) {
    const name = t.slice(0, t.indexOf('"'));
    const url = (t.match(/href="([^"]+)"/) || [])[1];
    const hex = (t.match(/--custom-variant-color:\s*(#[0-9a-fA-F]{6})/) || [])[1];
    out.push({ name: dec(name), url, hex });
  }
  return out;
}
function bilder(ld) {
  const imgs = (ld?.hasVariant?.[0]?.image ?? ld?.image ?? []).filter((u) => /\/public\/media\//.test(u) && !/thumbnail/.test(u));
  const finde = (re) => imgs.find((u) => re.test(u.split('/').pop()));
  return {
    front: finde(/-front[-.]/i), back: finde(/-back[-.]/i),
    sideLeft: finde(/-side-left\.(png|jpg)/i), side: finde(/-side\.(png|jpg)/i), alle: imgs.length,
  };
}
function preis(h) {
  const lines = textZeilen(h);
  const i = lines.findIndex((l) => l.includes('Regulärer Preis'));
  if (i < 0) return null;
  for (const l of lines.slice(i, i + 5)) { const m = l.match(/(\d+,\d{2})\s*€/); if (m) return zahl(m[1]); }
  return null;
}
function groessen(h) {
  const i = h.indexOf('Größen &amp; Mengen wählen');
  const seg = h.slice(i, i + 12000);
  const out = [];
  for (const m of seg.matchAll(/<(?:td|th|span|div)[^>]*>\s*(\d{2,3}|[0-9]+\s*\/\s*[0-9]+|[XSML0-9]+(?:XL|XXL)?)\s*<\/(?:td|th|span|div)>/g)) out.push(m[1].trim());
  return [...new Set(out)];
}
function masse(h) {
  const i = h.indexOf('tg-product-dimensions-table');
  if (i < 0) return [];
  const seg = h.slice(i, h.indexOf('</table>', i));
  const kopf = [...seg.matchAll(/<th>([^<]*)<\/th>/g)].map((m) => m[1].trim());
  const rows = [];
  for (const r of seg.matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
    const tds = [...r[1].matchAll(/<td>([^<]*)<\/td>/g)].map((m) => m[1].trim());
    if (tds.length >= 2) rows.push(tds);
  }
  return { kopf, rows };
}

const ergebnis = [];
for (const pfad of PRODUKTE) {
  if (nurDiese && !nurDiese.some((n) => pfad.endsWith('/' + n))) continue;
  const h = await hole(BASIS + pfad);
  const ld = ldGruppe(h);
  const lines = textZeilen(h);
  const komp = lines.findIndex((l) => l === 'Zusammensetzung:');
  const farben = varianten(h);
  const p = {
    url: BASIS + pfad,
    artNr: ld?.productGroupID ?? pfad.split('/').pop().toUpperCase(),
    name: dec(ld?.name ?? ''),
    brand: ld?.brand?.name ?? '',
    beschreibung: dec(ld?.description ?? ''),
    material: komp >= 0 ? lines[komp + 1] : '',
    grammatur: komp >= 0 ? (lines[komp + 3] ?? '') : '',
    geschlecht: nach(lines, 'Geschlecht'),
    passform: nach(lines, 'Passform'),
    produktart: nach(lines, 'Produktart'),
    ausschnitt: nach(lines, 'Ausschnitt'),
    aermel: nach(lines, 'Ärmel'),
    groessen: groessen(h),
    masse: masse(h),
    preisHauptseite: ldGruppe(h)?.hasVariant?.[0]?.offers?.price ?? null,
    farben: [],
  };
  for (const f of farben) {
    const vh = f.url && f.url !== BASIS + pfad ? await hole(f.url) : h;
    const vld = ldGruppe(vh);
    const v0 = vld?.hasVariant?.[0];
    p.farben.push({ ...f, preis: v0?.offers?.price ?? null, ldFarbe: v0?.color ?? null, bilder: bilder(vld), groessenFarbe: groessen(vh) });
    await warte(220);
  }
  ergebnis.push(p);
  console.log(p.artNr, p.name, '|', p.farben.length, 'Farben |', p.groessen.join(','), '| ab', Math.min(...p.farben.map((c) => c.preis ?? 99)));
  const schlank = ergebnis.map((p) => ({
    url: p.url, artNr: p.artNr, name: p.name, brand: p.brand, beschreibung: p.beschreibung, material: p.material,
    grammatur: p.grammatur, geschlecht: p.geschlecht, passform: p.passform, produktart: p.produktart, masse: p.masse,
    farben: p.farben.map((f) => ({ name: f.name, hex: f.hex, preis: f.preis, url: f.url, bilder: { front: f.bilder.front, back: f.bilder.back } })),
  }));
  fs.writeFileSync(process.env.OUT ?? 'scripts/import/kinder-raw.json', JSON.stringify(schlank, null, 1));
}
console.log('FERTIG', ergebnis.length);
