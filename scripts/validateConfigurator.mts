/**
 * Vollständige Validierung des Konfigurators über den gesamten Bestand.
 *
 * Prüft jede Produkt/Ansicht-Kombination gegen die Invarianten, die im
 * Konfigurator gelten MÜSSEN. Der Zweck ist nicht, einzelne Zahlen zu
 * bestätigen, sondern Widersprüche zu finden – etwa zwischen der
 * gezeichneten Fläche und den angezeigten Zentimetern, die lange
 * unbemerkt auseinanderliefen.
 *
 * Aufruf: npx tsx --tsconfig tsconfig.scripts.json scripts/validateConfigurator.mts
 * Exit-Code 1, wenn Befunde vorliegen – damit taugt das Skript auch als
 * Wächter in einer Prüfstrecke.
 */
import { existsSync } from 'node:fs';
import { zeilenProfil } from './analyzeGarmentContour.mjs';

const { PRODUCTS } = await import('../src/config/products/index.ts');
const { PRINT_AREA_DATA } = await import('../src/config/printAreaData.generated.ts');
const { getPrintAreas } = await import('../src/config/printAreas.ts');
const { getPricingRules } = await import('../src/config/pricingRules.ts');
const { calculatePrice } = await import('../src/lib/pricing/calculatePrice.ts');
const { CANVAS_WIDTH, CANVAS_HEIGHT } = await import('../src/config/products/colorHelpers.ts');

type Schwere = 'FEHLER' | 'WARNUNG';
interface Befund {
  schwere: Schwere;
  bereich: string;
  produkt: string;
  ansicht?: string;
  text: string;
}

const befunde: Befund[] = [];
const melde = (schwere: Schwere, bereich: string, produkt: string, text: string, ansicht?: string) =>
  befunde.push({ schwere, bereich, produkt, text, ...(ansicht ? { ansicht } : {}) });

/**
 * px/cm eines Bildes – aus der TATSÄCHLICH gemessenen Kleidungsstückhöhe.
 *
 * Eine erste Fassung nahm hier einen festen Anteil von 85,8 % der Bildhöhe
 * an. Das erzeugte 239 Falschmeldungen: Der Anteil schwankt je Foto, und die
 * gemeldeten Abweichungen (30,7 statt 30,0 cm) waren der Fehler DIESER
 * Annahme, nicht der Daten. Ein Prüfer, der falsch anschlägt, ist schlimmer
 * als keiner – deshalb wird jetzt jedes Bild vermessen.
 */
const pxProCmCache = new Map<string, number>();
async function pxProCmFuer(bildUrl: string, hoeheCm: number): Promise<number | null> {
  const basis = `public${bildUrl}`.replace(/\.(webp|png)$/, '');
  const pfad = existsSync(`${basis}.png`) ? `${basis}.png` : existsSync(`${basis}.webp`) ? `${basis}.webp` : null;
  if (!pfad) return null;
  const key = `${pfad}|${hoeheCm}`;
  const zwischen = pxProCmCache.get(key);
  if (zwischen !== undefined) return zwischen;

  const { zeilen } = await zeilenProfil(pfad);
  const belegt = zeilen.filter((z) => z.breite > 0);
  if (belegt.length === 0) return null;
  const hoehePx = belegt[belegt.length - 1]!.y - belegt[0]!.y + 1;
  const wert = hoehePx / hoeheCm;
  pxProCmCache.set(key, wert);
  return wert;
}

const VIEWS = ['front', 'back', 'sleeve_left', 'sleeve_right'] as const;

// ── 1. Produktdaten ──────────────────────────────────────────────────────
for (const p of PRODUCTS) {
  const pflicht: [string, unknown][] = [
    ['name', p.name],
    ['brand', p.brand],
    ['material', p.material],
    ['fit', p.fit],
    ['description', p.description],
    ['careInstructions', p.careInstructions],
  ];
  for (const [feld, wert] of pflicht) {
    if (typeof wert !== 'string' || !wert.trim()) melde('FEHLER', 'Produktdaten', p.id, `${feld} fehlt`);
  }
  if (!(p.weightGsm > 0)) melde('FEHLER', 'Produktdaten', p.id, 'weightGsm <= 0');
  if (!(p.basePrice > 0)) melde('FEHLER', 'Preis', p.id, 'basePrice <= 0');
  if (!(p.purchasePrice > 0)) melde('WARNUNG', 'Preis', p.id, 'purchasePrice <= 0 (EK noch nicht hinterlegt)');
  if (p.basePrice <= p.purchasePrice) melde('FEHLER', 'Preis', p.id, `basePrice ${p.basePrice} <= purchasePrice ${p.purchasePrice}`);
  if (p.sizes.length === 0) melde('FEHLER', 'Größen', p.id, 'keine Größen');
  if (p.colors.length === 0) melde('FEHLER', 'Farben', p.id, 'keine Farben');

  // Größentabelle muss die angebotenen Größen abdecken.
  if (p.sizeGuide) {
    const bekannt = new Set(p.sizeGuide.measurements.map((m) => m.size));
    for (const s of p.sizes) {
      if (!bekannt.has(s)) melde('WARNUNG', 'Größentabelle', p.id, `Größe ${s} ohne Maße`);
    }
    // Maße müssen mit der Größe wachsen.
    const ms = p.sizeGuide.measurements;
    for (let i = 1; i < ms.length; i++) {
      if (ms[i]!.breiteCm < ms[i - 1]!.breiteCm) melde('FEHLER', 'Größentabelle', p.id, `Breite sinkt bei ${ms[i]!.size}`);
      if (ms[i]!.hoeheCm < ms[i - 1]!.hoeheCm) melde('FEHLER', 'Größentabelle', p.id, `Länge sinkt bei ${ms[i]!.size}`);
    }
  } else {
    melde('FEHLER', 'Größentabelle', p.id, 'sizeGuide fehlt');
  }

  // Farben: Hex gültig, Bilder vorhanden.
  for (const c of p.colors) {
    if (!/^#[0-9a-fA-F]{6}$/.test(c.hex)) melde('FEHLER', 'Farben', p.id, `${c.id}: ungültiger Hex "${c.hex}"`);
    const noetig = p.hasSleeves === false ? VIEWS.slice(0, 2) : VIEWS;
    for (const v of noetig) {
      const url = c.images[v];
      if (!url) {
        melde('FEHLER', 'Bilder', p.id, `${c.id}: ${v} fehlt`, v);
        continue;
      }
      const basis = `public${url}`.replace(/\.(webp|png)$/, '');
      if (!existsSync(`${basis}.webp`) && !existsSync(`${basis}.png`)) {
        melde('FEHLER', 'Bilder', p.id, `${c.id}/${v}: Datei fehlt (${url})`, v);
      }
    }
  }
}

// ── 2. Druckflächen: gezeichnet == angezeigt ─────────────────────────────
for (const p of PRODUCTS) {
  const views = PRINT_AREA_DATA[p.id];
  if (!views) {
    melde('FEHLER', 'Druckfläche', p.id, 'keine Flächen erzeugt');
    continue;
  }
  const mass = p.sizeGuide?.measurements.find((m) => m.size === 'M') ?? p.sizeGuide?.measurements[0];
  if (!mass) continue;

  const erwartet = p.hasSleeves === false ? VIEWS.slice(0, 2) : VIEWS;
  for (const v of erwartet) {
    const a = views[v];
    if (!a) {
      melde('FEHLER', 'Druckfläche', p.id, `${v} fehlt`, v);
      continue;
    }

    // Innerhalb des Bildes?
    if (a.x0 < 0 || a.y0 < 0 || a.x1 > 100 || a.y1 > 100) {
      melde('FEHLER', 'Druckfläche', p.id, `ragt aus dem Bild (${a.x0},${a.y0})-(${a.x1},${a.y1})`, v);
    }
    if (a.x1 <= a.x0 || a.y1 <= a.y0) melde('FEHLER', 'Druckfläche', p.id, 'Breite oder Höhe <= 0', v);

    // KERNPRÜFUNG: gezeichnete Strecke muss den angezeigten cm entsprechen.
    const bildUrl = p.colors[0]?.images[v];
    const pxProCm = bildUrl ? await pxProCmFuer(bildUrl, mass.hoeheCm) : null;
    if (pxProCm === null) {
      melde('WARNUNG', 'Skalierung', p.id, 'px/cm nicht messbar (Bild fehlt)', v);
      continue;
    }
    const gezB = (((a.x1 - a.x0) / 100) * a.imgW) / pxProCm;
    const gezH = (((a.y1 - a.y0) / 100) * a.imgH) / pxProCm;
    const TOLERANZ = 0.5; // cm – deckt Rundung auf eine Nachkommastelle ab
    if (Math.abs(gezB - a.maxWidthCm) > TOLERANZ) {
      melde('FEHLER', 'Skalierung', p.id, `Breite gezeichnet ${gezB.toFixed(1)} cm vs. angezeigt ${a.maxWidthCm} cm`, v);
    }
    if (Math.abs(gezH - a.maxHeightCm) > TOLERANZ) {
      melde('FEHLER', 'Skalierung', p.id, `Höhe gezeichnet ${gezH.toFixed(1)} cm vs. angezeigt ${a.maxHeightCm} cm`, v);
    }

    // Effektive Fläche darf die Kleidungsstückfläche nicht überschreiten.
    if (a.maxWidthCm > a.garmentWidthCm + 0.05) {
      melde('FEHLER', 'Druckfläche', p.id, `${a.maxWidthCm} cm breiter als Kleidungsstück ${a.garmentWidthCm} cm`, v);
    }

    // Plausibilität je Ansichtstyp.
    const istAermel = v === 'sleeve_left' || v === 'sleeve_right';
    if (istAermel) {
      if (a.maxWidthCm < 7 || a.maxWidthCm > 12) {
        melde('WARNUNG', 'Ärmel', p.id, `Breite ${a.maxWidthCm} cm außerhalb 7–12 cm`, v);
      }
      if (a.maxHeightCm < 8 || a.maxHeightCm > 12) {
        melde('WARNUNG', 'Ärmel', p.id, `Höhe ${a.maxHeightCm} cm außerhalb 8–12 cm`, v);
      }
    } else {
      if (a.maxWidthCm < 20) melde('WARNUNG', 'Druckfläche', p.id, `Breite ${a.maxWidthCm} cm sehr klein`, v);
      if (a.maxHeightCm < 25) melde('WARNUNG', 'Druckfläche', p.id, `Höhe ${a.maxHeightCm} cm sehr klein`, v);
    }
  }

  // Ärmelansichten müssen untereinander identisch dimensioniert sein.
  const l = views.sleeve_left;
  const r = views.sleeve_right;
  if (l && r) {
    if (Math.abs(l.maxWidthCm - r.maxWidthCm) > 0.05 || Math.abs(l.maxHeightCm - r.maxHeightCm) > 0.05) {
      melde('FEHLER', 'Ärmel', p.id, `linker und rechter Ärmel unterschiedlich: ${l.maxWidthCm}×${l.maxHeightCm} vs ${r.maxWidthCm}×${r.maxHeightCm}`);
    }
  }

  // Vorder- und Rückseite müssen dieselbe Fläche anbieten.
  if (views.front && views.back) {
    if (Math.abs(views.front.maxWidthCm - views.back.maxWidthCm) > 0.05) {
      melde('WARNUNG', 'Druckfläche', p.id, `front/back Breite abweichend: ${views.front.maxWidthCm} vs ${views.back.maxWidthCm}`);
    }
  }
}

// ── 3. getPrintAreas: beide Veredelungsarten, gleiche Geometrie ──────────
for (const p of PRODUCTS) {
  const dtf = await getPrintAreas(p.id, 'dtf');
  const stick = await getPrintAreas(p.id, 'embroidery');
  const erwartet = p.hasSleeves === false ? 2 : 4;

  if (dtf.length !== erwartet) melde('FEHLER', 'Veredelung', p.id, `DTF: ${dtf.length} statt ${erwartet} Ansichten`);
  if (stick.length !== erwartet) melde('FEHLER', 'Veredelung', p.id, `Stickerei: ${stick.length} statt ${erwartet} Ansichten`);

  for (const d of dtf) {
    const s = stick.find((x) => x.view === d.view);
    if (!s) continue;
    // Die POSITION muss zwischen den Methoden identisch sein – sonst würde
    // ein Methodenwechsel bestehende Motive verschieben.
    const gleich =
      d.xPercent === s.xPercent && d.yPercent === s.yPercent &&
      d.widthPercent === s.widthPercent && d.heightPercent === s.heightPercent;
    if (!gleich) melde('FEHLER', 'Veredelung', p.id, `DTF und Stickerei haben unterschiedliche Geometrie`, d.view);

    if (!(d.movementWidthCm > 0)) melde('FEHLER', 'Skalierung', p.id, 'movementWidthCm <= 0', d.view);
    if (!(d.referenceGarmentHeightCm > 0)) melde('FEHLER', 'Skalierung', p.id, 'referenceGarmentHeightCm <= 0', d.view);

    // Gegenprobe zur isotropen Umrechnung im Canvas.
    //
    // WICHTIG: Das Bild wird in die Leinwand EINGEPASST (contain), nicht
    // gestreckt. Eine erste Fassung rechnete areaPxH gegen CANVAS_HEIGHT und
    // meldete dadurch 162 Falschbefunde – der Unterschied war ausschließlich
    // das ignorierte Seitenverhältnis. Genau dafür trägt movementWidthCm den
    // Faktor imgW/imgH (siehe Kommentar in printAreas.ts).
    const bildA = PRINT_AREA_DATA[p.id]?.[d.view];
    if (!bildA) continue;
    const bildAspekt = bildA.imgW / bildA.imgH;
    const leinwandAspekt = CANVAS_WIDTH / CANVAS_HEIGHT;
    const dargestellteBreite = bildAspekt >= leinwandAspekt ? CANVAS_WIDTH : CANVAS_HEIGHT * bildAspekt;
    const dargestellteHoehe = bildAspekt >= leinwandAspekt ? CANVAS_WIDTH / bildAspekt : CANVAS_HEIGHT;
    const areaPxW = (d.widthPercent / 100) * dargestellteBreite;
    const areaPxH = (d.heightPercent / 100) * dargestellteHoehe;
    const pxProCm = areaPxH / d.referenceGarmentHeightCm;
    const abweichung = Math.abs(d.movementWidthCm * pxProCm - areaPxW);
    if (abweichung > 1) {
      melde('FEHLER', 'Skalierung', p.id, `movementWidthCm inkonsistent (Δ ${abweichung.toFixed(1)} px)`, d.view);
    }
  }
}

// ── 4. Preisberechnung ───────────────────────────────────────────────────
const rules = await getPricingRules();
for (const p of PRODUCTS) {
  for (const methode of ['dtf', 'embroidery'] as const) {
    const r = calculatePrice({
      basePrice: p.basePrice,
      elements: [],
      quantity: 10,
      printMethod: methode,
      pricingRules: rules,
    });
    if (!Number.isFinite(r.totalPrice) || r.totalPrice <= 0) {
      melde('FEHLER', 'Preis', p.id, `${methode}: totalPrice ${r.totalPrice}`);
    }
    if (r.totalPrice < p.basePrice) {
      melde('WARNUNG', 'Preis', p.id, `${methode}: Gesamtpreis ${r.totalPrice} unter Grundpreis ${p.basePrice}`);
    }
  }
}

// ── Ausgabe ──────────────────────────────────────────────────────────────
const fehler = befunde.filter((b) => b.schwere === 'FEHLER');
const warnungen = befunde.filter((b) => b.schwere === 'WARNUNG');

console.log(`\nGeprüft: ${PRODUCTS.length} Produkte × bis zu 4 Ansichten × 2 Veredelungsarten\n`);

for (const gruppe of ['FEHLER', 'WARNUNG'] as const) {
  const liste = gruppe === 'FEHLER' ? fehler : warnungen;
  if (liste.length === 0) continue;
  console.log(`── ${gruppe} (${liste.length}) ──`);
  const proBereich = new Map<string, Befund[]>();
  for (const b of liste) proBereich.set(b.bereich, [...(proBereich.get(b.bereich) ?? []), b]);
  for (const [bereich, bs] of [...proBereich.entries()].sort()) {
    console.log(`  ${bereich} (${bs.length}):`);
    for (const b of bs.slice(0, 12)) {
      console.log(`    ${b.produkt}${b.ansicht ? '/' + b.ansicht : ''}: ${b.text}`);
    }
    if (bs.length > 12) console.log(`    … und ${bs.length - 12} weitere`);
  }
  console.log('');
}

console.log(`ERGEBNIS: ${fehler.length} Fehler, ${warnungen.length} Warnungen`);
if (fehler.length > 0) process.exitCode = 1;
