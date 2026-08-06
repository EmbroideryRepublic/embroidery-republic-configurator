/**
 * Erzeugt die Druck-/Stickflächen für ALLE Produkte aus dem hybriden Modell.
 *
 * ── Das Modell in einem Satz ──────────────────────────────────────────
 * Die BILDKONTUR bestimmt, WO im Foto das Kleidungsstück liegt; die
 * verifizierten HERSTELLERMASSE bestimmen, WIE GROSS die Fläche real sein
 * darf; die PROZESSGRENZEN der Veredelung deckeln beides.
 *
 * ── Woher die Zahlen kommen ───────────────────────────────────────────
 * 1. `pxProCm` aus der Bildhöhe des Kleidungsstücks gegen `hoeheCm` der
 *    Größentabelle. Die Höhe ist perspektivisch unverfälscht, deshalb ist
 *    dieser Maßstab ohne Korrekturfaktor gültig.
 * 2. Torsobreite aus `breiteCm` (flach gemessenes Kleidungsstückmaß,
 *    quellenverifiziert) über die Projektion eines liegenden Zylinders:
 *    sichtbarer Durchmesser / halber Umfang = 2/π. Gegen 28 Produkte mit
 *    messbarer Kontur geprüft (gemessen 0,6575 ± 0,042; 2/π = 0,6366 liegt
 *    darunter und ist damit die konservative Wahl).
 * 3. Sicherheitsabstände in ZENTIMETERN, nicht in Prozent — ein Damenshirt
 *    bekommt denselben realen Nahtabstand wie ein Hoodie.
 *
 * ── Ärmel ─────────────────────────────────────────────────────────────
 * Kein Hersteller im Bestand veröffentlicht Ärmelmaße. Für 28 Produkte
 * (T-Shirts, Polos) ist die Oberarmbreite aus der Frontkontur messbar:
 * 10,9 ± 1,6 cm. Für die 15 Langarm-/Kapuzenprodukte liegen die Ärmel am
 * Körper an und sind aus keinem vorhandenen Bild trennbar (drei Verfahren
 * geprüft, siehe docs/recherche-herstellermasse.md, Befund 10). Diese
 * bekommen die KONSERVATIVE Fläche der validierten Gruppe: Mittelwert minus
 * eine Standardabweichung. Da Kapuzenprodukte durchweg WEITERE Ärmel haben
 * als T-Shirts, unterschätzt dieser Wert die reale Fläche — er ist damit
 * produktionsseitig unkritisch.
 *
 * Aufruf: npx tsx --tsconfig tsconfig.scripts.json scripts/generatePrintAreaData.mts
 */
import { existsSync, writeFileSync } from 'node:fs';
import { zeilenProfil } from './analyzeGarmentContour.mjs';

const { PRODUCTS } = await import('../src/config/products/index.ts');
// Bild-Bytes kommen AUSSCHLIESSLICH über die Asset-Schicht (ADR 0004): die
// Produktdefinition trägt keine Pfade mehr. bildFuerAnsicht(productId,colorId,view)
// ist die einzige Auflösungsstelle; Platzhalter werden beim Vermessen übersprungen.
const { bildFuerAnsicht, PLATZHALTER_BILD } = await import('../src/lib/assets/index.ts');
const { waehlbareFarben } = await import('../src/lib/products/farben.ts');
// Geometrie-Rezept je Ansicht kommt aus dem View-Registry (nicht aus hartkodierten
// View-IDs): der Generator KONSUMIERT DECORATION_POSITIONS.geometrieRezept (M4-B1).
const { DECORATION_POSITIONS, sortierePositionen } = await import('../src/config/decorationPositions.ts');
// Ausgabeziel überschreibbar (Reproduktions-/Trockenlauf, schreibt NICHT in src/):
//   PRINTAREA_OUT=/tmp/x.ts npx tsx --tsconfig tsconfig.scripts.json scripts/generatePrintAreaData.mts
const PRINTAREA_OUT = process.env.PRINTAREA_OUT ?? 'src/config/printAreaData.generated.ts';

/** Projektion eines liegenden Zylinders: Durchmesser / halber Umfang. */
const ZYLINDER_PROJEKTION = 2 / Math.PI;

/**
 * KOPFTEIL: Anteil der Bildkontur OBERHALB der Schulterlinie.
 *
 * ── Warum diese Tabelle existiert ─────────────────────────────────────
 * `hoeheCm` der Größentabelle wird ab höchstem Schulterpunkt gemessen, OHNE
 * Kapuze. Die Bildkontur beginnt dagegen an der Kapuzen- bzw. Kragenspitze.
 * Wer beides gleichsetzt, bekommt zwei Fehler zugleich: einen zu großen
 * Maßstab (die Fläche wird zu klein gezeichnet) und einen zu hohen Nullpunkt
 * (die Fläche rutscht auf die Kapuze). Gemessen lagen dadurch die oberen
 * ~85 px der Rückenfläche eines Hoodies AUF der Kapuze.
 *
 * ── Warum eine Tabelle und keine Berechnung ───────────────────────────
 * Ein Kopfteil ist ein Merkmal des SCHNITTS, kein Bildmerkmal: Jeder Hoodie
 * hat eine Kapuze, jede Fleecejacke einen Stehkragen. Drei Verfahren, den
 * Übergang aus der Kontur zu berechnen, sind messbar gescheitert:
 *   - 85 % der Maximalbreite  → 15,7 cm schon beim T-Shirt, weil die
 *     Maximalbreite am Ärmelsaum liegt, nicht an der Schulter.
 *   - Verhältnis zur Torsobreite → bricht bei Langarm/Kapuze (0 cm bzw.
 *     35–41 cm), weil die Ärmel am Körper anliegen und mitgemessen werden.
 *   - Stärkster Breitenzuwachs (Spiegelbild der validierten Achselerkennung)
 *     → Kapuzen liefern 1,3–1,6 cm, erkannt wird die Kapuzenwölbung selbst.
 * Auch der Maßstab aus der Brustbreite scheitert an denselben anliegenden
 * Ärmeln (gemessene „Torsobreite" 521 px gegen 307 px beim T-Shirt).
 *
 * Deshalb wird der Wert je Produkt EINMAL am Bild abgelesen und hier geführt
 * – dasselbe Vorgehen wie bei den Sperrzonen in printAreas.ts, die ebenfalls
 * per Bildausschnitt kalibriert sind. Ablesehilfe: waagerechte Prozentlinien
 * über die Kontur legen und die Schulterlinie ablesen.
 *
 * Ablesung 2026-07-20, Toleranz ±2 % (entspricht ~1,4 cm und liegt damit
 * innerhalb der von textil-grosshandel.eu genannten Fertigungstoleranz von
 * 1,5 cm). Produkte ohne Eintrag haben kein Kopfteil (T-Shirt, Longsleeve,
 * Polo, Rundhals-Sweater) – ihre Flächen bleiben dadurch unverändert.
 */
const KOPFTEIL_ANTEIL: Record<string, number> = {
  // Kapuze
  'justhoods-college-hoodie': 0.13,
  'justhoods-contrast-hoodie': 0.14,
  'justhoods-zoodie': 0.13,
  'bandc-inspire-hoodie': 0.14,
  'bandc-inspire-zip-hood': 0.14,
  'gildan-zip-hoodie': 0.16,
  // Stehkragen
  'sols-north-fleece': 0.1,
  'jn-halfzip-sweat': 0.1,
  'justhoods-quarterzip-sweat': 0.1,
};

/**
 * Kopfteil je Produkt – Handmessung, sonst aus dem SCHNITT abgeleitet.
 *
 * Die Tabelle oben entstand, als nur 43 Produkte eigene Fotos hatten. Seit dem
 * abgeschlossenen Bildimport werden 135 Produkte vermessen; für die neuen
 * Kapuzen- und Stehkragenteile fehlte ein Eintrag, sie galten damit als
 * kopfteilfrei – ihre Druckfläche landete auf der Kapuze.
 *
 * Ein Kopfteil ist ein Merkmal des Schnitts (jeder Hoodie hat eine Kapuze), und
 * die Handmessungen streuen innerhalb einer Schnittgruppe kaum:
 *   Kapuze      0,13 · 0,14 · 0,13 · 0,14 · 0,14 · 0,16  → Mittel 0,14 (σ 0,011)
 *   Stehkragen  0,10 · 0,10 · 0,10                        → 0,10
 * Deshalb erbt ein Produkt ohne eigene Messung den Gruppenwert. Der Versuch, die
 * Schulterlinie automatisch aus der Kontur zu lesen, scheitert weiterhin: die
 * Kapuze selbst verbreitert sich am stärksten, der Wendepunkt liegt zu hoch
 * (gegen alle neun Handmessungen geprüft, Δ bis 0,15).
 */
const KOPFTEIL_KAPUZE = 0.14;
const KOPFTEIL_STEHKRAGEN = 0.1;
/**
 * Polokragen. Aus demselben Grund ein Kopfteil wie Kapuze und Stehkragen:
 * `hoeheCm` der Größentabelle beginnt am höchsten Schulterpunkt, die Bildkontur
 * dagegen an der Kragenspitze. Ohne Abzug rutschte die Fläche in den Kragen und
 * der Maßstab wurde zu klein.
 * Gemessen über alle 26 Polos mit Foto (erste Zeile mit 55 % der Maximalbreite):
 * Median 0,096, Spanne 0,064–0,117.
 */
const KOPFTEIL_POLOKRAGEN = 0.09;

/**
 * Kopfteil aus der KONTUR: erste Zeile, die 55 % der Maximalbreite erreicht.
 *
 * Gegen alle neun Handmessungen geprüft – mittlere Abweichung 0,026 (Handmessung
 * selbst ±0,02). Entscheidend ist, dass dieses Maß das EINZELNE Foto liest: Bei
 * B&C ID.223/ID.333 und Influence steht die Kapuze im Bild AUFRECHT, das Kopfteil
 * misst dort 0,31 statt 0,14. Ein Schnitt-Pauschalwert legte die Druckfläche bei
 * diesen drei mitten auf die Kapuze.
 */
function kopfteilAusKontur(zeilen: { y: number; breite: number }[]): number | null {
  const belegt = zeilen.filter((z) => z.breite > 0);
  if (belegt.length < 10) return null;
  const oben = belegt[0]!.y;
  const unten = belegt[belegt.length - 1]!.y;
  const hoehe = unten - oben;
  if (hoehe <= 0) return null;
  const max = Math.max(...zeilen.map((z) => z.breite));
  const schulter = zeilen.find((z) => z.y > oben && z.breite >= max * 0.55);
  if (!schulter) return null;
  return (schulter.y - oben) / hoehe;
}

function kopfteilVon(
  p: { id: string; productType: string; name: string },
  zeilen?: { y: number; breite: number }[]
): number {
  // 1. Handmessung ist maßgeblich (genauer als jede Ableitung).
  const gemessen = KOPFTEIL_ANTEIL[p.id];
  if (gemessen !== undefined) return gemessen;

  // 2. Sonst aus der eigenen Kontur – passt sich dem konkreten Foto an.
  const ausBild = zeilen ? kopfteilAusKontur(zeilen) : null;

  // 3. Schnitt-Erwartung als Plausibilitätsrahmen. Ein T-Shirt hat kein
  //    Kopfteil; ein Messwert darf dort nicht plötzlich 20 % abschneiden.
  const hatKopfteil =
    p.productType === 'hoodie' ||
    p.productType === 'zip-hoodie' ||
    p.productType === 'jacket' ||
    p.productType === 'polo' ||
    /\b(zip|half.?zip|quarter.?zip|troyer)\b/i.test(p.name);
  if (!hatKopfteil) return 0;

  const erwartet =
    p.productType === 'hoodie' || p.productType === 'zip-hoodie'
      ? KOPFTEIL_KAPUZE
      : p.productType === 'polo'
        ? KOPFTEIL_POLOKRAGEN
        : KOPFTEIL_STEHKRAGEN;
  if (ausBild === null) return erwartet;
  // Messwerte unterhalb der Schnitt-Erwartung wären zu knapp (Fläche liefe in
  // den Kragen); nach oben wird großzügig zugelassen, weil eine aufgestellte
  // Kapuze real mehr Platz braucht.
  return Math.min(0.4, Math.max(erwartet, ausBild));
}

/** Reale Sicherheitsabstände in cm (Veredelungspraxis). */
const ABSTAND = {
  seitennaht: 2.0,
  kragen: 8.0, // ab Oberkante Kleidungsstück – deckt Kragen + Schulterpartie
  saum: 3.0,
  aermelnaht: 1.0,
};

// Prozessgrenzen der Veredelung (cm) leben jetzt im View-Registry
// (decorationPositions.ts, Feld `prozessgrenze`) – die EINZIGE Quelle (M4-B2).
// Sie deckeln die aus dem Kleidungsstück berechnete Fläche (ein DTF-Transfer
// lässt sich nicht beliebig groß produzieren). DTF und Stickerei nutzen bewusst
// dieselben Werte (Mehraufwand der Stickerei über den €/cm²-Satz in pricingRules).

/** Oberarmbreite für Schnitte ohne messbare Ärmelkontur.
 *  Aus den 28 validierten Produkten gemessener MITTELWERT (10,9 cm).
 *
 *  KORREKTUR: Vorher stand hier 9,3 cm (Mittelwert minus eine
 *  Standardabweichung) und davon wurden nochmals 2×1,5 cm Naht abgezogen –
 *  übrig blieben 6,3 cm nutzbare Breite. Das war doppelt konservativ und
 *  lag deutlich unter jeder realen Ärmelveredelung. Mit dem Mittelwert und
 *  1,0 cm Naht je Seite ergeben sich 8,9 cm, was der Zielvorgabe des
 *  Auftraggebers (8–11 cm) entspricht. */
const AERMEL_KONSERVATIV_CM = 10.9;

/** Nutzbares Oberarm-Band, als Anteil der Kleidungsstückhöhe ab Oberkante.
 *
 *  Ein kurzer Ärmel reicht ab Schulternaht rund 20 cm hinunter (~28 % eines
 *  71-cm-Oberteils). Das Band lässt oben die Armkugelnaht und unten den
 *  Ärmelabschluss frei; die Fläche wird darin zentriert. Bei Langarmware
 *  liegt der Oberarm im selben Bereich – der Ärmel ist länger, die
 *  veredelbare Zone bleibt dieselbe. */
const AERMEL_BAND_VON = 0.08;
const AERMEL_BAND_BIS = 0.26;

// Zu erzeugende Ansichten DATENGETRIEBEN aus dem Katalog (M4): genau die von
// Produkten geführten Ansichten, in Registry-Reihenfolge – nicht mehr die
// hartkodierte Kleidungsliste ['front','back','sleeve_left','sleeve_right'].
// Neue Ansichten (Tasche, Cap …) fließen automatisch ein; ihre Geometrie steuert
// das Rezept (fail-loud bis implementiert). Für den heutigen Katalog identisch zur
// alten Liste (per Reproduktionsnachweis bestätigt).
const VIEWS = sortierePositionen([...new Set(PRODUCTS.flatMap((p) => p.views ?? []))]);
type View = string;

/**
 * MANUELLE KORREKTUR des Bewegungsbereichs, je Produkt und Ansicht.
 *
 * ── Warum von Hand ────────────────────────────────────────────────────
 * Die berechnete Fläche folgt Größentabelle und Prozessgrenze. Sie ist damit
 * fertigungstechnisch richtig, nutzt die sichtbare Stofffläche aber nicht aus:
 * Bei den meisten Schnitten blieb unterhalb der Fläche ein Streifen von 10–16 %
 * der Bildhöhe ungenutzt, obwohl dort Stoff ist.
 *
 * Eine Formel hilft hier nicht weiter, weil jeder Schnitt anders endet:
 * Rundhals, V-Ausschnitt, Polo mit Knopfleiste, Raglan, Hoodie mit Bund,
 * Zip-Hoodie mit durchgehendem Reißverschluss. Die Werte sind deshalb je
 * Produkt am Foto abgelesen (Rasterhilfe: scripts/qaRaster.mts) und hier
 * eingetragen – dasselbe Vorgehen wie bei den Sperrzonen in printAreas.ts.
 *
 * Prozent des GESAMTEN Bildes, identisch zu x0/y0/x1/y1 der erzeugten Daten.
 * Nur die angegebenen Kanten werden ersetzt, der Rest bleibt berechnet.
 * Die MOTIVGRENZE (maxWidthCm/maxHeightCm) bleibt unberührt – hier wächst
 * ausschließlich der Bereich, in dem verschoben werden darf.
 *
 * Abgelesen 2026-07-20 an der jeweils ersten Farbvariante.
 */
const BEREICH_KORREKTUR: Record<string, { x0?: number; y0?: number; x1?: number; y1?: number }> = {
  // Alle Werte je Produkt am Foto abgelesen (Rasterhilfe scripts/qaRaster.mts)
  // und einzeln visuell abgenommen. Sie bilden die UNTERGRENZE: Der Generator
  // darf die Flaeche anschliessend noch vergroessern (groesstmoegliches
  // Rechteck auf dem Rumpf), niemals verkleinern.

  // ── Stedman Classic-T for Women: Saum beginnt früher sichtbar als bei den
  // übrigen 29 Farben ──────────────────────────────────────────────────
  // Bei Weiß ist der Saumbogen schon ab y≈73 % als Falte erkennbar (geringer
  // Kontrast zu den anderen Farben, wo er erst ab y≈83 % einschnürt). Die
  // Schnittmenge über alle Farben lässt den Wert deshalb rechnerisch bis
  // y1=82,2 % zu, während Weiß dort schon 9 % über die Kante ragt. y1 auf 76 %
  // gekappt – geprüft: Weiß misst dort einzeln noch links 30,8 %/rechts 64,7 %,
  // die Fläche (33,8/65,2) bleibt mit Sicherheitsabstand innerhalb.
  'stedman-classic-t-for-women-back': { y1: 76 },

  // ── Raglan mit Kontrastaermeln ───────────────────────────────────────
  // Die Rumpfkante ist hier keine Silhouettenkante, sondern eine FARBGRENZE
  // (weisser Rumpf, navy Aermel). Die Silhouettenmessung sieht beides als
  // Stoff und wuerde die Flaeche ueber die Raglannaht auf die Aermel legen.
  // Breite 35-65 ist durch die Raglannähte begrenzt: Oben (y32) laufen die
  // diagonalen Nähte bei ~x34/66, breiter läge die Fläche auf den Kontrast-
  // ärmeln. Der Gewinn ist deshalb nur vertikal – der weiße Rumpf läuft
  // gerade bis y88, die Unterkante geht auf y86.
  'fotl-baseball-t-front': { x0: 35, x1: 65, y0: 32, y1: 86 },
  'fotl-baseball-t-back': { x0: 35, x1: 65, y0: 32, y1: 86 },
  'fotl-baseball-longsleeve-front': { x0: 35, x1: 65, y0: 32, y1: 86 },
  'fotl-baseball-longsleeve-back': { x0: 35, x1: 65, y0: 32, y1: 86 },

  // ── Herren Rundhals (gerader Schnitt) ────────────────────────────────
  // Der Rumpf behält bis y88-90 die volle Breite (zeilenweise geprüft), die
  // Fläche wird deshalb bis y86 nach unten gezogen – darunter bleibt der Saum
  // frei, oben lässt y0 den Kragen frei.
  //
  // KEINE x-Übersteuerung bei den vielfarbigen FOTL-Shirts: Deren Farben sind
  // trotz Normalisierung unterschiedlich gerahmt (Azure z.B. schmaler). Eine
  // fest breitere Box ragte bei einzelnen Farben unten seitlich über den Stoff
  // (Azure-Front nur 93 % Stoffdeckung). Die berechnete Breite kommt aus der
  // SCHNITTMENGE aller Farben und liegt damit in JEDER Variante auf Stoff.
  'fotl-heavy-t-front': { y0: 19, y1: 86 },
  'fotl-heavy-t-back': { y0: 19, y1: 86 },
  'fotl-iconic195-t-front': { y0: 20, y1: 86 },
  'fotl-iconic195-t-back': { y0: 20, y1: 86 },
  'fotl-original-t-front': { y0: 20, y1: 86 },
  'fotl-original-t-back': { y0: 20, y1: 86 },
  'fotl-super-premium-t-front': { y0: 20, y1: 86 },
  'fotl-super-premium-t-back': { y0: 20, y1: 86 },
  'fotl-valueweight-t-front': { y0: 20, y1: 86 },
  'fotl-valueweight-t-back': { y0: 20, y1: 86 },
  'fotl-original-longsleeve-front': { y0: 20, y1: 86 },
  'fotl-original-longsleeve-back': { y0: 20, y1: 86 },
  'jn-active-t-front': { y0: 19, y1: 86 },
  'jn-active-t-back': { y0: 19, y1: 86 },
  // Iconic195-Longsleeve: die Ärmel hängen unten NEBEN dem Rumpf ins Bild –
  // deshalb Breite und Unterkante bewusst konservativ (keine Silhouetten-
  // erweiterung, sonst läge die Fläche auf einem Ärmel).
  'fotl-iconic195-longsleeve-front': { x0: 31, x1: 69, y0: 20, y1: 82 },
  'fotl-iconic195-longsleeve-back': { x0: 31, x1: 69, y0: 20, y1: 82 },

  // ── Taillierte Damenschnitte: Rumpf laeuft zum Saum EIN ──────────────
  'fotl-ladies-iconic195-t-front': { x0: 34, x1: 66, y0: 19, y1: 80 },
  'fotl-ladies-iconic195-t-back': { x0: 34, x1: 66, y0: 19, y1: 80 },
  'fotl-ladies-original-t-front': { x0: 32, x1: 68, y0: 20, y1: 80 },
  'fotl-ladies-original-t-back': { x0: 32, x1: 68, y0: 20, y1: 80 },
  'fotl-ladies-valueweight-t-front': { x0: 33, x1: 67, y0: 20, y1: 80 },
  'fotl-ladies-valueweight-t-back': { x0: 33, x1: 67, y0: 20, y1: 80 },
  'fotl-ladies-premium-polo-front': { x0: 32, x1: 68, y1: 82 },
  'fotl-ladies-premium-polo-back': { x0: 32, x1: 68, y1: 82 },
  'gildan-ladies-t-front': { x0: 31, x1: 69, y1: 79 },
  'gildan-ladies-t-back': { x0: 31, x1: 69, y1: 79 },
  'gildan-ladies-heavy-t-front': { x0: 30, x1: 70, y1: 79 },
  'gildan-ladies-heavy-t-back': { x0: 30, x1: 70, y1: 79 },
  'gildan-ladies-polo-front': { x0: 30, x1: 69, y1: 82 },
  'gildan-ladies-polo-back': { x0: 30, x1: 69, y1: 82 },
  'russell-ladies-authentic-t-front': { x0: 31, x1: 69, y1: 79 },
  'russell-ladies-authentic-t-back': { x0: 31, x1: 69, y1: 79 },

  // ── V-Ausschnitte: Oberkante MUSS unter die V-Spitze ─────────────────
  // Ein Halsausschnitt ist in der Silhouette KEIN Loch (das Foto zeigt dort
  // die Innenseite des Rueckenteils) und deshalb nicht messbar.
  // V-Spitzen: gildan-vneck-t y22, gildan-ladies-vneck-t y28,
  // fotl-ladies-valueweight-vneck y30, fotl-original-vneck y23,
  // fotl-valueweight-vneck y20.
  // Herren-V-Necks: gerader Schnitt wie die Rundhals-Herren → bis y86 nach
  // unten. Oben Abstand zur V-Spitze (gildan y22, original y23, value y20).
  // gildan (konsistente Rahmung) zusätzlich etwas breiter; FOTL bleibt bei der
  // berechneten Schnittmengen-Breite (Farbrahmung variiert).
  'gildan-vneck-t-front': { x0: 28, x1: 72, y0: 25, y1: 86 },
  'gildan-vneck-t-back': { x0: 28, x1: 72, y1: 86 },
  'fotl-original-vneck-front': { y0: 27, y1: 86 },
  'fotl-original-vneck-back': { y1: 86 },
  'fotl-valueweight-vneck-front': { y0: 24, y1: 86 },
  'fotl-valueweight-vneck-back': { y1: 86 },
  // Damen-V-Necks: tailliert → moderat, Unterkante y82.
  'gildan-ladies-vneck-t-front': { y0: 31, y1: 82 },
  'gildan-ladies-vneck-t-back': { y1: 82 },
  'fotl-ladies-valueweight-vneck-front': { y0: 34, y1: 82 },
  'fotl-ladies-valueweight-vneck-back': { y1: 82 },

  // ── Weitere Herren Rundhals (gerader Schnitt, bis y86) ───────────────
  'fotl-pure-cotton-t-front': { x0: 28, x1: 70, y1: 86 },
  'fotl-pure-cotton-t-back': { x0: 28, x1: 70, y1: 86 },
  'sols-imperial-t-front': { x0: 26, x1: 74, y1: 86 },
  'sols-imperial-t-back': { x0: 26, x1: 74, y1: 86 },
  'gildan-heavy-t-front': { x0: 28, x1: 72, y1: 86 },
  'gildan-heavy-t-back': { x0: 28, x1: 72, y1: 86 },
  'russell-workwear-t-front': { x0: 26, x1: 74, y1: 86 },
  'russell-workwear-t-back': { x0: 26, x1: 74, y1: 86 },
  'russell-authentic-t-front': { x0: 27, x1: 73, y1: 86 },
  'russell-authentic-t-back': { x0: 27, x1: 73, y1: 86 },
  'neutral-rollsleeve-t-front': { x0: 28, x1: 73, y1: 86 },
  'neutral-rollsleeve-t-back': { x0: 28, x1: 73, y1: 86 },
  'stedman-slimfit-t-front': { x0: 27, x1: 73, y1: 86 },
  'stedman-slimfit-t-back': { x0: 27, x1: 73, y1: 86 },
  // Rundhals-SWEATER: unten läuft ein Ripp-Bündchen – Unterkante bleibt
  // darüber (y83), Bündchen wird nicht bedruckt.
  'justhoods-awdis-sweat-front': { x0: 28, x1: 72, y1: 83 },
  'justhoods-awdis-sweat-back': { x0: 28, x1: 72, y1: 83 },
  // ── Herren-Polos: gerader Rumpf, Knopfleiste über Sperrzone frei ─────
  // Bis y86 nach unten (plane Kante mit Seitenschlitzen). FOTL bei
  // berechneter Breite (Farbrahmung variiert), Gildan/Neutral etwas breiter.
  'fotl-premium-polo-front': { y1: 86 },
  'fotl-premium-polo-back': { y1: 86 },
  'gildan-softstyle-polo-front': { x0: 28, x1: 72, y1: 86 },
  'gildan-softstyle-polo-back': { x0: 28, x1: 72, y1: 86 },
  'neutral-classic-polo-front': { x0: 28, x1: 73, y1: 86 },
  'neutral-classic-polo-back': { x0: 28, x1: 73, y1: 86 },
  // Sweatshirts mit kurzem Kragen-Zip (kein Kängurutasche): Zip oben über
  // Sperrzone frei, Rumpf gerade → etwas breiter, Unterkante über Bündchen.
  'jn-halfzip-sweat-front': { x0: 28, x1: 72, y1: 80 },
  'jn-halfzip-sweat-back': { x0: 28, x1: 72, y1: 80 },
  'justhoods-quarterzip-sweat-front': { x0: 28, x1: 72, y1: 80 },
  'justhoods-quarterzip-sweat-back': { x0: 28, x1: 72, y1: 80 },
  'sols-north-fleece-front': { y1: 80 },
  'sols-north-fleece-back': { y1: 80 },

  // ── Kapuzenware ──────────────────────────────────────────────────────
  // Breite je Produkt gemessen (Spalt Rumpf/Aermel, s.o.).
  //
  // WICHTIG Vorderseite vs. Rückseite: Alle diese Schnitte haben vorne eine
  // Känguru- bzw. Zip-Tasche, deren Öffnung bei y58-62 beginnt. Ein Motiv
  // darf nicht auf der Tasche liegen, deshalb endet die VORDERseite bei y58.
  // Die RÜCKseite hat keine Tasche und nutzt den vollen Rumpf bis zum
  // Bündchen (y80/81). Zip-Hoodies halten zusätzlich den Reißverschluss über
  // die bestehende Sperrzone frei.
  'gildan-zip-hoodie-front': { x0: 27, x1: 73, y1: 58 },
  'gildan-zip-hoodie-back': { x0: 27, x1: 73, y1: 80 },
  'justhoods-college-hoodie-front': { y1: 58 },
  'justhoods-college-hoodie-back': { y1: 81 },
  // Zoodie hat den breitesten Rumpf im Bestand (17,7-83,1) – hier blieben
  // seitlich 5-6 Pp ungenutzt.
  'justhoods-zoodie-front': { x0: 21, x1: 79, y1: 58 },
  'justhoods-zoodie-back': { x0: 21, x1: 79, y1: 81 },
  'justhoods-contrast-hoodie-front': { x0: 27, x1: 73, y1: 58 },
  'justhoods-contrast-hoodie-back': { x0: 27, x1: 73, y1: 81 },
  'bandc-inspire-hoodie-front': { x0: 31, x1: 69, y1: 58 },
  'bandc-inspire-hoodie-back': { x0: 31, x1: 69, y1: 80 },
  'bandc-inspire-zip-hood-front': { x0: 30, x1: 71, y1: 58 },
  'bandc-inspire-zip-hood-back': { x0: 30, x1: 71, y1: 80 },
};

/**
 * Oberhalb dieses Verhältnisses Tiefe/Breite ist eine „Seitenansicht" keine
 * Ganzansicht, sondern eine NAHAUFNAHME.
 *
 * Eine echte Seitenansicht zeigt die Tiefe des Kleidungsstücks und ist damit
 * deutlich schmaler als die Vorderansicht. Gemessen über die Produkte mit
 * sauberer Ganzansicht: Longsleeve 0,409 ± 0,026, Zip-Hoodie 0,455 ± 0,005,
 * Hoodie 0,471 ± 0,018, Sweater 0,479 – also durchweg 0,37…0,48.
 *
 * Die Nahaufnahmen liefern dagegen 0,95…1,14. Ein T-Shirt, das so tief wie
 * breit ist, gibt es nicht; der Wert misst die Vergrößerung, nicht das
 * Kleidungsstück. 0,60 trennt beide Gruppen mit großem Abstand.
 */
const NAHAUFNAHME_AB = 0.6;

/**
 * Existierender Dateipfad zu einem bereits aufgelösten Browser-Bild-URL.
 *
 * Die URL kommt jetzt AUSSCHLIESSLICH aus der Asset-Schicht (`bildFuerAnsicht`),
 * nicht mehr aus der Produktdefinition (ADR 0004: `colors` tragen keine Pfade
 * mehr). Platzhalter werden übersprungen – nur echte Fotos werden vermessen,
 * damit bildlose Produkte (Bildimport offen) KEINE Geometrie erhalten (sie
 * erben sie per Klassen-Alias, printAreaAlias.generated.ts).
 * '/products/x/front.webp' → 'public/products/x/front.{png,webp}'.
 */
function urlZuDateipfad(url: string | undefined | null): string | null {
  if (!url || url === PLATZHALTER_BILD) return null;
  const basis = `public${url}`.replace(/\.(webp|png)$/, '');
  for (const e of ['png', 'webp']) {
    if (existsSync(`${basis}.${e}`)) return `${basis}.${e}`;
  }
  return null;
}


interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  imgW: number;
  imgH: number;
  maxWidthCm: number;
  maxHeightCm: number;
  boxWidthCm: number;
  boxHeightCm: number;
  startXCm?: number;
  startYCm?: number;
  garmentWidthCm: number;
  garmentHeightCm: number;
  quelle: string;
}

const ergebnis: Record<string, Partial<Record<View, Box>>> = {};
const protokoll: string[] = [];
const kopfteilProtokoll: string[] = [];
let ohneBild = 0;

// ── Vorlauf: Verhältnis Tiefe/Breite je Produkt bestimmen ───────────────
//
// Wozu: Ein Teil der Ärmelansichten sind Nahaufnahmen, bei denen das
// Kleidungsstück aus dem Bild läuft. Dort ist die sichtbare Höhe NICHT die
// Körperlänge, der Maßstab px/cm also um den unbekannten Vergrößerungsfaktor
// falsch – gemessen wurde die Ärmelfläche dadurch rund 2,4-fach zu klein
// gezeichnet und saß zu hoch.
//
// Der Faktor ist bestimmbar, ohne ihn zu raten: Die Produkte MIT sauberer
// Ganzansicht liefern das echte Verhältnis Tiefe/Breite ihres Schnitts. Weicht
// eine Aufnahme davon nach oben ab, ist die Abweichung die Vergrößerung.
// Dasselbe Vorgehen wie beim bereits validierten Torsofaktor: eine an der
// Population gemessene Konstante, angewandt auf Mitglieder dieser Population.
async function maxBreiteCm(url: string | undefined, hoeheCm: number): Promise<number | null> {
  if (!url) return null;
  const pf = urlZuDateipfad(url);
  if (!pf) return null;
  const { zeilen } = await zeilenProfil(pf);
  const bel = zeilen.filter((z) => z.breite > 0);
  if (bel.length === 0) return null;
  const hoehePx = bel[bel.length - 1]!.y - bel[0]!.y + 1;
  return Math.max(...zeilen.map((z) => z.breite)) / (hoehePx / hoeheCm);
}

const verhaeltnisse = new Map<string, number>();
/** Ärmellänge Schulter→Achsel in cm, aus der FRONTANSICHT gemessen. */
const aermelLaengeCm = new Map<string, number>();

for (const p of PRODUCTS) {
  // Nur Produkte mit Ärmel-Ansichten (datengetrieben aus views, kein hasSleeves).
  if (!p.views?.some((v) => v === 'sleeve_left' || v === 'sleeve_right')) continue;
  const mass = p.sizeGuide?.measurements?.find((x) => x.size === 'M') ?? p.sizeGuide?.measurements?.[0];
  if (!mass) continue;
  const c0 = waehlbareFarben(p.id, p.colors)[0]?.id;
  const breite = await maxBreiteCm(c0 ? bildFuerAnsicht(p.id, c0, 'front') : undefined, mass.hoeheCm);
  const tiefe = await maxBreiteCm(c0 ? bildFuerAnsicht(p.id, c0, 'sleeve_left') : undefined, mass.hoeheCm);
  if (breite && tiefe) verhaeltnisse.set(p.id, tiefe / breite);

  // ── Ärmellänge über die validierte Achselerkennung ──────────────────
  // Verfahren unverändert aus scripts/deriveSleeveGeometry.mts übernommen
  // (stärkster Breitenrückgang = Achsel). Es liefert den Bezugspunkt, den
  // die bisherige Bandregel nicht hatte: Ohne ihn war das Band ein Anteil
  // der KLEIDUNGSSTÜCKHÖHE und landete auf der Schulter statt auf dem
  // Oberarm – genau der zuerst gemeldete Fehler.
  const fp = urlZuDateipfad(c0 ? bildFuerAnsicht(p.id, c0, 'front') : undefined);
  if (!fp) continue;
  const { zeilen: fz } = await zeilenProfil(fp);
  const fbel = fz.filter((z) => z.breite > 0);
  if (fbel.length === 0) continue;
  const fO = fbel[0]!.y;
  const fU = fbel[fbel.length - 1]!.y;
  const fH = fU - fO + 1;
  const fPxCm = fH / mass.hoeheCm;

  let yMax = fO;
  let maxB = 0;
  for (let y = fO; y <= fO + Math.round(fH * 0.6); y++) {
    if (fz[y]!.breite > maxB) { maxB = fz[y]!.breite; yMax = y; }
  }
  const suchEnde = fO + Math.round(fH * 0.65);
  const fenster = Math.max(3, Math.round(fH * 0.02));
  let besterAbfall = 0;
  let yAchsel: number | null = null;
  for (let y = yMax; y + fenster <= suchEnde; y++) {
    const abfall = fz[y]!.breite - fz[y + fenster]!.breite;
    if (abfall > besterAbfall) { besterAbfall = abfall; yAchsel = y + fenster; }
  }
  if (yAchsel !== null && besterAbfall >= maxB * 0.15) {
    aermelLaengeCm.set(p.id, (yAchsel - fO) / fPxCm);
  }
}

/** Echtes Verhältnis je Schnittgruppe, Median über die sauberen Ganzansichten. */
const echtesVerhaeltnis = new Map<string, number>();
{
  const proGruppe = new Map<string, number[]>();
  for (const p of PRODUCTS) {
    const v = verhaeltnisse.get(p.id);
    if (v === undefined || v >= NAHAUFNAHME_AB) continue;
    if (!proGruppe.has(p.productType)) proGruppe.set(p.productType, []);
    proGruppe.get(p.productType)!.push(v);
  }
  const alleSauberen = [...proGruppe.values()].flat().sort((a, b) => a - b);
  const gesamtMedian = alleSauberen[Math.floor(alleSauberen.length / 2)] ?? 0.44;
  for (const [typ, xs] of proGruppe) {
    const s = [...xs].sort((a, b) => a - b);
    echtesVerhaeltnis.set(typ, s[Math.floor(s.length / 2)]!);
  }
  // Schnittgruppen ohne einzige saubere Ganzansicht (im Bestand: Polo) nutzen
  // den Gesamtmedian. Das ist die einzige Stelle mit einer Übertragung über
  // Schnittgruppen hinweg und im Protokoll ausgewiesen.
  for (const p of PRODUCTS) {
    if (!echtesVerhaeltnis.has(p.productType)) {
      echtesVerhaeltnis.set(p.productType, gesamtMedian);
      protokoll.push(`${p.productType}: keine saubere Ärmel-Ganzansicht – Gesamtmedian ${gesamtMedian.toFixed(3)} übernommen`);
    }
  }
}

const { GEOMETRY_ALIAS } = await import('../src/config/printAreaAlias.generated.ts');
/** Maßtabelle des Klassenvertreters (gleicher Produkttyp) als Rückfallebene. */
function massVon(p: (typeof PRODUCTS)[number]) {
  const eigen = p.sizeGuide?.measurements?.find((x) => x.size === 'M') ?? p.sizeGuide?.measurements?.[0];
  if (eigen) return { mass: eigen, geliehenVon: null as string | null };
  // Ohne eigene Maße wurde das Produkt bisher übersprungen und erbte die
  // Druckfläche des Klassenvertreters 1:1 – also dessen BILDrelative Koordinaten.
  // Da die Fotos unterschiedlich beschnitten sind, saß die Fläche dann falsch
  // (Box im Kragen). Mit geliehener Maßtabelle wird stattdessen die EIGENE
  // Bildkontur vermessen; nur die cm-Referenz stammt aus derselben Schnittgruppe.
  const rep = GEOMETRY_ALIAS[p.id];
  const repProd = rep ? PRODUCTS.find((x) => x.id === rep) : undefined;
  const geliehen = repProd?.sizeGuide?.measurements?.find((x) => x.size === 'M')
    ?? repProd?.sizeGuide?.measurements?.[0];
  return { mass: geliehen, geliehenVon: geliehen ? (rep ?? null) : null };
}

for (const p of PRODUCTS) {
  const { mass, geliehenVon } = massVon(p);
  if (!mass) {
    protokoll.push(`${p.id}: keine Maßtabelle (auch nicht beim Klassenvertreter) – übersprungen`);
    continue;
  }
  if (geliehenVon) protokoll.push(`${p.id}: Maßtabelle von ${geliehenVon} geliehen, Kontur eigenständig vermessen`);

  const proProdukt: Partial<Record<View, Box>> = {};

  // Frontkontur merken: Ohne eigenes Rückenfoto liefert sie die Silhouette für
  // die Rückseite. Vorder- und Rückansicht eines Kleidungsstücks haben denselben
  // Umriss – anders als beim Ärmel ist das keine Näherung, sondern dieselbe Form.
  // (Früher fiel das nicht auf, weil das Manifest fehlende Ansichten auf das
  // Vorderbild aliaste; ohne dieses Alias hätten Produkte ohne Rückenfoto gar
  // keine Rückenfläche mehr – Rückendruck ist aber ein Kernangebot.)
  let frontProfile: { w: number; h: number; zeilen: Awaited<ReturnType<typeof zeilenProfil>>['zeilen'] }[] = [];

  for (const view of VIEWS) {
    // Nur die vom Produkt tatsächlich geführten Ansichten erzeugen
    // (datengetrieben aus views – generisch auch für Nicht-Kleidung).
    if (!(p.views ?? []).includes(view)) continue;

    // ── Kontur über ALLE Farbvarianten schneiden ────────────────────────
    // Frühere Fassung nahm EIN Bild je Produkt (die erste Farbe) und wandte
    // die Fläche auf alle Varianten an. Bei Fruit of the Loom ist jede Farbe
    // einzeln fotografiert und anders gerahmt – gemessen bei
    // fotl-valueweight-t: linke Kante zwischen 26,6 % und 35,0 %. Die Fläche
    // passte zur Referenzfarbe und ragte bei allen anderen über die
    // Stoffkante hinaus.
    //
    // Statt das Datenmodell auf Flächen je Farbe aufzublähen, wird hier die
    // SCHNITTMENGE gebildet: die Fläche liegt auf Stoff, der in JEDER
    // Variante vorhanden ist. Eine Fläche je Produkt bleibt damit korrekt.
    // Nur die WÄHLBAREN Farben vermessen. Eine ausgeblendete Farbe steht zwar
    // noch in der Palette, wird dem Kunden aber nie gezeigt – ihre Aufnahme in
    // die Schnittmenge verengt und verschiebt die Fläche für alle anderen.
    // Gemessen beim Gildan Light Cotton: dort ist genau eine Farbe ausgeblendet
    // (nur On-Model beschaffbar), und deren Menschen-Silhouette zog die Fläche
    // schmal und aus der Mitte – im Kontaktbogen deutlich sichtbar.
    const alleProfile: { w: number; h: number; zeilen: Awaited<ReturnType<typeof zeilenProfil>>['zeilen'] }[] = [];
    for (const c of waehlbareFarben(p.id, p.colors)) {
      const pf = urlZuDateipfad(bildFuerAnsicht(p.id, c.id, view));
      if (!pf) continue;
      const prof = await zeilenProfil(pf);
      if (prof.zeilen.some((z) => z.breite > 0)) alleProfile.push(prof);
    }

    // Angeschnittene Aufnahmen aus der Schnittmenge nehmen.
    //
    // Läuft das Kleidungsstück aus dem Bild, ist seine wahre Ausdehnung
    // unbekannt; seine „Kante" ist in Wirklichkeit die Bildkante. In der
    // Schnittmenge zieht so ein Bild eine Seite einseitig herein und
    // verschiebt die geklemmte Fläche aus der Mitte – gemessen bei
    // fotl-ladies-iconic195-t 1,9 % Versatz in ALLEN Farben, obwohl die
    // Varianten nach der Normalisierung deckungsgleich liegen.
    const nichtAngeschnitten = alleProfile.filter((prof) => {
      const bel = prof.zeilen.filter((z) => z.breite > 0);
      if (bel.length === 0) return false;
      const randZeilen = bel.filter((z) => z.links <= 1 || z.rechts >= prof.w - 2).length;
      return bel[0]!.y > 1 && bel[bel.length - 1]!.y < prof.h - 2 && randZeilen <= bel.length * 0.02;
    });

    // Sind ALLE Aufnahmen angeschnitten (Ärmel-Nahaufnahmen), bleibt nur der
    // vorhandene Bestand – eine Fläche aus nichts ist keine Verbesserung.
    let profile = nichtAngeschnitten.length > 0 ? nichtAngeschnitten : alleProfile;
    if (view === 'front') frontProfile = profile;
    // Rückseite ohne eigenes Foto: Umriss der Vorderansicht verwenden.
    if (view === 'back' && profile.length === 0 && frontProfile.length > 0) {
      profile = frontProfile;
      protokoll.push(`${p.id}/back: kein Rückenfoto – Umriss der Vorderansicht verwendet`);
    }
    if (nichtAngeschnitten.length < alleProfile.length) {
      protokoll.push(
        `${p.id}/${view}: ${alleProfile.length - nichtAngeschnitten.length} von ${alleProfile.length} Aufnahmen angeschnitten` +
          (nichtAngeschnitten.length === 0 ? ' – ALLE, Fläche bleibt unsicher' : ' – aus der Schnittmenge genommen')
      );
    }
    if (profile.length === 0) {
      protokoll.push(`${p.id}/${view}: kein Bild`);
      ohneBild++;
      continue;
    }

    // Bezugsraster ist das erste Bild; alle Kanten werden in Prozent
    // verglichen und auf dessen Pixelmaße zurückgerechnet.
    const { w, h } = profile[0]!;
    const zeilen = profile[0]!.zeilen;
    const belegt = zeilen.filter((z) => z.breite > 0);

    // Engste Kante über alle Varianten (in Prozent der Bildbreite).
    let engsteLinks = 0;
    let engsteRechts = 100;
    let untersteOben = 0;
    let obersteUnten = 100;
    let silhouetteLinks = 0;
    let silhouetteRechts = 100;
    const variantenMitten: number[] = [];
    for (const prof of profile) {
      const bel = prof.zeilen.filter((z) => z.breite > 0);
      if (bel.length === 0) continue;
      const o = bel[0]!.y;
      const u = bel[bel.length - 1]!.y;
      const torso = prof.zeilen.slice(o + Math.round((u - o) * 0.6), u - 10).filter((z) => z.breite > 0);
      if (torso.length === 0) continue;
      const l = (torso.reduce((sm, z) => sm + z.links, 0) / torso.length / prof.w) * 100;
      const r = (torso.reduce((sm, z) => sm + z.rechts, 0) / torso.length / prof.w) * 100;
      engsteLinks = Math.max(engsteLinks, l);
      engsteRechts = Math.min(engsteRechts, r);
      untersteOben = Math.max(untersteOben, (o / prof.h) * 100);
      obersteUnten = Math.min(obersteUnten, (u / prof.h) * 100);
      variantenMitten.push((l + r) / 2);

      // Gesamte Silhouette (nicht nur der Torsostreifen) – Grundlage für den
      // großen Bewegungsbereich der Ärmelansicht.
      const silhLinks = (Math.min(...bel.map((z) => z.links)) / prof.w) * 100;
      const silhRechts = (Math.max(...bel.map((z) => z.rechts)) / prof.w) * 100;
      silhouetteLinks = Math.max(silhouetteLinks, silhLinks);
      silhouetteRechts = Math.min(silhouetteRechts, silhRechts);
    }

    // Waagerechte Mitte = MEDIAN der Kleidungsstückmitten aller Farbvarianten.
    //
    // Nicht die Mitte der Schnittmenge: Bei Fruit of the Loom ist jede Farbe
    // einzeln fotografiert und anders gerahmt (linke Kante zwischen 26,6 % und
    // 35,0 %). Die Schnittmenge ist dadurch einseitig beschnitten, ihre Mitte
    // liegt neben der Kleidungsstückmitte – gemessen bei fotl-valueweight-t
    // 34 px zu weit rechts, im Bild deutlich sichtbar. Der Median trifft die
    // Mitte in jeder Variante bestmöglich; die Schnittmenge begrenzt weiterhin
    // die BREITE, damit die Fläche in keiner Variante über den Stoff ragt.
    const sortierteMitten = [...variantenMitten].sort((a, b) => a - b);
    const medianMitteProzent =
      sortierteMitten.length > 0
        ? sortierteMitten[Math.floor(sortierteMitten.length / 2)]!
        : (engsteLinks + engsteRechts) / 2;

    const yOben = Math.round((untersteOben / 100) * h);
    const yUnten = Math.round((obersteUnten / 100) * h);
    const konturHoehePx = yUnten - yOben + 1;

    // ── Geometrie-Rezept DATENGETRIEBEN (M4-B1) ──────────────────────────
    // Statt hartkodierter View-IDs (`view === 'sleeve_*'`) bestimmt jetzt das
    // Registry-Feld `geometrieRezept` die Geometrie-Behandlung. Die zwei heute
    // real genutzten Rezepte werden byte-identisch reproduziert; weitere
    // (`flachteil` für Tasche/Schürze/Handtuch/Decke, `wickelflaeche` für Cap)
    // sind additiv – bis zu ihrer Implementierung fail-loud, damit eine neue
    // Ansicht NICHT still im Torso-Pfad landet und falsch vermessen wird. Die
    // eigene Strategie je Rezept folgt kalibriert mit dem ersten realen
    // Nicht-Kleidungsprodukt (kein Raten ohne echte Kontur).
    const rezept = DECORATION_POSITIONS[view]?.geometrieRezept;
    if (rezept !== 'torso-zylinder' && rezept !== 'oberarm-band') {
      throw new Error(
        `Geometrie-Rezept "${rezept ?? '—'}" (Ansicht "${view}") ist im Druckflächen-Generator ` +
          `noch nicht implementiert. Ergänze eine Rezept-Strategie in generatePrintAreaData.mts, ` +
          `sobald ein reales Produkt diese Ansicht führt (M4).`
      );
    }
    const istAermel = rezept === 'oberarm-band';
    // Prozessgrenze DATENGETRIEBEN aus dem View-Registry (M4-B2): das Feld
    // `prozessgrenze` ist die einzige Quelle; eine neue Ansicht bringt ihre
    // Grenze als Daten mit, ohne den Generator zu ändern. Fail-loud, falls eine
    // implementierte-Rezept-Ansicht keine Grenze hinterlegt hat.
    const grenze = DECORATION_POSITIONS[view]?.prozessgrenze;
    if (!grenze) {
      throw new Error(`Keine prozessgrenze für Ansicht "${view}" im View-Registry (decorationPositions.ts).`);
    }

    // ── Kapuzen-/Kragenhöhe aus VERIFIZIERTEN Maßen bestimmen ───────────
    //
    // Das Problem: `hoeheCm` der Größentabelle wird ab höchstem Schulterpunkt
    // gemessen, OHNE Kapuze. Die Bildkontur beginnt aber an der Kapuzen- bzw.
    // Kragenspitze. Wer beides gleichsetzt, bekommt zwei Fehler auf einmal:
    // einen falschen Maßstab (px/cm zu groß) und einen falschen Nullpunkt –
    // gemessen lagen dadurch die oberen ~85 px der Rückenfläche eines Hoodies
    // AUF der Kapuze.
    //
    // Die Lösung braucht keine neue Heuristik, sondern den zweiten bereits
    // verifizierten Datenpunkt: die Brustbreite. Sie wird unterhalb der Achsel
    // gemessen, wo keine Kapuze stört, und liefert über TORSO_SICHTBAR_ANTEIL
    // einen kapuzenfreien Maßstab. Was die Kontur darüber hinaus an Höhe hat,
    // IST das Kopfteil.
    //
    // Bei T-Shirts und Polos ergibt sich daraus erwartungsgemäß nahe 0 – die
    // Flächen dieser Produkte bleiben damit unverändert richtig.
    // Schulterlinie = Bildoberkante zuzüglich Kopfteil (siehe KOPFTEIL_ANTEIL).
    // Ab hier gilt die Größentabelle; alles darüber ist Kapuze oder Kragen.
    const kopfteilAnteil = kopfteilVon(p, zeilen);
    const ySchulter = istAermel ? yOben : yOben + konturHoehePx * kopfteilAnteil;
    const hoehePx = yUnten - ySchulter + 1;

    // Nahaufnahme-Korrektur (nur Ärmelansichten, siehe NAHAUFNAHME_AB).
    // Der Vergrößerungsfaktor ist die Abweichung des gemessenen Verhältnisses
    // vom echten Verhältnis der Schnittgruppe.
    let vergroesserung = 1;
    if (istAermel) {
      const gemessen = verhaeltnisse.get(p.id);
      const echt = echtesVerhaeltnis.get(p.productType);
      if (gemessen !== undefined && echt && gemessen >= NAHAUFNAHME_AB) {
        vergroesserung = gemessen / echt;
        protokoll.push(
          `${p.id}/${view}: Nahaufnahme erkannt (Verhältnis ${gemessen.toFixed(3)} statt ${echt.toFixed(3)}) – Maßstab ×${vergroesserung.toFixed(2)} korrigiert`
        );
      }
    }
    const pxProCm = (hoehePx / mass.hoeheCm) * vergroesserung;
    kopfteilProtokoll.push(
      `${p.id}/${view}: Kopfteil ${((ySchulter - yOben) / pxProCm).toFixed(1)} cm`
    );

    // ── Erst die REALEN Maße bestimmen, dann daraus die Box ──────────
    // Vorher liefen beide Größen getrennt: Die Box kam aus Kontur plus
    // Sicherheitsabständen, die cm-Werte aus Größentabelle plus
    // Prozessgrenze. Beide konnten nie übereinstimmen – gemessen wurden
    // vorne 62,5 cm gezeichnet gegen 47 cm angezeigt, am Ärmel 18,4 gegen
    // 13. Jetzt ist die Box die DARSTELLUNG der cm-Werte, eine Abweichung
    // ist damit konstruktiv ausgeschlossen.
    let breiteCm: number;
    let hoeheNutzbarCm: number;
    let quelle: string;

    if (!istAermel) {
      breiteCm = Math.min(mass.breiteCm - 2 * ABSTAND.seitennaht, grenze.maxWidthCm);
      hoeheNutzbarCm = Math.min(mass.hoeheCm - ABSTAND.kragen - ABSTAND.saum, grenze.maxHeightCm);
      quelle = 'Kontur (Position) + Größentabelle (Maß)';
    } else {
      breiteCm = Math.min(AERMEL_KONSERVATIV_CM - 2 * ABSTAND.aermelnaht, grenze.maxWidthCm);
      hoeheNutzbarCm = grenze.maxHeightCm;
      quelle = 'Kontur (Position) + Gruppenfläche Oberarm';
    }

    // Umrechnung ISOTROP über px/cm aus der Bildhöhe – derselbe Faktor, den
    // auch cmConversion im Canvas verwendet. Nur so entspricht ein
    // angezeigter Zentimeterwert exakt der gezeichneten Strecke.
    const breitePx = breiteCm * pxProCm;
    const hoehePxBox = hoeheNutzbarCm * pxProCm;

    // Waagerecht auf der Kleidungsstückmitte zentriert (Median über alle
    // Farbvarianten, siehe oben).
    const mitteX = (medianMitteProzent / 100) * w;
    // Fläche zusätzlich auf die engste Kante begrenzen.
    const grenzeLinksPx = (engsteLinks / 100) * w;
    const grenzeRechtsPx = (engsteRechts / 100) * w;
    let x0px = mitteX - breitePx / 2;
    let x1px = mitteX + breitePx / 2;
    // Nie über die engste Stoffkante hinaus – auch nicht, wenn das
    // Herstellermaß mehr zuließe.
    if (!istAermel) {
      const naht = ABSTAND.seitennaht * pxProCm;
      x0px = Math.max(x0px, grenzeLinksPx + naht);
      x1px = Math.min(x1px, grenzeRechtsPx - naht);
    }

    // ── Senkrechte Lage ──────────────────────────────────────────────
    // Vorder-/Rückseite: unterhalb des Kragens.
    //
    // ÄRMEL: mittig auf der nutzbaren Oberarmfläche. Die frühere Regel
    // (15 % der Kleidungsstückhöhe ab Bildoberkante) hatte keinerlei Bezug
    // zur Schulternaht oder zum Ärmelabschluss – die Fläche landete
    // rechnerisch irgendwo und fachlich zu weit oben.
    //
    // Herleitung: Ein kurzer Ärmel reicht ab Schulternaht rund 20 cm
    // hinunter, das sind bei einem 71-cm-Oberteil etwa 28 % der
    // Kleidungsstückhöhe. Als nutzbares Band gilt davon der mittlere
    // Bereich – ab AERMEL_BAND_VON bis AERMEL_BAND_BIS –, der oben die
    // Schulter-/Armkugelnaht und unten den Ärmelabschluss frei lässt. Die
    // Fläche wird in diesem Band ZENTRIERT, wie es die Praxisempfehlungen
    // („mittig auf dem Oberarm", Orientierung an der Ärmelfalte)
    // übereinstimmend beschreiben.
    // Bezugspunkt ist die SCHULTERLINIE, nicht die Bildoberkante: Bei Kapuzen-
    // und Stehkragenware liegt zwischen beiden das Kopfteil (bis ~22 cm).
    // Band in ZENTIMETERN ab Schulterlinie, nicht als Anteil der sichtbaren
    // Konturhöhe: Bei einer Nahaufnahme ist die sichtbare Höhe nur ein Teil
    // des Kleidungsstücks, ein Anteil davon träfe irgendwohin. Über den
    // korrigierten Maßstab trifft der cm-Wert in beiden Aufnahmearten
    // dieselbe Stelle am Oberarm. Bei Ganzansichten ist das rechnerisch
    // identisch mit der bisherigen Formel.
    //
    // Bezugspunkt ist die GEMESSENE Ärmellänge (Schulter→Achsel, aus der
    // Frontansicht), Mitte davon = Mitte des Oberarms. Das ist die Vorgabe
    // aus docs/platzierung-veredelung.md („mittig auf dem Oberarm"). Fehlt
    // die Messung, greift ersatzweise der bisherige Anteil.
    const laenge = aermelLaengeCm.get(p.id);
    const bandMitte = laenge
      ? ySchulter + (laenge / 2) * pxProCm
      : ySchulter + ((AERMEL_BAND_VON + AERMEL_BAND_BIS) / 2) * mass.hoeheCm * pxProCm;
    let y0px = istAermel
      ? bandMitte - hoehePxBox / 2
      : ySchulter + ABSTAND.kragen * pxProCm;
    let y1px = y0px + hoehePxBox;

    // ── ÄRMEL: Bewegungsbereich über die GANZE Stofffläche ──────────────
    //
    // Vorgabe des Auftraggebers: Auf der Ärmelansicht soll sich das Motiv
    // frei über dem gesamten Kleidungsstück bewegen lassen, nicht nur in
    // einem kleinen Rechteck auf dem Oberarm. Ein Kunde platziert sein Motiv
    // nicht absichtlich falsch – ein enger Rahmen bevormundet ihn, ohne
    // einen realen Fehler zu verhindern.
    //
    // Die MOTIVGRÖSSE bleibt davon unberührt: maxWidthCm/maxHeightCm decken
    // die Ärmelveredelung weiterhin auf 8,9 × 10 cm. Groß ist der Bereich,
    // in dem verschoben werden darf – nicht das, was gedruckt werden kann.
    //
    // Die zuvor berechnete Bandmitte bleibt die STARTPOSITION (siehe unten
    // startXCm/startYCm), damit ein frisch eingefügtes Motiv weiterhin
    // fachlich richtig auf dem Oberarm landet.
    let startXCm: number | undefined;
    let startYCm: number | undefined;
    if (istAermel) {
      const naht = ABSTAND.aermelnaht * pxProCm;
      const silhLinksPx = (silhouetteLinks / 100) * w;
      const silhRechtsPx = (silhouetteRechts / 100) * w;

      const neuX0 = silhLinksPx + naht;
      const neuX1 = silhRechtsPx - naht;
      const neuY0 = yOben + naht;
      const neuY1 = yUnten - naht;

      // MITTE der bisherigen Oberarmfläche relativ zum neuen Bereich merken,
      // BEVOR die Box wächst. Ein neu eingefügtes Motiv wird darauf zentriert
      // und landet damit weiterhin fachlich richtig, obwohl es anschließend
      // frei über das ganze Kleidungsstück bewegt werden darf.
      startXCm = (x0px + breitePx / 2 - neuX0) / pxProCm;
      startYCm = (y0px + hoehePxBox / 2 - neuY0) / pxProCm;

      x0px = neuX0;
      x1px = neuX1;
      y0px = neuY0;
      y1px = neuY1;
    }

    // ── Breite an den Zeilen prüfen, die die Fläche WIRKLICH einnimmt ────
    //
    // Die seitliche Begrenzung oben stammt aus dem TORSOSTREIFEN (unteres
    // Drittel). Die Fläche reicht aber bis dicht unter den Kragen, und dort
    // läuft der Schnitt zur Schulter hin ein – bei taillierten Damenschnitten
    // und Kapuzenware deutlich. Gemessen ragte die Fläche dadurch bei zehn
    // Produkt-/Farbkombinationen über die Stoffkante, beim Stedman Classic-T
    // in Weiß um 14,8 % der Bildbreite.
    //
    // Deshalb hier die Gegenprobe über den tatsächlichen Zeilenbereich der
    // Box, wieder als Schnittmenge über alle wählbaren Farben: Was in EINER
    // Variante über die Kante ragt, wird für alle eingezogen. Das ist genau
    // die Zusage „nie über die Seitennaht hinaus" – jetzt auf der gesamten
    // Höhe der Fläche statt nur im Torso.
    //
    // NICHT als striktes Minimum/Maximum über alle Zeilen – ein einzelner
    // Schatten- oder Faltenwurf reicht sonst, um die Fläche für ein ganzes
    // Produkt zu verengen. Gemessen beim Stedman Classic-T for Women in Weiß:
    // bei y=78,8–79,6 % (zwei von über 500 Zeilen) sackte die rechte Kante auf
    // 55–56 % ein und erholte sich sofort wieder auf 75 % – die Fläche schrumpfte
    // dadurch von 22,6 cm (Vorderseite) auf 11,1 cm. Statt des Extremwerts zählt
    // deshalb ein PERZENTIL (2 %): Vereinzelte Ausreißerzeilen – Falte, Schatten,
    // Naht-Detail – bleiben ohne Wirkung; eine über mehrere Zeilen anhaltende
    // Verengung (echte Kontur, siehe Saumkurve oben) schlägt weiterhin durch.
    if (!istAermel) {
      const naht = ABSTAND.seitennaht * pxProCm;
      const linksWerte: number[] = [];
      const rechtsWerte: number[] = [];
      for (const prof of profile) {
        const skalaY = prof.h / h;
        const skalaX = prof.w / w;
        const vy0 = Math.max(0, Math.round(y0px * skalaY));
        const vy1 = Math.min(prof.h - 1, Math.round(y1px * skalaY));
        // Den SAUM dieser Variante weiterhin ausnehmen: Der Stoff läuft dort in
        // einer Kurve zusammen (rundet zur Mitte, manchmal zum Zipfel) – eine
        // anhaltende, keine punktuelle Verengung, die auch ein Perzentil nicht
        // zuverlässig herausrechnet. Siehe Herleitung: FOTL Iconic 195 in Navy.
        const bel = prof.zeilen.filter((z) => z.breite > 0);
        const saumAb = bel.length ? bel[bel.length - 1]!.y - Math.round(prof.h * 0.03) : Infinity;
        for (let y = vy0; y <= Math.min(vy1, saumAb); y++) {
          const z = prof.zeilen[y];
          if (!z || z.breite === 0) continue;
          linksWerte.push(z.links / skalaX);
          rechtsWerte.push(z.rechts / skalaX);
        }
      }
      const perzentil = (werte: number[], p: number) => {
        const sortiert = [...werte].sort((a, b) => a - b);
        return sortiert[Math.floor(sortiert.length * p)]!;
      };
      if (linksWerte.length > 20) {
        const engL = perzentil(linksWerte, 0.98); // 98. Perzentil = enge Kante von links
        const engR = perzentil(rechtsWerte, 0.02); // 2. Perzentil = enge Kante von rechts
        if (engR > engL) {
          x0px = Math.max(x0px, engL + naht);
          x1px = Math.min(x1px, engR - naht);
        }
      }
    }

    // ── Bewegungsbereich je Produkt anwenden ────────────────────────────
    // Die je Produkt am Foto abgelesenen, visuell abgenommenen Kanten sind
    // führend (BEREICH_KORREKTUR). Sie überschreiben die aus Größentabelle und
    // Prozessgrenze berechnete Fläche dort, wo diese die sichtbare Stofffläche
    // nicht ausnutzt oder Kragen/V-Ausschnitt/Naht nicht freihält. Nur die
    // angegebenen Kanten werden ersetzt, der Rest bleibt berechnet.
    const korrektur = BEREICH_KORREKTUR[`${p.id}-${view}`];
    if (korrektur) {
      if (korrektur.x0 !== undefined) x0px = (korrektur.x0 / 100) * w;
      if (korrektur.x1 !== undefined) x1px = (korrektur.x1 / 100) * w;
      if (korrektur.y0 !== undefined) y0px = (korrektur.y0 / 100) * h;
      if (korrektur.y1 !== undefined) y1px = (korrektur.y1 / 100) * h;
    }

    // ── cm-Werte aus der ENDGÜLTIGEN Box ableiten ───────────────────────
    // Die Box ist führend; die cm-Werte folgen ihr, sonst liefen gezeichnete
    // Fläche und angezeigtes Maß auseinander.
    breiteCm = Math.min(breiteCm, (x1px - x0px) / pxProCm);
    hoeheNutzbarCm = Math.min(hoeheNutzbarCm, (y1px - y0px) / pxProCm);

    // ── Wahre cm-Ausdehnung der GEZEICHNETEN Box ────────────────────────
    //
    // Das ist der Bezug, mit dem der Canvas Zentimeter in Pixel umrechnet
    // (cmConversion: pxPerCm = areaPx.height / boxHeightCm).
    // Bisher stand dort die KÖRPERLÄNGE (z.B. 72 cm), obwohl die Box nur den
    // bedruckbaren Bereich zeigt (z.B. 47 cm). Gemessen im laufenden Canvas:
    // Box 457,7 px, Standardlogo 13,95 cm wurde mit 89 px gezeichnet – das
    // sind 6,38 px/cm statt der korrekten 9,74. Jedes Motiv erschien damit
    // mit 65 % seiner angegebenen Größe, der Druck fiele 1,53-fach größer
    // aus als in der Vorschau.
    const boxBreiteCm = (x1px - x0px) / pxProCm;
    const boxHoeheCm = (y1px - y0px) / pxProCm;

    const proz = (v: number, g: number) => Number(((v / g) * 100).toFixed(1));

    proProdukt[view] = {
      garmentWidthCm: Number((istAermel ? AERMEL_KONSERVATIV_CM : mass.breiteCm - 2 * ABSTAND.seitennaht).toFixed(1)),
      garmentHeightCm: Number((istAermel ? grenze.maxHeightCm : mass.hoeheCm - ABSTAND.kragen - ABSTAND.saum).toFixed(1)),
      x0: proz(x0px, w),
      y0: proz(y0px, h),
      x1: proz(x1px, w),
      y1: proz(y1px, h),
      imgW: w,
      imgH: h,
      maxWidthCm: Number(breiteCm.toFixed(1)),
      maxHeightCm: Number(hoeheNutzbarCm.toFixed(1)),
      boxWidthCm: Number(boxBreiteCm.toFixed(1)),
      boxHeightCm: Number(boxHoeheCm.toFixed(1)),
      ...(startXCm !== undefined && startYCm !== undefined
        ? { startXCm: Number(Math.max(0, startXCm).toFixed(1)), startYCm: Number(Math.max(0, startYCm).toFixed(1)) }
        : {}),
      quelle,
    };
  }

  if (Object.keys(proProdukt).length > 0) ergebnis[p.id] = proProdukt;
}

// ── Ausgabe als TypeScript-Datei ────────────────────────────────────────
const zeilenAus: string[] = [
  '/**',
  ' * ERZEUGTE DATEI – nicht von Hand bearbeiten.',
  ' *',
  ' * Quelle: scripts/generatePrintAreaData.mts',
  ' * Modell: Bildkontur (Position) + verifizierte Herstellermaße (Größe)',
  ' *         + Prozessgrenzen der Veredelung (Deckelung).',
  ' *',
  ' * Herleitung und Quellenlage: docs/recherche-herstellermasse.md',
  ' * Neu erzeugen: npx tsx --tsconfig tsconfig.scripts.json \\',
  ' *               scripts/generatePrintAreaData.mts',
  ' */',
  "import type { PrintView } from '@/types';",
  '',
  'export interface GeneratedArea {',
  '  /** Position im Bild, Prozent der Bildkante. */',
  '  x0: number;',
  '  y0: number;',
  '  x1: number;',
  '  y1: number;',
  '  imgW: number;',
  '  imgH: number;',
  '  /** Effektiv nutzbar in cm: Kleidungsstückmaß, gedeckelt durch die',
  '   *  Prozessgrenze der Veredelung. Das ist der Wert, der gilt. */',
  '  maxWidthCm: number;',
  '  maxHeightCm: number;',
  '  /** WAHRE cm-Ausdehnung der gezeichneten Box (Bewegungsbereich).',
  '   *  Grundlage der Pixel↔Zentimeter-Umrechnung im Canvas. Bei Vorder-/',
  '   *  Rückseite gleich maxWidthCm/maxHeightCm; auf der Ärmelansicht',
  '   *  deutlich größer, weil dort die ganze Stofffläche bewegbar ist. */',
  '  boxWidthCm: number;',
  '  boxHeightCm: number;',
  '  /** Startposition eines neu eingefügten Motivs innerhalb der Box (cm).',
  '   *  Nur auf der Ärmelansicht gesetzt: Der Bewegungsbereich umfasst dort',
  '   *  das ganze Kleidungsstück, das Motiv soll aber mittig auf dem',
  '   *  Oberarm beginnen. */',
  '  startXCm?: number;',
  '  startYCm?: number;',
  '  /** Aus dem Kleidungsstück abgeleitet, UNGEDECKELT – macht sichtbar,',
  '   *  ob die Prozessgrenze oder der Schnitt die Fläche begrenzt. */',
  '  garmentWidthCm: number;',
  '  garmentHeightCm: number;',
  '}',
  '',
  'export const PRINT_AREA_DATA: Record<string, Partial<Record<PrintView, GeneratedArea>>> = {',
];

for (const [id, views] of Object.entries(ergebnis)) {
  zeilenAus.push(`  '${id}': {`);
  for (const [view, b] of Object.entries(views)) {
    zeilenAus.push(
      `    ${view}: { x0: ${b!.x0}, y0: ${b!.y0}, x1: ${b!.x1}, y1: ${b!.y1}, imgW: ${b!.imgW}, imgH: ${b!.imgH}, maxWidthCm: ${b!.maxWidthCm}, maxHeightCm: ${b!.maxHeightCm}, boxWidthCm: ${b!.boxWidthCm}, boxHeightCm: ${b!.boxHeightCm},${b!.startXCm !== undefined ? ` startXCm: ${b!.startXCm}, startYCm: ${b!.startYCm},` : ''} garmentWidthCm: ${b!.garmentWidthCm}, garmentHeightCm: ${b!.garmentHeightCm} },`
    );
  }
  zeilenAus.push('  },');
}
zeilenAus.push('};', '');

writeFileSync(PRINTAREA_OUT, zeilenAus.join('\n'), 'utf8');

console.log(`Produkte mit Flächen : ${Object.keys(ergebnis).length} von ${PRODUCTS.length}`);
console.log(`Ansichten gesamt     : ${Object.values(ergebnis).reduce((s, v) => s + Object.keys(v).length, 0)}`);
console.log(`Fehlende Bilder      : ${ohneBild}`);
if (protokoll.length) {
  console.log('\nProtokoll:');
  for (const z of protokoll) console.log(`  ${z}`);
}

// Kopfteilhöhe je Produkt – macht sofort sichtbar, ob die Kapuzenerkennung
// plausibel greift (T-Shirt nahe 0, Kapuze/Stehkragen deutlich darüber).
if (process.argv.includes('--kopfteil')) {
  console.log('\nKopfteilhöhe (Bildoberkante bis Schulterlinie):');
  for (const z of kopfteilProtokoll.filter((x) => x.includes('/front'))) console.log(`  ${z}`);
}
