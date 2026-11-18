// Sportbekleidung von textil-grosshandel.eu einlesen (nur öffentliche Produktseiten, kein Login, kein Konto).
// Liest je Modell: Name, Marke, Material, Grammatur, Passform, Größentabelle ("Abmessungen"), und je Farbe Name, Farbwert,
// Preis und die Flachfotos (front/back/Seite) aus den strukturierten Daten der Variantenseite.
//
// Aufruf:   node scripts/import/scrapeSport.mjs [artnr,artnr,…]   → schreibt scripts/import/sport-raw.json
// Weiter:   npx tsx --tsconfig tsconfig.scripts.json scripts/importiereSport.mts   (siehe scripts/import/ABLAUF.md)
// Hinweis:  ~1 Anfrage je Farbe mit 220 ms Pause; ein Lauf über alle Modelle dauert einige Minuten.
// Vorgehen wie beim Kinder-Scraper (scrapeKinder.mjs): nur Modelle mit Vorder- UND Rückfoto im Flachbildstil. Die Sport-Marken
// des Lieferanten (PROACT, Roly Sport, TriDri, Spiro, Tee Jays …) führen überwiegend nur EIN Foto je Farbe und bleiben deshalb draußen.
import fs from 'node:fs';

const BASIS = 'https://www.textil-grosshandel.eu';
const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' };
// Aufgenommen (Schwung 1, 2026-11-18): Sport-T-Shirts, Sport-Langarm, Sport-Tanktop/Weste, Viertelreißverschluss.
const PRODUKTE = [
  '/cool-t/jc001', '/women-s-cool-t/jc005', '/women-s-long-sleeve-cool-t/jc012', '/long-sleeve-active-t/jc023',
  '/lightweight-active-1-4-zip/jc230', '/cool-vest/jc007',
  '/men-s-raglan-sleeves-t-sporty/l198', '/women-s-raglan-sleeves-t-sporty/l200', '/men-s-long-sleeve-sports-t-shirt-sporty/l02071',
  '/active-t/bctg003',
];
// Geprüft, aber NICHT aufgenommen (Schwung 1): Vorder- und Rückfoto vorhanden, aber nur 2–3 Farben (Starworld Sport-Langarm SW300LS,
// Running Vest SW301) – zu wenig Auswahl für den Aufwand; per `node scripts/import/scrapeSport.mjs <artnr>` später erneut prüfbar.
const PRODUKTE_GEPRUEFT_OHNE_RUECKSEITE = [
  '/sport-t-shirt-long-sleeve/sw300ls', '/men-s-running-vest/sw301',
  // Daiber Men´s Active-T JN358 / Ladies´ Active-T JN357: dieselben Artikel (gleiche Artikelnummer) sind als James+Nicholson „Men's Active-T“
  // bzw. „Ladies´ Active-T“ schon im Katalog (jamesNicholson.ts / importiert.generated.ts) – eine zweite Aufnahme wäre eine Dublette.
  '/men-s-active-t/jn358', '/ladies-active-t/jn357',
  // Starworld Sport-T-Shirts SW300/SW403/SW375: Vorder-/Rückfoto vorhanden, aber KEINE Maßtabelle je Größe (nur die allgemeine
  // „Internationale Größentabelle“). Ohne verifizierte Maße (Länge je Größe) lässt sich die Druckfläche nicht maßstäblich berechnen.
  '/men-s-sport-t-shirt/sw300', '/ladies-sport-t-shirt/sw403', '/unisex-recycled-multi-sport-t-shirt/sw375',
];
const ALLE_PRODUKTE = [...PRODUKTE, ...PRODUKTE_GEPRUEFT_OHNE_RUECKSEITE];
// Argument 1 (optional): Artikelnummern, kommagetrennt – nur diese einlesen. Umgebung: OUT = Ausgabedatei (Standard sport-raw.json).
// MERGE=1 fügt die Ergebnisse in eine vorhandene Ausgabedatei ein (gleiche Artikelnummer wird ersetzt) statt sie zu überschreiben.
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
  // Benennung je Lieferant: …-front/…-back (Standard), Just Hoods …-torso-/…-back- (Zoodie) bzw. …-0002 (Vorderseite) / …-0001 (Rückseite)
  // (Hoodie), Stedman …-f-2019-… (Vorderseite) / …-back-…. Alles andere (…-left, …-right, …-0003, Einzelfoto) bleibt unberücksichtigt.
  return {
    front: finde(/-front[-.]/i) ?? finde(/-torso-/i) ?? finde(/-0002(?:-[^.]*)?\.(?:png|jpg)$/i) ?? finde(/-f-20\d\d-/i),
    back: finde(/-back[-.]/i) ?? finde(/-0001(?:-[^.]*)?\.(?:png|jpg)$/i),
    side: finde(/-left\.(png|jpg)/i) ?? finde(/-side-left\.(png|jpg)/i), sideRechts: finde(/-right\.(png|jpg)/i) ?? finde(/-side\.(png|jpg)/i), alle: imgs.length,
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
for (const pfad of ALLE_PRODUKTE) {
  if (nurDiese ? !nurDiese.some((n) => pfad.endsWith('/' + n)) : !PRODUKTE.includes(pfad)) continue;
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
    farben: p.farben.map((f) => ({ name: f.name, hex: f.hex, preis: f.preis, url: f.url, bilder: { front: f.bilder.front, back: f.bilder.back, side: f.bilder.side } })),
  }));
  const ziel = process.env.OUT ?? 'scripts/import/sport-raw.json';
  let ausgabe = schlank;
  if (process.env.MERGE === '1' && fs.existsSync(ziel)) {
    const alt = JSON.parse(fs.readFileSync(ziel, 'utf8')).filter((x) => !schlank.some((n) => n.artNr === x.artNr));
    ausgabe = [...alt, ...schlank];
  }
  fs.writeFileSync(ziel, JSON.stringify(ausgabe, null, 1));
}
console.log('FERTIG', ergebnis.length);
