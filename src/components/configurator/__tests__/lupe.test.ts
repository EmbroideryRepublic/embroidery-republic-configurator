/**
 * Lupe der Konfigurator-Vorschau: reine Rechenlogik (Ausschnitt, Linsenlage, Vergrößerung, Ränder, Entprellung,
 * Aufnahme-Schlüssel, Tastatur). Die Lupe ist reine Anzeige – diese Tests sichern, dass die Zahlen stimmen, auf denen
 * die Darstellung beruht.
 */
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { ConfigElement, LogoElement, PrintView, TextElement } from '@/types';
import {
  FINGER_ABSTAND_PX,
  LINSE_DURCHMESSER_GROSS_PX,
  LINSE_DURCHMESSER_KLEIN_PX,
  LINSE_RAND_PX,
  LUPE_STAERKEN,
  LUPE_STANDARD_STAERKE,
  SCHNAPPSCHUSS_ENTPRELLUNG_MS,
  SCHNAPPSCHUSS_FAKTOR,
  TASTEN_SCHRITT_GROSS_PX,
  TASTEN_SCHRITT_PX,
  begrenzeStaerke,
  berechneAusschnitt,
  berechneSchnappschussPixelRatio,
  entprelle,
  hatSichtbaresMotiv,
  klemmeLinsenmitte,
  linsenDurchmesser,
  linsenGeometrie,
  linsenInnenDurchmesser,
  naechsteStaerke,
  schnappschussSchluessel,
  schnittmenge,
  staerkeText,
  tastenSchritt,
  tastenStaerkeRichtung,
  waehleStartMotiv,
  zeigerAnteil,
} from '../lupe';

// ── Vergrößerung ───────────────────────────────────────────────────────

test('Vergrößerung: Standard 2,5-fach, erlaubt sind 2× bis 4×', () => {
  assert.equal(LUPE_STANDARD_STAERKE, 2.5);
  assert.deepEqual([...LUPE_STAERKEN], [2, 2.5, 3, 4]);
  assert.equal(begrenzeStaerke(1), 2);
  assert.equal(begrenzeStaerke(9), 4);
  assert.equal(begrenzeStaerke(3.3), 3.3);
  assert.equal(begrenzeStaerke(Number.NaN), LUPE_STANDARD_STAERKE);
});

test('Stärke ändern: Stufe für Stufe, an den Enden bleibt sie stehen', () => {
  assert.equal(naechsteStaerke(2.5, 1), 3);
  assert.equal(naechsteStaerke(3, 1), 4);
  assert.equal(naechsteStaerke(4, 1), 4, 'oberstes Ende');
  assert.equal(naechsteStaerke(2.5, -1), 2);
  assert.equal(naechsteStaerke(2, -1), 2, 'unterstes Ende');
  // Zwischenwert springt zur nächsten Stufe in der gewünschten Richtung.
  assert.equal(naechsteStaerke(2.7, 1), 3);
  assert.equal(naechsteStaerke(2.7, -1), 2.5);
});

test('Stärke als Text: deutsches Komma, ganze Zahlen ohne Nachkommastelle', () => {
  assert.equal(staerkeText(2.5), '2,5×');
  assert.equal(staerkeText(3), '3×');
  assert.equal(staerkeText(2.5, 'en'), '2.5×');
});

// ── Linsengröße ────────────────────────────────────────────────────────

test('Linsendurchmesser: ca. 200 px, auf kleinen Bildschirmen ca. 150 px', () => {
  assert.equal(linsenDurchmesser(1440), LINSE_DURCHMESSER_GROSS_PX);
  assert.equal(linsenDurchmesser(640), LINSE_DURCHMESSER_GROSS_PX);
  assert.equal(linsenDurchmesser(639), LINSE_DURCHMESSER_KLEIN_PX);
  assert.equal(linsenDurchmesser(375), LINSE_DURCHMESSER_KLEIN_PX);
  assert.ok(LINSE_DURCHMESSER_GROSS_PX >= 180 && LINSE_DURCHMESSER_GROSS_PX <= 220);
});

test('weißer Rand: 4–6 px, die Innenfläche ist entsprechend kleiner', () => {
  assert.ok(LINSE_RAND_PX >= 4 && LINSE_RAND_PX <= 6);
  assert.equal(linsenInnenDurchmesser(200), 200 - 2 * LINSE_RAND_PX);
});

// ── Geometrie: Rechtecke, Klemmen ──────────────────────────────────────

test('Schnittmenge: Überlappung oder null', () => {
  assert.deepEqual(schnittmenge({ x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: 5, width: 10, height: 10 }), { x: 5, y: 5, width: 5, height: 5 });
  assert.equal(schnittmenge({ x: 0, y: 0, width: 10, height: 10 }, { x: 10, y: 0, width: 5, height: 5 }), null, 'nur Berührung zählt nicht');
  assert.equal(schnittmenge({ x: 0, y: 0, width: 10, height: 10 }, { x: 20, y: 20, width: 5, height: 5 }), null);
});

test('Linse bleibt ganz im Bereich (kein Überstand über den Seitenrand)', () => {
  const bereich = { x: 0, y: 0, width: 400, height: 500 };
  assert.deepEqual(klemmeLinsenmitte({ x: 10, y: 10 }, bereich, 100), { x: 100, y: 100 }, 'links oben');
  assert.deepEqual(klemmeLinsenmitte({ x: 395, y: 495 }, bereich, 100), { x: 300, y: 400 }, 'rechts unten');
  assert.deepEqual(klemmeLinsenmitte({ x: 200, y: 250 }, bereich, 100), { x: 200, y: 250 }, 'innen unverändert');
});

test('Bereich schmaler als die Linse (kleines Handy-Fenster): Linse mittig, kein Hin- und Herspringen', () => {
  const schmal = { x: 0, y: 0, width: 120, height: 500 };
  assert.deepEqual(klemmeLinsenmitte({ x: 5, y: 250 }, schmal, 100), { x: 60, y: 250 });
  assert.deepEqual(klemmeLinsenmitte({ x: 119, y: 250 }, schmal, 100), { x: 60, y: 250 });
});

test('Zeigeranteil: Position in der Vorschau, am Rand geklemmt', () => {
  const bild = { x: 34, y: 0, width: 200, height: 400 };
  assert.deepEqual(zeigerAnteil({ x: 134, y: 200 }, bild), { x: 0.5, y: 0.5 });
  assert.deepEqual(zeigerAnteil({ x: 0, y: 900 }, bild), { x: 0, y: 1 });
  assert.deepEqual(zeigerAnteil({ x: 500, y: -5 }, bild), { x: 1, y: 0 });
  assert.deepEqual(zeigerAnteil({ x: 1, y: 1 }, { x: 0, y: 0, width: 0, height: 0 }), { x: 0.5, y: 0.5 }, 'leere Vorschau');
});

// ── Geometrie: Lage der Linse ──────────────────────────────────────────

const bild = { x: 34, y: 0, width: 600, height: 700 };
const huelle = { x: 0, y: 0, width: 640, height: 740 };

test('Maus: Linse sitzt auf dem Zeiger und zeigt, was darunter liegt', () => {
  const g = linsenGeometrie({ zeiger: { x: 300, y: 300 }, art: 'maus', bild, bereich: huelle, radius: 100 });
  assert.deepEqual(g.fensterMitte, { x: 300, y: 300 });
  assert.deepEqual(g.ziel, { x: 300, y: 300 });
});

test('Maus am Rand: Linse wird in den Bereich geschoben, gezeigt wird der Punkt unter der Linsenmitte', () => {
  const g = linsenGeometrie({ zeiger: { x: 40, y: 5 }, art: 'maus', bild, bereich: huelle, radius: 100 });
  assert.deepEqual(g.fensterMitte, { x: 100, y: 100 });
  assert.deepEqual(g.ziel, g.fensterMitte);
});

test('Finger: Linse sitzt oberhalb der Fingerspitze, gezeigt wird die Stelle UNTER dem Finger', () => {
  const g = linsenGeometrie({ zeiger: { x: 300, y: 500 }, art: 'finger', bild, bereich: huelle, radius: 75 });
  assert.deepEqual(g.ziel, { x: 300, y: 500 });
  assert.deepEqual(g.fensterMitte, { x: 300, y: 500 - (75 + FINGER_ABSTAND_PX) });
});

test('Finger weit oben: passt die Linse oben nicht mehr in den Bereich, kommt sie unter den Finger', () => {
  const g = linsenGeometrie({ zeiger: { x: 300, y: 40 }, art: 'finger', bild, bereich: huelle, radius: 75 });
  assert.deepEqual(g.ziel, { x: 300, y: 40 });
  assert.equal(g.fensterMitte.y, 40 + 75 + FINGER_ABSTAND_PX);
});

test('Finger: Bereich nach oben erweitert (Handy-Vorschau ist klein) – Linse bleibt oberhalb', () => {
  const erweitert = { x: 0, y: -(150 + FINGER_ABSTAND_PX), width: 210, height: 250 + 150 + FINGER_ABSTAND_PX };
  const klein = { x: 17, y: 0, width: 176, height: 212 };
  const g = linsenGeometrie({ zeiger: { x: 100, y: 120 }, art: 'finger', bild: klein, bereich: erweitert, radius: 75 });
  assert.equal(g.fensterMitte.y, 120 - 75 - FINGER_ABSTAND_PX);
  assert.ok(g.fensterMitte.y < 120, 'Linse über dem Finger');
});

test('Finger außerhalb der Vorschau: Zielpunkt wird auf die Vorschau geklemmt', () => {
  const g = linsenGeometrie({ zeiger: { x: 10, y: 900 }, art: 'finger', bild, bereich: huelle, radius: 75 });
  assert.deepEqual(g.ziel, { x: 34, y: 700 });
});

// ── Ausschnitt ─────────────────────────────────────────────────────────

const vorschau = { width: 700, height: 840 };
const speicher = { width: 2100, height: 2520 }; // Faktor 3

test('Ausschnitt in der Mitte: Quelle = Linseninnenfläche / Stärke, Ziel = ganze Linse', () => {
  const a = berechneAusschnitt({
    ziel: { x: 350, y: 420 },
    vorschau,
    zwischenspeicher: speicher,
    linseCss: 190,
    linsePixel: 380,
    staerke: 2.5,
  });
  assert.ok(a);
  // 190 / 2,5 = 76 CSS-px der Vorschau = 228 Bildpunkte des Zwischenspeichers
  assert.ok(Math.abs(a.quelle.width - 228) < 1e-9);
  assert.ok(Math.abs(a.quelle.height - 228) < 1e-9);
  assert.ok(Math.abs(a.quelle.x - (350 * 3 - 114)) < 1e-9);
  assert.ok(Math.abs(a.quelle.y - (420 * 3 - 114)) < 1e-9);
  assert.deepEqual(a.ziel, { x: 0, y: 0, width: 380, height: 380 });
});

test('Ausschnitt: stärkere Vergrößerung zeigt weniger Bildfläche', () => {
  const basis = { ziel: { x: 350, y: 420 }, vorschau, zwischenspeicher: speicher, linseCss: 190, linsePixel: 380 };
  const b2 = berechneAusschnitt({ ...basis, staerke: 2 })!;
  const b4 = berechneAusschnitt({ ...basis, staerke: 4 })!;
  assert.ok(Math.abs(b2.quelle.width / b4.quelle.width - 2) < 1e-9, '2× zeigt doppelt so viel Fläche wie 4×');
});

test('Ausschnitt am Rand: wird beschnitten, das Ziel im selben Verhältnis verschoben (nichts wird gestreckt)', () => {
  // Zielpunkt genau an der linken oberen Ecke: nur das Viertel rechts unten der Linse zeigt Bild.
  const a = berechneAusschnitt({
    ziel: { x: 0, y: 0 },
    vorschau,
    zwischenspeicher: speicher,
    linseCss: 190,
    linsePixel: 380,
    staerke: 2.5,
  })!;
  assert.deepEqual(a.quelle, { x: 0, y: 0, width: 114, height: 114 });
  assert.deepEqual(a.ziel, { x: 190, y: 190, width: 190, height: 190 });
  // Gleicher Maßstab wie in der Mitte: Quelle/Ziel = 114/190 = 228/380
  assert.ok(Math.abs(a.quelle.width / a.ziel.width - 228 / 380) < 1e-12);
});

test('Ausschnitt an der rechten unteren Ecke: Ziel beginnt bei 0 und endet vor dem Linsenrand', () => {
  const a = berechneAusschnitt({
    ziel: { x: 700, y: 840 },
    vorschau,
    zwischenspeicher: speicher,
    linseCss: 190,
    linsePixel: 380,
    staerke: 2.5,
  })!;
  assert.deepEqual(a.ziel, { x: 0, y: 0, width: 190, height: 190 });
  assert.deepEqual(a.quelle, { x: 2100 - 114, y: 2520 - 114, width: 114, height: 114 });
});

test('Ausschnitt ganz außerhalb der Vorschau oder bei leeren Größen: null', () => {
  const basis = { vorschau, zwischenspeicher: speicher, linseCss: 190, linsePixel: 380, staerke: 2.5 };
  assert.equal(berechneAusschnitt({ ...basis, ziel: { x: -500, y: 0 } }), null);
  assert.equal(berechneAusschnitt({ ...basis, ziel: { x: 100, y: 5000 } }), null);
  assert.equal(berechneAusschnitt({ ...basis, ziel: { x: 100, y: 100 }, vorschau: { width: 0, height: 0 } }), null);
  assert.equal(berechneAusschnitt({ ...basis, ziel: { x: 100, y: 100 }, zwischenspeicher: { width: 0, height: 0 } }), null);
});

test('Schärfe: Der Zwischenspeicher hat mehr Bildpunkte je Anzeigepixel als die 1×-Darstellung (echt scharf, nicht hochskaliert)', () => {
  // Desktop, 100 %, Bildschirm mit Geräte-Pixelverhältnis 1: Linse zeigt bei 2,5× je CSS-Pixel 2,5 Anzeigepixel.
  const r = berechneSchnappschussPixelRatio({ stageScale: 1, logischeBreite: 700, logischeHoehe: 840 });
  const a = berechneAusschnitt({
    ziel: { x: 350, y: 420 },
    vorschau,
    zwischenspeicher: { width: r.breite, height: r.hoehe },
    linseCss: 190,
    linsePixel: 190,
    staerke: 2.5,
  })!;
  const bildpunkteJeAnzeigepixel = a.quelle.width / a.ziel.width;
  assert.ok(bildpunkteJeAnzeigepixel >= 1, `Quelle ${a.quelle.width} Bildpunkte auf ${a.ziel.width} Anzeigepixel`);
  // Zum Vergleich: die 1×-Darstellung hätte nur 76 Bildpunkte auf 190 Anzeigepixel geliefert (verwaschen).
  assert.ok(a.quelle.width > 76);
});

// ── Zwischenspeicher: Auflösung ────────────────────────────────────────

test('Zwischenspeicher: Faktor 3 bezogen auf die logische Leinwand, unabhängig von Bildschirmgröße und Zoom', () => {
  const desktop = berechneSchnappschussPixelRatio({ stageScale: 1, logischeBreite: 700, logischeHoehe: 840 });
  const handy = berechneSchnappschussPixelRatio({ stageScale: 0.25, logischeBreite: 700, logischeHoehe: 840 });
  const zoom250 = berechneSchnappschussPixelRatio({ stageScale: 2.5, logischeBreite: 700, logischeHoehe: 840 });
  for (const r of [desktop, handy, zoom250]) {
    assert.equal(r.faktor, SCHNAPPSCHUSS_FAKTOR);
    assert.equal(r.breite, 2100);
    assert.equal(r.hoehe, 2520);
  }
  // Konva multipliziert pixelRatio mit der aktuellen Stage-Größe → muss gegenläufig zur Skalierung sein.
  assert.equal(desktop.pixelRatio, 3);
  assert.equal(handy.pixelRatio, 12);
  assert.equal(zoom250.pixelRatio, 1.2);
  assert.ok(Math.abs(handy.pixelRatio * 0.25 * 700 - 2100) < 1e-9);
});

test('Zwischenspeicher: Obergrenzen schützen Handys vor zu großen Canvas', () => {
  const gross = berechneSchnappschussPixelRatio({ stageScale: 1, logischeBreite: 2000, logischeHoehe: 2400 });
  assert.ok(gross.breite <= 4096 && gross.hoehe <= 4096, `${gross.breite}×${gross.hoehe}`);
  assert.ok(gross.breite * gross.hoehe <= 12_000_000 * 1.001);
  assert.ok(gross.faktor < 3);
  // Nie unter 1: Dann lieber das Foto in Originalgröße als gar kein Zwischenspeicher.
  const winzig = berechneSchnappschussPixelRatio({ stageScale: 1, logischeBreite: 20000, logischeHoehe: 20000 });
  assert.equal(winzig.faktor, 1);
  // Unsinnige Skalierung (0, NaN) darf nicht zu Unendlich/NaN führen.
  assert.equal(berechneSchnappschussPixelRatio({ stageScale: 0, logischeBreite: 700, logischeHoehe: 840 }).pixelRatio, 3);
  assert.equal(berechneSchnappschussPixelRatio({ stageScale: Number.NaN, logischeBreite: 700, logischeHoehe: 840 }).pixelRatio, 3);
});

// ── Entprellung ────────────────────────────────────────────────────────

test('Entprellung: Auftrag verlangt ca. 150–250 ms', () => {
  assert.ok(SCHNAPPSCHUSS_ENTPRELLUNG_MS >= 150 && SCHNAPPSCHUSS_ENTPRELLUNG_MS <= 250);
});

test('Entprellung: viele Aufrufe kurz hintereinander lösen nur EINEN Lauf aus, ms nach dem letzten Aufruf', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    let laeufe = 0;
    const e = entprelle(() => {
      laeufe += 1;
    }, 200);
    e.aufrufen();
    mock.timers.tick(150);
    e.aufrufen(); // schiebt den Lauf nach hinten
    mock.timers.tick(150);
    assert.equal(laeufe, 0, '300 ms nach dem ersten, aber erst 150 ms nach dem letzten Aufruf');
    assert.equal(e.ausstehend(), true);
    mock.timers.tick(50);
    assert.equal(laeufe, 1);
    assert.equal(e.ausstehend(), false);
    mock.timers.tick(1000);
    assert.equal(laeufe, 1, 'kein zweiter Lauf von selbst');
  } finally {
    mock.timers.reset();
  }
});

test('Entprellung: sofort() läuft gleich und verwirft einen geplanten Lauf; abbrechen() verwirft ohne Lauf', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    let laeufe = 0;
    const e = entprelle(() => {
      laeufe += 1;
    }, 200);
    e.aufrufen();
    e.sofort();
    assert.equal(laeufe, 1);
    mock.timers.tick(500);
    assert.equal(laeufe, 1, 'der geplante Lauf wurde durch sofort() ersetzt');
    e.aufrufen();
    e.abbrechen();
    mock.timers.tick(500);
    assert.equal(laeufe, 1);
  } finally {
    mock.timers.reset();
  }
});

// ── Aufnahme-Schlüssel ─────────────────────────────────────────────────

function logo(patch: Partial<LogoElement> = {}): LogoElement {
  return {
    id: 'l1',
    type: 'logo',
    view: 'front',
    xCm: 5,
    yCm: 6,
    widthCm: 10,
    heightCm: 8,
    rotationDeg: 0,
    isOutOfBounds: false,
    extraPrice: 0,
    estimatedStitches: 0,
    name: 'Logo',
    locked: false,
    hidden: false,
    fileUrl: 'blob:http://x/1',
    fileName: 'logo.png',
    originalWidthPx: 1000,
    originalHeightPx: 800,
    originalFileUrl: 'blob:http://x/1',
    backgroundRemoved: false,
    contentFillRatio: 1,
    ...patch,
  } as LogoElement;
}

function text(patch: Partial<TextElement> = {}): TextElement {
  return {
    id: 't1',
    type: 'text',
    view: 'front',
    xCm: 2,
    yCm: 2,
    widthCm: 12,
    heightCm: 3,
    rotationDeg: 0,
    isOutOfBounds: false,
    extraPrice: 0,
    estimatedStitches: 0,
    name: 'Text',
    locked: false,
    hidden: false,
    content: 'Hallo',
    fontFamily: 'Inter',
    fontSizePx: 24,
    color: '#000000',
    bold: false,
    italic: false,
    align: 'center',
    letterSpacing: 0,
    lineHeight: 1.2,
    hasShadow: false,
    hasOutline: false,
    outlineColor: '#ffffff',
    inkCoverageRatio: 0.4,
    isTemplatePlaceholder: false,
    ...patch,
  } as TextElement;
}

const basisSchluessel: { ansicht: PrintView; produktBildUrl: string; produktBildGeladen: boolean; textilHell: boolean } = {
  ansicht: 'front',
  produktBildUrl: '/products/a/front.jpg',
  produktBildGeladen: true,
  textilHell: true,
};

function schluessel(elemente: ConfigElement[], patch: Partial<typeof basisSchluessel> = {}): string {
  return schnappschussSchluessel({ ...basisSchluessel, ...patch, elemente });
}

test('Aufnahme-Schlüssel: ändert sich bei allem, was im Bild zu sehen ist', () => {
  const ref = schluessel([logo(), text()]);
  assert.notEqual(ref, schluessel([logo({ xCm: 6 }), text()]), 'verschoben');
  assert.notEqual(ref, schluessel([logo({ widthCm: 11 }), text()]), 'Größe');
  assert.notEqual(ref, schluessel([logo({ rotationDeg: 15 }), text()]), 'gedreht');
  assert.notEqual(ref, schluessel([logo({ fileUrl: 'blob:http://x/2' }), text()]), 'anderes Logo (z. B. Hintergrund entfernt)');
  assert.notEqual(ref, schluessel([logo(), text({ content: 'Hallo Welt' })]), 'Text geändert');
  assert.notEqual(ref, schluessel([logo(), text({ color: '#ff0000' })]), 'Textfarbe');
  assert.notEqual(ref, schluessel([logo(), text({ fontFamily: 'Georgia' })]), 'Schriftart');
  assert.notEqual(ref, schluessel([logo(), text({ hasOutline: true })]), 'Umrandung');
  assert.notEqual(ref, schluessel([logo(), text()], { ansicht: 'back' }), 'Ansicht gewechselt');
  assert.notEqual(ref, schluessel([logo(), text()], { produktBildUrl: '/products/a/front-schwarz.jpg' }), 'Produktfarbe (anderes Foto)');
  assert.notEqual(ref, schluessel([logo(), text()], { produktBildGeladen: false }), 'Foto noch nicht geladen');
  assert.notEqual(ref, schluessel([logo(), text()], { textilHell: false }), 'helles/dunkles Textil (Multiply-Vorschau)');
  assert.notEqual(ref, schluessel([logo()]), 'Motiv entfernt');
  assert.notEqual(ref, schluessel([logo(), text({ hidden: true })]), 'Motiv ausgeblendet');
});

test('Aufnahme-Schlüssel: ändert sich NICHT bei Dingen, die nichts am Bild ändern (kein Neuzeichnen beim Anklicken)', () => {
  const ref = schluessel([logo(), text()]);
  assert.equal(ref, schluessel([logo({ isOutOfBounds: true }), text()]), 'Rand-Warnung (roter Rahmen wird aus der Aufnahme entfernt)');
  assert.equal(ref, schluessel([logo({ estimatedStitches: 5000, extraPrice: 12 }), text()]), 'Stichzahl/Preis');
  assert.equal(ref, schluessel([logo({ name: 'Mein Logo' }), text()]), 'Ebenenname');
  // Motive anderer Ansichten betreffen die Vorschau nicht.
  assert.equal(ref, schluessel([logo(), text(), logo({ id: 'r', view: 'back', xCm: 99 })]));
});

test('Aufnahme-Schlüssel: sehr lange Logo-Adressen (data:-URL) halten den Schlüssel klein', () => {
  const lang = 'data:image/png;base64,' + 'A'.repeat(2_000_000);
  const s = schluessel([logo({ fileUrl: lang })]);
  assert.ok(s.length < 2000, `Länge ${s.length}`);
  assert.notEqual(s, schluessel([logo({ fileUrl: lang + 'B' })]), 'andere Länge bleibt unterscheidbar');
});

// ── Motive der Ansicht ─────────────────────────────────────────────────

test('Lupe nur mit sichtbarem Motiv in der aktuellen Ansicht', () => {
  assert.equal(hatSichtbaresMotiv([], 'front'), false);
  assert.equal(hatSichtbaresMotiv([logo()], 'front'), true);
  assert.equal(hatSichtbaresMotiv([logo()], 'back'), false, 'Motiv liegt vorne, Ansicht ist hinten');
  assert.equal(hatSichtbaresMotiv([logo({ hidden: true })], 'front'), false, 'ausgeblendetes Motiv zählt nicht');
  assert.equal(hatSichtbaresMotiv([text()], 'front'), true, 'Text ist auch ein Motiv');
});

test('Startmotiv: das ausgewählte, sonst das erste sichtbare der Ansicht', () => {
  const a = logo({ id: 'a' });
  const b = text({ id: 'b' });
  const c = logo({ id: 'c', view: 'back' });
  assert.equal(waehleStartMotiv([a, b, c], 'front', 'b')?.id, 'b');
  assert.equal(waehleStartMotiv([a, b, c], 'front', null)?.id, 'a');
  assert.equal(waehleStartMotiv([a, b, c], 'front', 'c')?.id, 'a', 'ausgewähltes Motiv liegt in anderer Ansicht');
  assert.equal(waehleStartMotiv([logo({ id: 'x', hidden: true }), b], 'front', 'x')?.id, 'b', 'ausgeblendet zählt nicht');
  assert.equal(waehleStartMotiv([c], 'front', null), null);
});

// ── Tastatur ───────────────────────────────────────────────────────────

test('Pfeiltasten bewegen die Linse, mit Umschalttaste in größeren Schritten', () => {
  assert.deepEqual(tastenSchritt('ArrowLeft', false), { x: -TASTEN_SCHRITT_PX, y: 0 });
  assert.deepEqual(tastenSchritt('ArrowRight', false), { x: TASTEN_SCHRITT_PX, y: 0 });
  assert.deepEqual(tastenSchritt('ArrowUp', false), { x: 0, y: -TASTEN_SCHRITT_PX });
  assert.deepEqual(tastenSchritt('ArrowDown', true), { x: 0, y: TASTEN_SCHRITT_GROSS_PX });
  assert.equal(tastenSchritt('a', false), null);
  assert.equal(tastenSchritt('Enter', false), null);
});

test('Plus/Minus ändern die Vergrößerung', () => {
  assert.equal(tastenStaerkeRichtung('+'), 1);
  assert.equal(tastenStaerkeRichtung('='), 1, 'ohne Umschalttaste auf der deutschen Tastatur');
  assert.equal(tastenStaerkeRichtung('-'), -1);
  assert.equal(tastenStaerkeRichtung('x'), null);
});
