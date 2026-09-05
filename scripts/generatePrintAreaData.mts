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

/**
 * KORREKTUR (2026-09-04, Befund: „Ärmelbereiche müssen angepasst werden"):
 * Die Motivgrößen-Obergrenze für Ärmel war bislang auf einen FLACHEN,
 * produktübergreifenden Wert gedeckelt (vormals 8,9 cm, aus dem an den 28
 * T-Shirts/Polos gemessenen Mittelwert 10,9 cm minus 2×1,0 cm Naht) –
 * unabhängig davon, wie viel Stoff die einzelne Ärmelaufnahme tatsächlich
 * sicher hergab. Das betraf ALLE Ärmelprodukte gleichermaßen, war aber bei
 * bauschigeren Schnitten (Hoodies, Sweatshirts) am sichtbarsten, weil deren
 * Bewegungsbereich (boxWidthCm, aus der Kontur der jeweiligen Ärmelaufnahme
 * berechnet, siehe berechneBox() unten) sichtbar breiter ausfällt als 8,9 cm.
 *
 * Der Bewegungsbereich ist bereits die für DIESES Produkt geprüfte sichere
 * Fläche (Silhouette minus Nahtabstand, siehe `vollX0`/`vollX1` unten) – und
 * zur Laufzeit (ConfiguratorCanvas.tsx, clampDragPositionCentered) kann ein
 * Motiv ohnehin NIE über diesen Bereich hinausragen, unabhängig davon, wie
 * groß maxWidthCm erlaubt: Der erlaubte Mittelpunkt-Bereich schrumpft mit der
 * Motivgröße, die Kante bleibt innerhalb areaPx. Ein größeres maxWidthCm
 * verschenkt also keine Sicherheit, sondern nur ungenutzten Bewegungsspielraum
 * (weniger Freiheit, das Motiv zu verschieben) gegen mehr mögliche Motivgröße.
 *
 * NACHTRAG (2026-09-04, Betreiber-Auskunft): Ein erster Zwischenstand hatte
 * hier stattdessen `grenze.maxWidthCm` (11 cm) als Obergrenze gesetzt – die
 * Prozessgrenze der VEREDELUNG, aus decorationPositions.ts. Das war falsch
 * verallgemeinert: Der Betreiber hat bestätigt, dass DTF-Transfers KEINE
 * eigene Formatobergrenze der Presse haben ("die Grenze ist nur so groß wie
 * die Ärmel an sich"). Diese Datei erzeugt bewusst nur EINE, methodenneutrale
 * Fläche (siehe Kopfkommentar der Datei) – die hier erzeugten Werte sind
 * also die DTF-Werte, ausschließlich durch die tatsächliche, für DIESES
 * Produkt gemessene Bewegungsbereichsbreite begrenzt (Zeile ~1428,
 * `Math.min(breiteCmLokal, (x1pxLokal - x0pxLokal) / pxProCm)`) – echte
 * Einzelfallprüfung statt eines produktübergreifenden Werts, exakt wie bei
 * front/back mit der Herstellermaßtabelle.
 *
 * Stickerei hat dagegen einen echten Stickrahmen (Betreiber-Auskunft:
 * 30 cm × 19 cm) – diese methodenspezifische Zusatzgrenze für Ärmel sitzt
 * NICHT hier, sondern in printAreas.ts (buildAreasForProduct), wo DTF- und
 * Stickereiflächen bereits als getrennte Arrays gebaut werden. Geprüft
 * (2026-09-04): bei allen 141 aktuell erzeugten Ärmelansichten liegt die
 * gemessene Bewegungsbereichsbreite zwischen 12,2 cm und 23,5 cm – die
 * 30-cm-Stickrahmengrenze bleibt damit für die Breite überall unkritisch
 * (nie die bindende Grenze), wird aber dennoch als echte, methodenspezifische
 * Prüfung geführt statt stillschweigend vorausgesetzt. */

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
  // Katalogweite Nachkalibrierung 2026-08-09: weitere Langarm-Shirts, jeweils
  // geprüft, ob ein Ärmel neben dem Rumpf ins Bild hängt (siehe Kommentar
  // oben zu fotl-iconic195-longsleeve) – wo ja, bewusst konservativ.
  'earthpositive-premium-long-sleeve-t-shirt-front': { x0: 28, x1: 72, y1: 82 },
  'earthpositive-premium-long-sleeve-t-shirt-back': { x0: 28, x1: 72, y1: 82 },
  'gildan-ultra-cotton-long-sleeve-t-shirt-front': { x0: 28, x1: 72, y1: 83 },
  'gildan-ultra-cotton-long-sleeve-t-shirt-back': { x0: 28, x1: 72, y1: 83 },
  'sols-men-s-long-sleeve-t-shirt-imperial-front': { x0: 27, x1: 73, y1: 85 },
  'sols-men-s-long-sleeve-t-shirt-imperial-back': { x0: 27, x1: 73, y1: 85 },
  'russell-classic-t-long-sleeve-front': { x0: 27, x1: 70, y1: 85 },
  'russell-classic-t-long-sleeve-back': { x0: 27, x1: 71, y1: 85 },
  'bundc-t-shirt-e150-long-sleeve-unisex-exact-front': { x0: 28, x1: 72, y1: 84 },
  'bundc-t-shirt-e150-long-sleeve-unisex-exact-back': { x0: 28, x1: 72, y1: 84 },
  'earthpositive-unisex-organic-longsleeve-t-shirt-front': { x0: 28, x1: 72, y1: 80 },
  'earthpositive-unisex-organic-longsleeve-t-shirt-back': { x0: 28.2, x1: 71.8, y0: 29.2, y1: 75 },
  'just-cool-long-sleeve-cool-t-front': { x0: 27, x1: 72, y1: 84 },
  'just-cool-long-sleeve-cool-t-back': { x0: 27, x1: 72, y1: 84 },
  'bundc-mens-t-shirt-e190-long-sleeve-exact-front': { x0: 28, x1: 72, y1: 84 },
  'bundc-mens-t-shirt-e190-long-sleeve-exact-back': { x0: 28, x1: 72, y1: 84 },
  'neutral-recycled-performance-long-sleeve-t-shirt-front': { x0: 28, x1: 72, y1: 84 },
  'neutral-recycled-performance-long-sleeve-t-shirt-back': { x0: 28, x1: 72, y1: 84 },
  'neutral-men-s-long-sleeve-t-shirt-front': { x0: 28, x1: 71, y1: 83 },
  'neutral-men-s-long-sleeve-t-shirt-back': { x0: 28, x1: 71, y1: 84 },
  // Taillierte Damen-Langarm.
  'neutral-ladies-long-sleeve-t-shirt-front': { x0: 28, x1: 72, y1: 83 },
  'neutral-ladies-long-sleeve-t-shirt-back': { x0: 28, x1: 72, y1: 83 },
  'bundc-t-shirt-e150-long-sleeve-women-exact-front': { x0: 30, x1: 70, y1: 86 },
  'bundc-t-shirt-e150-long-sleeve-women-exact-back': { x0: 30, x1: 70, y1: 85 },

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
  // Katalogweite Nachkalibrierung 2026-08-09 (Betreiber-Vorgabe: alle
  // Produkte durchgehen): V-Spitzen per Pixel-Kontur-Analyse + Blickkontrolle
  // am eigenen Foto vermessen (nicht von anderen Produkten übernommen, jede
  // Marke rahmt anders). stedman-classic-t-v-neck-for-women hatte dabei einen
  // ECHTEN Fehler in der berechneten Basisfläche: y0 lag bei 17,9 % – mitten
  // im offenen Ausschnitt, nicht nur ohne Bewegungsspielraum. Jetzt behoben.
  'russell-mens-pure-organic-v-neck-tee-front': { x0: 26, x1: 73, y0: 24, y1: 86 },
  'russell-mens-pure-organic-v-neck-tee-back': { x0: 26, x1: 74, y1: 86 },
  'bundc-inspire-v-t-men-front': { x0: 29, x1: 72, y0: 25, y1: 86 },
  'bundc-inspire-v-t-men-back': { x0: 28, x1: 73, y1: 86 },
  'bundc-inspire-v-t-women-front': { x0: 29, x1: 71, y0: 28, y1: 82 },
  'bundc-inspire-v-t-women-back': { x0: 28, x1: 71, y1: 82 },
  'stedman-classic-t-v-neck-front': { x0: 28, x1: 72, y0: 21, y1: 86 },
  'stedman-classic-t-v-neck-back': { x0: 29, x1: 71, y1: 86 },
  'stedman-classic-t-v-neck-for-women-front': { x0: 30, x1: 70, y0: 30, y1: 82 },
  'stedman-classic-t-v-neck-for-women-back': { x0: 31, x1: 70, y1: 82 },
  // jamesnicholson-ladies-bio-workwear-t-shirt: als "T-Shirt" katalogisiert,
  // ist am eigenen Foto aber eindeutig ein V-Ausschnitt – derselbe
  // Ausschnitt-im-Bereich-Fehler wie bei stedman-classic-t-v-neck-for-women
  // (y0 lag bei 17,7 %, V-Spitze liegt bei ca. 23 %).
  'jamesnicholson-ladies-bio-workwear-t-shirt-front': { x0: 29, x1: 71, y0: 25, y1: 82 },
  'jamesnicholson-ladies-bio-workwear-t-shirt-back': { x0: 29, x1: 71, y1: 84 },

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
  // Katalogweite Nachkalibrierung 2026-08-09, weitere gerade Herren-/Unisex-
  // Rundhals-Schnitte. Einzelne Rückenfotos sind noch Platzhalter ("Bild
  // folgt") statt echter Fotos – dort bewusst NUR die Vorderseite kalibriert.
  'bundc-t-shirt-e190-front': { x0: 28, x1: 72, y0: 19, y1: 86 },
  // Rückenrender: Zeile für Zeile über alle 40 Farben gemessen (2026-09-03)
  // liegt der Rumpf unterhalb der Achsel nur bei x30.8–69.8 (Heather-Varianten
  // rechts etwas schmaler gerendert). Die frühere Box x27–73 lag links 3 % und
  // rechts bis 3 % auf dem Hintergrund (Stoffdeckung 91,9–95,7 %).
  'bundc-t-shirt-e190-back': { x0: 31.3, x1: 69.3, y0: 18, y1: 86 },
  'bundc-t-shirt-e190-women-front': { x0: 27, x1: 73, y0: 19, y1: 84 },
  'bundc-t-shirt-e190-women-back': { x0: 27, x1: 73, y0: 19, y1: 84 },
  'bundc-inspire-e150-t-shirt-front': { x0: 27, x1: 73, y0: 17, y1: 86 },
  'bundc-inspire-e150-t-shirt-back': { x0: 27, x1: 73, y0: 17, y1: 86 },
  'bundc-t-shirt-e150-front': { x0: 28, x1: 72, y0: 19, y1: 86 },
  // Rückenrender mit leichter Taille: engste Rumpfzeile über alle 41 Farben
  // bei y≈60 x31.5–69.8, Saum bei y86 (2026-09-03 gemessen). Die frühere Box
  // x28–72/y85 lag in der Taille beidseitig 2–3,5 % neben dem Stoff und
  // unten im Saumbogen (Stoffdeckung 94,4 %).
  'bundc-t-shirt-e150-back': { x0: 32, x1: 69.3, y0: 21, y1: 84 },
  'bundc-inspire-e150-t-shirt-women-front': { x0: 27, x1: 73, y0: 19, y1: 86 },
  'bundc-inspire-e150-t-shirt-women-back': { x0: 27, x1: 73, y0: 19, y1: 86 },
  'bundc-t-shirt-e150-women-front': { x0: 27, x1: 73, y0: 19, y1: 87 },
  'bundc-t-shirt-e150-women-back': { x0: 27, x1: 73, y0: 19, y1: 87 },
  // Fotorahmung endet hier deutlich früher (Stoff bis y~84/86, danach
  // Weißraum) als bei den übrigen geraden Schnitten – am eigenen Foto
  // bestätigt, kein Zuschnittfehler.
  'bundc-e220-t-front': { x0: 27.2, x1: 72.8, y0: 24.7, y1: 83 },
  'bundc-e220-t-back': { x0: 27, x1: 73, y0: 23.5, y1: 85 },
  'bundc-inspire-t-men-front': { x0: 27, x1: 73, y0: 17, y1: 86 },
  'bundc-inspire-t-men-back': { x0: 27, x1: 73, y0: 17, y1: 86 },
  // Vorderseite hat einen gewellten Fashion-Saum (Rückseite ist normal
  // gerundet) – y1 an den HÖCHSTEN Wellenpunkten verankert, konservativer
  // als die Rückseite.
  'bundc-inspire-t-women-front': { x0: 27, x1: 73, y0: 17, y1: 83 },
  'bundc-inspire-t-women-back': { x0: 27, x1: 73, y0: 17, y1: 86 },
  'jamesnicholson-round-t-heavy-front': { x0: 26, x1: 72, y0: 17, y1: 87 },
  'jamesnicholson-round-t-heavy-back': { x0: 26, x1: 72, y0: 17, y1: 87 },
  'jamesnicholson-ladies-active-t-front': { x0: 27, x1: 73, y0: 18, y1: 86 },
  'jamesnicholson-ladies-active-t-back': { x0: 27, x1: 73, y0: 18, y1: 86 },
  'jamesnicholson-men-s-basic-t-front': { x0: 27, x1: 72, y0: 17, y1: 87 },
  'jamesnicholson-men-s-basic-t-back': { x0: 27, x1: 72, y0: 17, y1: 87 },
  'jamesnicholson-ladies-basic-t-front': { x0: 27, x1: 73, y0: 18, y1: 86 },
  'jamesnicholson-ladies-basic-t-back': { x0: 27, x1: 73, y0: 18, y1: 86 },
  'jamesnicholson-workwear-t-men-front': { x0: 27, x1: 72, y0: 17, y1: 87 },
  'jamesnicholson-workwear-t-men-back': { x0: 27, x1: 72, y0: 17, y1: 87 },
  'jamesnicholson-mens-bio-workwear-t-shirt-front': { x0: 27, x1: 73, y1: 86 },
  'jamesnicholson-mens-bio-workwear-t-shirt-back': { x0: 27, x1: 73, y1: 86 },
  'russell-russell-classic-t-front': { x0: 27, x1: 73, y1: 86 },
  'russell-russell-classic-t-back': { x0: 27, x1: 73, y1: 86 },
  'russell-classic-heavyweight-t-shirt-front': { x0: 28, x1: 72, y1: 86 },
  'russell-classic-heavyweight-t-shirt-back': { x0: 28, x1: 72, y1: 86 },
  // Weiß, geringer Kontrast am Saum – Unterkante konservativer gewählt.
  'russell-mens-pure-organic-heavy-tee-front': { x0: 28, x1: 72, y1: 83 },
  'russell-mens-pure-organic-heavy-tee-back': { x0: 28, x1: 72, y1: 83 },
  'gildan-ultra-cotton-t-shirt-front': { x0: 28, x1: 72, y1: 86 },
  'gildan-ultra-cotton-t-shirt-back': { x0: 28, x1: 72, y1: 86 },
  'gildan-light-cotton-adult-t-shirt-front': { x0: 28, x1: 72, y1: 86 },
  'neutral-men-s-classic-t-shirt-front': { x0: 28, x1: 73, y1: 86 },
  'neutral-men-s-classic-t-shirt-back': { x0: 28, x1: 73, y1: 86 },
  'neutral-men-s-fit-t-shirt-front': { x0: 28, x1: 73, y1: 86 },
  'neutral-men-s-fit-t-shirt-back': { x0: 28, x1: 73, y1: 86 },
  'neutral-unisex-performance-t-shirt-front': { x0: 28, x1: 73, y1: 86 },
  'neutral-unisex-performance-t-shirt-back': { x0: 28, x1: 73, y1: 86 },
  'neutral-unisex-regular-t-shirt-front': { x0: 28, x1: 73, y1: 86 },
  'neutral-unisex-regular-t-shirt-back': { x0: 28, x1: 73, y1: 86 },
  // Oversized: breiter, boxiger Drop-Shoulder-Schnitt.
  'neutral-oversized-t-shirt-front': { x0: 26, x1: 74, y1: 85 },
  'neutral-oversized-t-shirt-back': { x0: 26, x1: 74, y1: 85 },
  'stedman-stedman-classic-t-front': { x0: 27, x1: 73, y1: 86 },
  'stedman-comfort-t-front': { x0: 27, x1: 73, y1: 86 },
  'stedman-clive-crew-neck-front': { x0: 27, x1: 73, y1: 86 },
  // Taillierte Damenschnitte.
  // jamesnicholson-ladies-bio-workwear-t-shirt: ist tatsächlich ein
  // V-Ausschnitt (am Foto bestätigt), siehe eigener Eintrag im
  // V-Ausschnitte-Abschnitt oben statt hier.
  'russell-ladies-pure-organic-heavy-tee-front': { x0: 31, x1: 69, y1: 79 },
  'russell-ladies-pure-organic-heavy-tee-back': { x0: 31, x1: 69, y1: 79 },
  'neutral-ladies-classic-t-shirt-front': { x0: 30, x1: 70, y1: 82 },
  'neutral-ladies-classic-t-shirt-back': { x0: 30, x1: 70, y1: 82 },
  'neutral-ladies-fit-t-shirt-front': { x0: 30, x1: 70, y1: 80 },
  'neutral-ladies-fit-t-shirt-back': { x0: 30, x1: 70, y1: 80 },
  // Classic-T for Women: taillierter Damenschnitt. Rückansicht hat einen
  // photobelegten Stofffalten-Defekt (weiße Variante geprüft) und ist
  // deshalb dort auf y1:76 gekappt; die Vorderseite zeigt in derselben
  // weißen Variante KEINE Falte, deshalb hier moderater als die Rückseite.
  'stedman-classic-t-for-women-front': { y1: 84 },
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
  // EarthPositive-Polos hatten bislang KEINEN Eintrag hier (übernahmen nur
  // die Sperrzone von gildan-softstyle-polo per GEOMETRY_ALIAS, aber nie
  // dessen Flächen-Korrektur) – Bewegungsbereich war dadurch exakt so groß
  // wie die Motivgrenze (30x47 cm), also OHNE jeden Verschiebespielraum.
  // Am eigenen Foto abgelesen (Rasterhilfe scripts/qaRaster.mts, 2026-08-09):
  // Rumpf reicht seitlich bis x25/x75, Saum bis y85 (Jersey-Rückseite hat ein
  // Ripp-Bündchen, deshalb dort nicht tiefer).
  // Korrektur 2026-08-09 (2. Durchgang): bei der GRÖSSTEN Größe (XXL) ragten
  // die oberen Ecken über die Schulterlinie hinaus, weil x0/x1 mit der
  // Größe breiter werden, y0 aber (Kragen-Anker) gleich bleibt – am selben
  // Referenzfoto per Pixelkontur objektiv nachgeprüft (scripts/
  // validateCorners.mjs). y0 angehoben, bis auch bei XXL beide Ecken auf
  // Stoff liegen.
  'earthpositive-pique-polo-shirt-front': { x0: 25, x1: 75, y0: 25.7, y1: 85 },
  'earthpositive-pique-polo-shirt-back': { x0: 25, x1: 75, y0: 25.7, y1: 85 },
  'earthpositive-jersey-polo-shirt-front': { x0: 25, x1: 75, y0: 25.8, y1: 85 },
  'earthpositive-jersey-polo-shirt-back': { x0: 25, x1: 75, y0: 22.9, y1: 85 },
  // Katalogweite Nachkalibrierung 2026-08-09, weitere Polos. Alle hingen
  // zuvor ebenfalls per GEOMETRY_ALIAS an gildan-softstyle-polo (Fläche UND
  // Sperrzone) – jetzt eigene Messung je Produkt (Objektiv per Zeilenprofil-
  // Analyse, siehe EXCLUSION_ZONES für die zugehörigen Knopfleisten).
  'bundc-unisex-polo-id-001-front': { x0: 26, x1: 74, y1: 87 },
  'bundc-unisex-polo-id-001-back': { x0: 26, x1: 74, y1: 87 },
  'bundc-my-polo-180-front': { x0: 27, x1: 74, y1: 88 },
  'bundc-my-polo-180-back': { x0: 27, x1: 74, y1: 88 },
  'bundc-inspire-polo-men-front': { x0: 29, x1: 72, y1: 88 },
  'bundc-inspire-polo-men-back': { x0: 29, x1: 72, y1: 88 },
  'bundc-inspire-polo-women-front': { x0: 31, x1: 69, y1: 87 },
  'bundc-inspire-polo-women-back': { x0: 31, x1: 69, y1: 87 },
  'bundc-my-eco-polo-6535-front': { x0: 26, x1: 74, y1: 88 },
  'bundc-my-eco-polo-6535-back': { x0: 26, x1: 74, y1: 88 },
  // Rückenfoto (rot) zeigt eine tailliertere Silhouette als das Vorderfoto
  // (dunkelgrün) desselben Produkts – reale Foto-Differenz, keine Ungenauigkeit.
  'bundc-my-eco-polo-6535-women-front': { x0: 26, x1: 74, y1: 88 },
  'bundc-my-eco-polo-6535-women-back': { x0: 29, x1: 72, y1: 89 },
  'jamesnicholson-classic-polo-front': { x0: 29, x1: 71, y1: 89 },
  'jamesnicholson-classic-polo-back': { x0: 29, x1: 71, y1: 89 },
  'jamesnicholson-classic-polo-ladies-front': { x0: 30, x1: 70, y1: 90 },
  'jamesnicholson-classic-polo-ladies-back': { x0: 30, x1: 70, y1: 90 },
  'jamesnicholson-men-s-bio-workwear-polo-front': { x0: 26, x1: 73, y1: 90 },
  'jamesnicholson-men-s-bio-workwear-polo-back': { x0: 26, x1: 72, y1: 90 },
  'jamesnicholson-workwear-polo-men-front': { x0: 28, x1: 71, y1: 90 },
  'jamesnicholson-workwear-polo-men-back': { x0: 28, x1: 72, y1: 90 },
  'russell-strapazierfaehiges-poloshirt-599-front': { x0: 28, x1: 72, y1: 90 },
  'russell-strapazierfaehiges-poloshirt-599-back': { x0: 29, x1: 71, y1: 90 },
  'russell-men-s-ultimate-cotton-polo-front': { x0: 26, x1: 76, y1: 90 },
  'russell-men-s-ultimate-cotton-polo-back': { x0: 27, x1: 73, y1: 90 },
  'russell-men-s-classic-cotton-polo-front': { x0: 27, x1: 74, y1: 90 },
  'russell-men-s-classic-cotton-polo-back': { x0: 29, x1: 71, y1: 90 },
  'russell-poloshirt-6535-front': { x0: 27, x1: 74, y1: 90 },
  'russell-poloshirt-6535-back': { x0: 27, x1: 73, y1: 90 },
  'russell-ladies-poloshirt-6535-front': { x0: 30, x1: 70, y1: 90 },
  'russell-ladies-poloshirt-6535-back': { x0: 31, x1: 71, y1: 90 },
  'sols-men-s-polo-shirt-prime-front': { x0: 30, x1: 71, y1: 90 },
  'sols-men-s-polo-shirt-prime-back': { x0: 28, x1: 71, y1: 88 },
  'sols-women-s-polo-shirt-prime-front': { x0: 29, x1: 70, y1: 90 },
  'sols-women-s-polo-shirt-prime-back': { x0: 31, x1: 69, y1: 90 },
  // Foto mit ausgestellten Armen (Pose, nicht flach ausgebreitet) – Rumpf-
  // breite deshalb nur aus den Zeilen UNTER der Ärmelüberschneidung
  // gemessen; Fläche ist deshalb bewusst schmaler als bei den übrigen Polos.
  'sols-men-s-polo-shirt-perfect-front': { x0: 33, x1: 68, y1: 84 },
  'sols-men-s-polo-shirt-perfect-back': { x0: 30, x1: 68, y1: 84 },
  'sols-unisex-pulse-polo-shirt-front': { x0: 26, x1: 72, y1: 90 },
  'sols-unisex-pulse-polo-shirt-back': { x0: 29, x1: 72, y1: 90 },
  // Sweatshirts mit kurzem Kragen-Zip (kein Kängurutasche): Zip oben über
  // Sperrzone frei, Rumpf gerade → etwas breiter, Unterkante über Bündchen.
  'jn-halfzip-sweat-front': { x0: 28, x1: 72, y1: 80 },
  'jn-halfzip-sweat-back': { x0: 28, x1: 72, y1: 80 },
  'justhoods-quarterzip-sweat-front': { x0: 28, x1: 72, y1: 80 },
  'justhoods-quarterzip-sweat-back': { x0: 28, x1: 72, y1: 80 },
  'sols-north-fleece-front': { y1: 80 },
  'sols-north-fleece-back': { y1: 80 },
  // Katalogweite Nachkalibrierung 2026-08-09, weitere Fleece-Jacken. Alle
  // Werte als Schnittmenge (engste Zeile gewinnt) über den relevanten
  // y-Bereich gemessen, exakt wie der Generator selbst vorgeht.
  'sols-men-s-plain-fleece-jacket-norman-front': { x0: 30, x1: 70, y1: 84 },
  'sols-men-s-plain-fleece-jacket-norman-back': { x0: 29, x1: 69, y1: 84 },
  'sols-women-s-plain-fleece-jacket-norman-front': { x0: 28, x1: 70, y1: 80 },
  'sols-women-s-plain-fleece-jacket-norman-back': { x0: 28, x1: 70, y1: 80 },
  // KORREKTUR 2026-08-09 (Nutzer-Feedback): y1 stand vorher bei 83 – auf
  // dem eigenen Foto (Damen-Taillenschnitt) reicht das bis dicht an den
  // elastischen Bund am Saum heran und wirkt dadurch unproportioniert hoch
  // (~90% der Kleidungsstückhöhe). Auf ein für ein Rücken-/Brustmotiv
  // übliches Maß zurückgenommen. Die vorher übersehene Eingrifftasche
  // (front, unten links, per Bildausschnitt bestätigt) ist jetzt separat
  // als EXCLUSION_ZONE in printAreas.ts eingetragen.
  'sols-women-s-fleecejacket-north-front': { x0: 30, x1: 68, y1: 63 },
  'sols-women-s-fleecejacket-north-back': { x0: 30, x1: 68, y1: 63 },
  // KORREKTUR 2026-08-09 (Nutzer-Feedback): Front-Box saß sichtbar links vom
  // Reißverschluss/der Kleidungsstückmitte (Zentrum vorher 47,5% statt ~50%
  // Zip-Linie) – nach rechts versetzt, am eigenen Foto gegengeprüft (Stoff
  // dort bis min. 85% durchgängig vorhanden, siehe Konturprofil).
  'sols-mens-factor-zipped-fleece-jacket-front': { x0: 30, x1: 73, y1: 86 },
  'sols-mens-factor-zipped-fleece-jacket-back': { x0: 28, x1: 74, y1: 86 },
  // Keine eindeutige Tasche erkennbar (nur mögliche Saum-Kordel, keine
  // Sperrzone nötig) – nur Reißverschluss.
  'russell-outdoor-fleece-jacke-front': { x0: 27, x1: 73, y1: 78 },
  'russell-outdoor-fleece-jacke-back': { x0: 29, x1: 72, y1: 76 },
  'jamesnicholson-men-s-fleece-jacket-jn-front': { x0: 27, x1: 73, y1: 87 },
  'jamesnicholson-men-s-fleece-jacket-jn-back': { x0: 29, x1: 70, y1: 87 },
  'id-identity-microfleece-jacke-front': { x0: 31, x1: 69, y1: 84 },
  'id-identity-microfleece-jacke-back': { x0: 31, x1: 69, y1: 84 },
  'jamesnicholson-ladies-fleece-jacket-jn781-front': { x0: 28, x1: 70, y1: 86 },
  'jamesnicholson-ladies-fleece-jacket-jn781-back': { x0: 30, x1: 70, y1: 87 },
  'bundc-microfleece-duo-id501-front': { x0: 29, x1: 71, y1: 86 },
  'bundc-microfleece-duo-id501-back': { x0: 26, x1: 71, y1: 86 },
  'bundc-microfleece-duo-id501-women-front': { x0: 31, x1: 69, y1: 86 },
  'bundc-microfleece-duo-id501-women-back': { x0: 30, x1: 69, y1: 88 },

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
  // Korrektur 2026-08-09: Ecken ragten bei XXL über die Schulterlinie hinaus
  // (objektiv per Pixelkontur geprüft, scripts/validateCorners.mjs).
  'justhoods-zoodie-front': { x0: 23.4, x1: 76.6, y0: 27.5, y1: 58 },
  'justhoods-zoodie-back': { x0: 24, x1: 76, y0: 31.8, y1: 81 },
  'justhoods-contrast-hoodie-front': { x0: 27, x1: 73, y1: 58 },
  'justhoods-contrast-hoodie-back': { x0: 27, x1: 73, y1: 81 },
  'bandc-inspire-hoodie-front': { x0: 31, x1: 69, y1: 58 },
  'bandc-inspire-hoodie-back': { x0: 31, x1: 69, y1: 80 },
  'bandc-inspire-zip-hood-front': { x0: 30, x1: 71, y1: 58 },
  'bandc-inspire-zip-hood-back': { x0: 30, x1: 71, y1: 80 },
  // Katalogweite Nachkalibrierung 2026-08-09, weitere Kapuzenware. Pocket-
  // Nahtoberkante und Bündchenhöhe je Produkt am eigenen Foto gemessen –
  // beides variiert deutlich zwischen den Schnitten (Vorderseite y52-69,
  // Rückseite y70-91).
  'gildan-heavy-blend-hooded-sweatshirt-front': { x0: 30, x1: 70, y1: 69 },
  'gildan-heavy-blend-hooded-sweatshirt-back': { x0: 30, x1: 70, y1: 87 },
  // Rückenfotos sind (bei allen Farben) On-Model-Aufnahmen statt Flachlage –
  // Bündchen dort gegen die Jeans abgelesen, unabhängig von der Vorderseite.
  'gildan-softstyle-midweight-sweat-adult-hoodie-front': { x0: 30, x1: 70, y1: 69 },
  // Korrektur 2026-08-09 (2. Durchgang): Ecken ragten bei XXL über die
  // Schulterlinie (siehe Kommentar bei den EarthPositive-Polos oben).
  // On-Model-Foto (nicht Flachlage wie die Vorderseite) – Kontur unruhiger,
  // daher zusätzlicher Sicherheitsabstand bei y0.
  'gildan-softstyle-midweight-sweat-adult-hoodie-back': { x0: 33.4, x1: 66.6, y0: 47, y1: 70 },
  'gildan-hammer-maxweight-adult-hooded-sweatshirt-front': { x0: 27.2, x1: 72.8, y0: 43.1, y1: 68 },
  'gildan-hammer-maxweight-adult-hooded-sweatshirt-back': { x0: 27, x1: 73, y1: 85 },
  'fruit-of-the-loom-classic-hooded-sweat-front': { x0: 24, x1: 76, y1: 57 },
  'fruit-of-the-loom-classic-hooded-sweat-back': { x0: 24, x1: 76, y1: 79 },
  'fruit-of-the-loom-premium-hooded-sweat-front': { x0: 24, x1: 76, y1: 59 },
  'fruit-of-the-loom-premium-hooded-sweat-back': { x0: 24, x1: 76, y1: 80 },
  'fruit-of-the-loom-lightweight-hooded-sweat-front': { x0: 30, x1: 70, y1: 59 },
  'fruit-of-the-loom-lightweight-hooded-sweat-back': { x0: 30, x1: 70, y1: 79 },
  'fruit-of-the-loom-iconic-premium-hooded-sweat-front': { x0: 28, x1: 72, y1: 62 },
  'fruit-of-the-loom-iconic-premium-hooded-sweat-back': { x0: 28, x1: 72, y1: 86 },
  'fruit-of-the-loom-iconic-250-hooded-sweat-front': { x0: 27, x1: 73, y1: 64 },
  'fruit-of-the-loom-iconic-250-hooded-sweat-back': { x0: 27, x1: 73, y1: 84 },
  'build-your-brand-heavy-hoody-front': { x0: 26, x1: 74, y1: 59 },
  // Rückenfoto: die Ärmel hängen ab der Achsel NEBEN dem Rumpf, dazwischen
  // Hintergrund. Rumpflauf je Zeile über alle 34 Farben (2026-09-03): ab y54
  // nur x31.9–68.2; der Saum liegt bei chocolate-brown/plum-purple schon bei
  // y83.5. Die frühere Box x26–74/y84 hatte ihre unteren Ecken im Spalt bzw.
  // auf dem Ärmel und lag bei zwei Farben unter dem Saum (Deckung bis 93,6 %).
  'build-your-brand-heavy-hoody-back': { x0: 32.4, x1: 67.7, y1: 82 },
  // Taillierter Damen-Hoodie, Ärmelansicht: die hintere Ärmelkante läuft im
  // unteren Drittel schräg nach innen (y65–80 bis x≈42). Die berechnete Kante
  // x40.7 lag dort bei 9 von 10 Farben ~1,5 % auf dem Hintergrund (Deckung
  // 98,2–98,6 %); über alle Farben sicher ab x41.8 (2026-09-03 gemessen).
  'russell-ladies-authentic-hood-sleeve_left': { x0: 42.5 },
  'build-your-brand-fluffy-hoody-front': { x0: 26, x1: 74, y1: 58 },
  'build-your-brand-fluffy-hoody-back': { x0: 26, x1: 74, y1: 80 },
  // Boxiger/kürzerer "Box"-Schnitt: Tasche und Bündchen sitzen beide
  // spürbar höher als bei den übrigen Hoodies – am eigenen Foto bestätigt.
  'build-your-brand-ultra-heavy-cotton-box-hoody-front': { x0: 27.6, x1: 72.4, y0: 30, y1: 52 },
  'build-your-brand-ultra-heavy-cotton-box-hoody-back': { x0: 25.8, x1: 74.2, y0: 28.3, y1: 71 },
  'build-your-brand-ladies-heavy-hoody-front': { x0: 26, x1: 74, y0: 29.2, y1: 58 },
  'build-your-brand-ladies-heavy-hoody-back': { x0: 24, x1: 76, y1: 79 },
  'bundc-id-223-hoodie-front': { x0: 27, x1: 73, y0: 42.4, y1: 67 },
  'bundc-id-223-hoodie-back': { x0: 30, x1: 70, y1: 80 },
  'bundc-influence-hoodie-front': { x0: 28, x1: 72, y1: 67 },
  'bundc-influence-hoodie-back': { x0: 28, x1: 72, y1: 80 },
  'bundc-hoodie-front': { x0: 31, x1: 69, y1: 66 },
  'bundc-hoodie-back': { x0: 30, x1: 70, y1: 90 },
  'earthpositive-earth-positive-pullover-hoodie-front': { x0: 26, x1: 74, y1: 60 },
  'earthpositive-earth-positive-pullover-hoodie-back': { x0: 26, x1: 74, y1: 87 },
  // Halb-Reißverschluss statt Känguru-Tasche – Sperrzone siehe EXCLUSION_ZONES.
  'earthpositive-earth-positive-women-s-half-zip-hoodie-front': { x0: 25, x1: 75, y1: 87 },
  'earthpositive-earth-positive-women-s-half-zip-hoodie-back': { x0: 25, x1: 75, y1: 87 },
  // Vorderseite: Lifestyle-/Model-Foto statt Flachlage-Foto, geringere
  // Messsicherheit – Breite von der (sauber vermessenen) Rückseite
  // übernommen, Tasche visuell mit starkem Kontrast-Boost bestätigt.
  // Korrektur 2026-08-09 (2. Durchgang): Ecken ragten bei XXL über die
  // Schulterlinie (siehe Kommentar bei den EarthPositive-Polos oben).
  'earthpositive-earth-positive-super-heavy-hoodie-front': { x0: 30.4, x1: 69.6, y0: 42.2, y1: 60 },
  'earthpositive-earth-positive-super-heavy-hoodie-back': { x0: 26, x1: 74, y1: 87 },
  // Keine Känguru-Tasche vorne (visuell bestätigt) – Bündchen-Logik statt Taschenkante.
  'earthpositive-earthpositive-organic-mensunisex-pullover-hoodie-front': { x0: 28, x1: 71, y1: 87 },
  'earthpositive-earthpositive-organic-mensunisex-pullover-hoodie-back': { x0: 29, x1: 71, y1: 91 },
  // Diagonale Eingrifftaschen statt zentraler Känguru-Tasche – keine
  // Mittelsperrzone nötig, Bündchen-Logik.
  'earthpositive-unisex-organic-pullover-hood-ep-front': { x0: 27, x1: 73, y1: 86 },
  'earthpositive-unisex-organic-pullover-hood-ep-back': { x0: 26, x1: 70, y1: 90 },
  'just-hoods-organic-hoodie-jh201-front': { x0: 30, x1: 70, y1: 60 },
  'just-hoods-organic-hoodie-jh201-back': { x0: 30, x1: 70, y1: 91 },
  'just-hoods-vision-heavyweight-hoodie-front': { x0: 30, x1: 70, y1: 59 },
  'just-hoods-vision-heavyweight-hoodie-back': { x0: 30, x1: 70, y1: 91 },
  'russell-authentic-hooded-sweat-front': { x0: 28, x1: 71, y1: 58 },
  'russell-authentic-hooded-sweat-back': { x0: 28, x1: 73, y1: 81 },
  // Taillierter Damenschnitt, echte Taillenverengung gemessen – nicht auf
  // volle Breite gezwungen.
  'russell-ladies-authentic-hood-front': { x0: 33, x1: 67, y1: 58 },
  'russell-ladies-authentic-hood-back': { x0: 31, x1: 69, y1: 80 },
  'russell-hooded-sweatshirt-front': { x0: 28, x1: 72, y1: 54 },
  'russell-hooded-sweatshirt-back': { x0: 28, x1: 72, y1: 81 },
  // Trotz Produktname kein Kapuzenpulli am Foto – schlichter Rundhals-
  // Sweater ohne Kapuze/Tasche, Bündchen-Logik.
  'just-hoods-signature-heavyweight-sweat-front': { x0: 27, x1: 73, y1: 82 },
  'just-hoods-signature-heavyweight-sweat-back': { x0: 27, x1: 73, y1: 75 },
  // Raglan-artiger Schnitt ohne erkennbare Rumpf/Ärmel-Kante im Foto –
  // bewusst moderater erweitert als die übrigen (niedrigere Messsicherheit).
  'jhk-hooded-sweater-front': { x0: 30, x1: 70, y1: 58 },
  'jhk-hooded-sweater-back': { x0: 30, x1: 70, y1: 82 },
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


interface GroessenBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  maxWidthCm: number;
  maxHeightCm: number;
  boxWidthCm: number;
  boxHeightCm: number;
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
  /** Fläche je Konfektionsgröße – NUR Torso-Ansichten (front/back), siehe
   *  Kommentar an der Berechnungsstelle. Schlüssel = Größenbezeichnung
   *  (`sizeGuide.measurements[].size`, z.B. "S"/"XL"). */
  bySize?: Record<string, GroessenBox>;
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
/** Maßtabelle des Klassenvertreters (gleicher Produkttyp) als Rückfallebene.
 *  Gibt zusätzlich die VOLLSTÄNDIGE Maßtabelle zurück, aus der `mass`
 *  stammt – Grundlage der größenabhängigen Torsoflächen (bySize) unten:
 *  jede Größe DIESER Tabelle bekommt eine eigene Fläche, kalibriert am
 *  selben Foto wie die Referenzgröße. */
function massVon(p: (typeof PRODUCTS)[number]) {
  const eigeneTabelle = p.sizeGuide?.measurements;
  const eigen = eigeneTabelle?.find((x) => x.size === 'M') ?? eigeneTabelle?.[0];
  if (eigen) return { mass: eigen, sizeTabelle: eigeneTabelle, geliehenVon: null as string | null };
  // Ohne eigene Maße wurde das Produkt bisher übersprungen und erbte die
  // Druckfläche des Klassenvertreters 1:1 – also dessen BILDrelative Koordinaten.
  // Da die Fotos unterschiedlich beschnitten sind, saß die Fläche dann falsch
  // (Box im Kragen). Mit geliehener Maßtabelle wird stattdessen die EIGENE
  // Bildkontur vermessen; nur die cm-Referenz stammt aus derselben Schnittgruppe.
  const rep = GEOMETRY_ALIAS[p.id];
  const repProd = rep ? PRODUCTS.find((x) => x.id === rep) : undefined;
  const geliehenTabelle = repProd?.sizeGuide?.measurements;
  const geliehen = geliehenTabelle?.find((x) => x.size === 'M') ?? geliehenTabelle?.[0];
  return {
    mass: geliehen,
    sizeTabelle: geliehen ? geliehenTabelle : undefined,
    geliehenVon: geliehen ? (rep ?? null) : null,
  };
}

for (const p of PRODUCTS) {
  const { mass, sizeTabelle, geliehenVon } = massVon(p);
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

    // Ärmellänge Schulter→Achsel – von berechneBox() unten per Closure
    // gelesen (Bandmitte des Bewegungsbereichs), größenunabhängig, da aus
    // der Frontkontur DIESES Produkts gemessen (siehe Vorlauf oben).
    const laenge = aermelLaengeCm.get(p.id);

    // ── Erst die REALEN Maße bestimmen, dann daraus die Box ──────────
    // Vorher liefen beide Größen getrennt: Die Box kam aus Kontur plus
    // Sicherheitsabständen, die cm-Werte aus Größentabelle plus
    // Prozessgrenze. Beide konnten nie übereinstimmen – gemessen wurden
    // vorne 62,5 cm gezeichnet gegen 47 cm angezeigt, am Ärmel 18,4 gegen
    // 13. Jetzt ist die Box die DARSTELLUNG der cm-Werte, eine Abweichung
    // ist damit konstruktiv ausgeschlossen.
    const quelle = !istAermel
      ? 'Kontur (Position) + Größentabelle (Maß)'
      : 'Kontur (Position) + Gruppenfläche Oberarm';

    // Waagerecht auf der Kleidungsstückmitte zentriert (Median über alle
    // Farbvarianten, siehe oben).
    const mitteX = (medianMitteProzent / 100) * w;
    // Fläche zusätzlich auf die engste Kante begrenzen.
    const grenzeLinksPx = (engsteLinks / 100) * w;
    const grenzeRechtsPx = (engsteRechts / 100) * w;

    // ── Box für EINE Maßtabellen-Zeile ──────────────────────────────────
    // Extrahiert, damit dieselbe Berechnung sowohl für die Referenzgröße
    // (Kalibrierung + die bisherigen Top-Level-Felder, byte-identisch zum
    // Vorgänger) als auch – NUR für Torso-Ansichten (front/back) – für JEDE
    // weitere Größe der Maßtabelle läuft (siehe bySize weiter unten).
    //
    // pxProCm bleibt dabei IMMER an der Referenzgröße kalibriert (Closure
    // über die äußere Konstante): Das Foto zeigt ein einziges, real
    // existierendes Kleidungsstück – ein je Zielgröße neu berechneter
    // Maßstab würde dasselbe Foto fälschlich als unterschiedlich groß
    // interpretieren. Es ändert sich nur, WIE VIEL cm Fläche für die
    // jeweilige Größe angefordert wird (massZeile.breiteCm/hoeheCm) – die
    // Ärmelfläche bleibt davon ohnehin unberührt (die Prozessgrenze
    // grenze.maxWidthCm ist größenunabhängig, siehe Kommentar oben).
    function berechneBox(massZeile: { breiteCm: number; hoeheCm: number }) {
      // ── Größenverhältnis zur Referenzgröße ──────────────────────────────
      // Das Foto zeigt EIN reales Kleidungsstück (die Referenzgröße, i.d.R.
      // 'M'). Alle aus dem Foto GEMESSENEN Sicherheitsgrenzen (engste Kante,
      // Zeilen-Perzentil, hand-kalibrierte BEREICH_KORREKTUR) beschreiben
      // deshalb strenggenommen nur DIESES eine Kleidungsstück – ohne weitere
      // Behandlung blieben sie für JEDE Größe gleich, und die Fläche würde nie
      // größer als bei der Referenzgröße (empirisch geprüft: 0 von 308
      // Torso-Ansichten zeigten dann überhaupt eine Größenabhängigkeit, weil
      // diese Fotogrenzen praktisch immer enger sind als die Prozessgrenze).
      //
      // Deshalb werden die photobasierten Grenzen um denselben Faktor
      // skaliert, um den sich auch die Herstellermaße dieser Größe gegenüber
      // der Referenzgröße unterscheiden – dieselbe Näherung (Schnitt skaliert
      // über die Größenreihe näherungsweise gleichmäßig), die auch die
      // Zylinder-Projektion oben für die Torsobreite trifft. Bei der
      // Referenzgröße selbst ist ratio exakt 1 – die Top-Level-Felder bleiben
      // dadurch unverändert (mit dem Vorgänger-Generator reproduktionsgeprüft).
      const breiteRatio = massZeile.breiteCm / mass.breiteCm;
      const hoeheRatio = massZeile.hoeheCm / mass.hoeheCm;
      const skaliereX = (px: number) => mitteX + (px - mitteX) * breiteRatio;

      let breiteCmLokal: number;
      let hoeheNutzbarCmLokal: number;
      if (!istAermel) {
        breiteCmLokal = Math.min(massZeile.breiteCm - 2 * ABSTAND.seitennaht, grenze.maxWidthCm);
        hoeheNutzbarCmLokal = Math.min(massZeile.hoeheCm - ABSTAND.kragen - ABSTAND.saum, grenze.maxHeightCm);
      } else {
        // KORREKTUR (2026-09-04, Betreiber-Auskunft): DTF-Transfers haben
        // laut Betreiber KEINE eigene Formatobergrenze der Presse – die
        // einzige echte Grenze ist der Ärmel selbst. `grenze.maxWidthCm`
        // (Stickerei-Stickrahmen-Breite, siehe DECORATION_POSITIONS) ist
        // deshalb für DTF NICHT die richtige Obergrenze; Infinity lässt die
        // Breite ausschließlich durch die tatsächliche, für DIESES Produkt
        // gemessene Bewegungsbereichsbreite (vollX0/vollX1 unten, deckelt
        // am Ende erneut bei Zeile ~1428) begrenzen – echte Einzelfall-
        // Prüfung statt eines produktübergreifenden Werts. Die methoden-
        // spezifische Stickerei-Deckelung (Stickrahmen 30×19cm) sitzt in
        // printAreas.ts (buildAreasForProduct), wo DTF/Stickerei bereits
        // getrennt gebaut werden – hier im Generator entsteht bewusst nur
        // EINE, methodenneutrale (= DTF-taugliche) Fläche.
        //
        // Bewusst ein großer ENDLICHER Platzhalter statt Infinity: weiter
        // unten geht `breitePxLokal` (= breiteCmLokal * pxProCm) über
        // `x0pxLokal = mitteX - breitePxLokal/2` in die Berechnung von
        // `startXCmLokal` ein – dort hebt sich breitePxLokal rechnerisch
        // exakt wieder heraus (x0pxLokal + breitePxLokal/2 = mitteX für
        // JEDEN endlichen Wert), mit Infinity entstünde dagegen NaN
        // (-Infinity + Infinity). 500 cm liegt weit über jedem denkbaren
        // Kleidungsstück – die tatsächlich bindende Grenze bleibt in jedem
        // Fall der Bewegungsbereich (Zeile ~1428).
        breiteCmLokal = 500;
        hoeheNutzbarCmLokal = grenze.maxHeightCm;
      }

      // Umrechnung ISOTROP über px/cm aus der Bildhöhe – derselbe Faktor, den
      // auch cmConversion im Canvas verwendet. Nur so entspricht ein
      // angezeigter Zentimeterwert exakt der gezeichneten Strecke.
      const breitePxLokal = breiteCmLokal * pxProCm;
      const hoehePxBoxLokal = hoeheNutzbarCmLokal * pxProCm;

      let x0pxLokal = mitteX - breitePxLokal / 2;
      let x1pxLokal = mitteX + breitePxLokal / 2;
      // Nie über die (größenskalierte) engste Stoffkante hinaus – auch nicht,
      // wenn das Herstellermaß mehr zuließe.
      if (!istAermel) {
        const naht = ABSTAND.seitennaht * pxProCm;
        x0pxLokal = Math.max(x0pxLokal, skaliereX(grenzeLinksPx) + naht);
        x1pxLokal = Math.min(x1pxLokal, skaliereX(grenzeRechtsPx) - naht);
      }

      const bandMitteLokal = laenge
        ? ySchulter + (laenge / 2) * pxProCm
        : ySchulter + ((AERMEL_BAND_VON + AERMEL_BAND_BIS) / 2) * massZeile.hoeheCm * pxProCm;
      let y0pxLokal = istAermel ? bandMitteLokal - hoehePxBoxLokal / 2 : ySchulter + ABSTAND.kragen * pxProCm;
      let y1pxLokal = y0pxLokal + hoehePxBoxLokal;

      let startXCmLokal: number | undefined;
      let startYCmLokal: number | undefined;
      if (istAermel) {
        const naht = ABSTAND.aermelnaht * pxProCm;
        const silhLinksPx = (silhouetteLinks / 100) * w;
        const silhRechtsPx = (silhouetteRechts / 100) * w;

        const vollX0 = silhLinksPx + naht;
        const vollX1 = silhRechtsPx - naht;
        const mitteBox = (vollX0 + vollX1) / 2;
        const halbBreiteVoll = (vollX1 - vollX0) / 2;

        // KORREKTUR 2026-08-09: y0/y1 waren bisher einfach yOben/yUnten (die
        // Silhouetten-Ober-/Unterkante) plus Nahtabstand – das ignoriert,
        // dass eine Ärmelaufnahme oben an der Ärmelkappe UND unten am
        // Bündchen/Saum GERUNDET zuläuft (kein rechteckiger Umriss). Eine
        // rechteckige Box mit voller Breite (vollX0..vollX1) ragte dadurch
        // mit ihren Ecken über die Rundung hinaus – objektiv gefunden mit
        // scripts/validateCorners.mjs (143 von 143 Ärmelansichten betroffen,
        // durchweg y0 nahe 0).
        //
        // Sichere Zeile über ALLE Farbvarianten geprüft (nicht nur
        // profile[0] – andere Kamera-/Zuschnittposition je Foto), links und
        // rechts UNABHÄNGIG voneinander gesucht (eine Kapuze/Kordel/ein Falz
        // kann die Kante einseitig auf ganz anderer Höhe erzeugen als die
        // Gegenseite). Sobald eine Seite ab einer Zeile sicher ist, bleibt
        // sie es beim Weiterlaufen Richtung Zylindermitte auch – deshalb
        // genügt die höhere (bzw. tiefere) der beiden Einzelgrenzen.
        // randPuffer: zusätzlicher Sicherheitsabstand innerhalb der Kontur
        // (nicht nur exakt an der Kante) – fängt kleine Skalierungs-/
        // Rundungsunterschiede zwischen dem bei der Generierung genutzten
        // Referenzfoto und dem bei der Validierung (ggf. anderes Farbfoto,
        // andere Pixelmaße) genutzten Foto ab, die exakt an der Kante sonst
        // vereinzelt als hauchdünne Verletzung durchrutschten.
        const randPuffer = naht * 0.5;
        const sicherBeiY = (y: number, x0: number, x1: number, seite: 'links' | 'rechts') => {
          for (const prof of profile) {
            const skalaY = prof.h / h;
            const skalaX = prof.w / w;
            const vy = Math.max(0, Math.min(prof.h - 1, Math.round(y * skalaY)));
            const z = prof.zeilen[vy];
            if (!z || z.breite === 0) return false;
            if (seite === 'links' && z.links / skalaX > x0 - randPuffer) return false;
            if (seite === 'rechts' && z.rechts / skalaX < x1 + randPuffer) return false;
          }
          return true;
        };
        const ersteSichereZeile = (
          von: number,
          bis: number,
          schritt: 1 | -1,
          x0: number,
          x1: number,
          seite: 'links' | 'rechts'
        ) => {
          for (let y = von; schritt === 1 ? y <= bis : y >= bis; y += schritt) {
            if (sicherBeiY(y, x0, x1, seite)) return y;
          }
          return null;
        };
        // Liefert null, wenn diese Breite an KEINER Zeile im Suchbereich
        // sicher ist – sonst würde ein "nichts gefunden" (Fallback auf
        // yOben/yUnten) fälschlich wie eine bereits am Rand sichere, volle
        // Höhe aussehen und in der Flächen-Abwägung unten eine ECHT sichere,
        // aber schmalere/flachere Alternative verdrängen (die eigentliche
        // Ursache der zunächst übersehenen Restfälle).
        const sichererHoehenbereich = (x0: number, x1: number) => {
          const linksAbOben = ersteSichereZeile(yOben, yUnten, 1, x0, x1, 'links');
          const rechtsAbOben = ersteSichereZeile(yOben, yUnten, 1, x0, x1, 'rechts');
          if (linksAbOben === null || rechtsAbOben === null) return null;
          const yObenSicher = Math.max(linksAbOben, rechtsAbOben);

          const linksAbUnten = ersteSichereZeile(yUnten, yOben, -1, x0, x1, 'links');
          const rechtsAbUnten = ersteSichereZeile(yUnten, yOben, -1, x0, x1, 'rechts');
          if (linksAbUnten === null || rechtsAbUnten === null) return null;
          const yUntenSicher = Math.min(linksAbUnten, rechtsAbUnten);

          return {
            y0: Math.max(yOben + naht, yObenSicher + naht * 0.3),
            y1: Math.min(yUnten - naht, yUntenSicher - naht * 0.3),
          };
        };

        // Breite/Höhe-Abwägung: die volle, aus der Silhouette abgeleitete
        // Breite (vollX0..vollX1) lässt sich nicht bei jeder Ärmelaufnahme
        // über eine brauchbare Höhe sicher halten – bei schräg fotografierten
        // Kapuzenärmeln (Kapuzenansatz zieht die sichere Mitte mit der Höhe
        // seitlich) kollabierte der Höhenbereich sonst auf wenige Pixel.
        // Stattdessen wird die Breite in Schritten von der Mitte her
        // eingezogen und je Schritt der resultierende sichere Höhenbereich
        // bestimmt; gewählt wird die Kombination mit der GRÖSSTEN Fläche –
        // dieselbe Abwägung, mit der die Eckenverletzungen bei front/back
        // bereits behoben wurden (schmaler statt flacher, wo das mehr Fläche
        // erhält). Bei einer unproblematischen (rechteckigen) Kontur bleibt
        // Schritt 0 (volle Breite) der Sieger – das Ergebnis dann unverändert.
        // Fallback nur, falls WIRKLICH keine der 26 Breiten (bis 75% eingezogen)
        // irgendwo sicher ist – dann bleibt der alte Zustand erhalten, statt
        // mit einer erfundenen Fläche zu enden.
        let beste: { x0: number; x1: number; y0: number; y1: number; flaeche: number } | null = null;
        for (let schritt = 0; schritt <= 25; schritt++) {
          const frac = schritt * 0.03;
          const x0 = mitteBox - halbBreiteVoll * (1 - frac);
          const x1 = mitteBox + halbBreiteVoll * (1 - frac);
          const ergebnis = sichererHoehenbereich(x0, x1);
          if (!ergebnis) continue; // an dieser Breite nirgends sicher – schmaler versuchen
          const flaeche = Math.max(0, x1 - x0) * Math.max(0, ergebnis.y1 - ergebnis.y0);
          if (!beste || flaeche > beste.flaeche) beste = { x0, x1, y0: ergebnis.y0, y1: ergebnis.y1, flaeche };
        }
        if (!beste) beste = { x0: vollX0, x1: vollX1, y0: yOben + naht, y1: yUnten - naht, flaeche: 0 };

        startXCmLokal = (x0pxLokal + breitePxLokal / 2 - beste.x0) / pxProCm;
        startYCmLokal = (y0pxLokal + hoehePxBoxLokal / 2 - beste.y0) / pxProCm;

        x0pxLokal = beste.x0;
        x1pxLokal = beste.x1;
        y0pxLokal = beste.y0;
        y1pxLokal = beste.y1 > beste.y0 ? beste.y1 : beste.y0 + naht; // Entartung ausschließen
      }

      if (!istAermel) {
        const naht = ABSTAND.seitennaht * pxProCm;
        const linksWerte: number[] = [];
        const rechtsWerte: number[] = [];
        for (const prof of profile) {
          const skalaY = prof.h / h;
          const skalaX = prof.w / w;
          const vy0 = Math.max(0, Math.round(y0pxLokal * skalaY));
          const vy1 = Math.min(prof.h - 1, Math.round(y1pxLokal * skalaY));
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
          const engL = skaliereX(perzentil(linksWerte, 0.98));
          const engR = skaliereX(perzentil(rechtsWerte, 0.02));
          if (engR > engL) {
            x0pxLokal = Math.max(x0pxLokal, engL + naht);
            x1pxLokal = Math.min(x1pxLokal, engR - naht);
          }
        }
      }

      // BEREICH_KORREKTUR ist am Foto der Referenzgröße abgelesen – dieselbe
      // Skalierung wie oben, damit ein hand-kalibriertes Produkt nicht auf
      // die Referenzgröße eingefroren bleibt. x skaliert um die Bildmitte
      // (mitteX); y ist am KRAGEN verankert (y0 bewegt sich mit der Größe
      // nicht – der Kragen sitzt bei jeder Größe an derselben Schulterlinie),
      // der SAUM (y1) rückt bei einer größeren Größe weiter nach unten.
      const korrektur = BEREICH_KORREKTUR[`${p.id}-${view}`];
      if (korrektur) {
        const x0Vorher = x0pxLokal;
        const y0Vorher = y0pxLokal;
        if (korrektur.x0 !== undefined) x0pxLokal = skaliereX((korrektur.x0 / 100) * w);
        if (korrektur.x1 !== undefined) x1pxLokal = skaliereX((korrektur.x1 / 100) * w);
        const y0Basis = korrektur.y0 !== undefined ? (korrektur.y0 / 100) * h : y0pxLokal;
        if (korrektur.y0 !== undefined) y0pxLokal = y0Basis;
        if (korrektur.y1 !== undefined) {
          const y1Basis = (korrektur.y1 / 100) * h;
          y1pxLokal = y0Basis + (y1Basis - y0Basis) * hoeheRatio;
        }
        // Ärmel: startXCm/startYCm (Oberarmmitte) sind als Abstand zur linken/
        // oberen Boxkante abgelegt. Verschiebt die Korrektur diese Kante, bleibt
        // die Startstelle im Bild stehen – nur ihr Abstand zur neuen Kante ändert sich.
        if (istAermel && startXCmLokal !== undefined && startYCmLokal !== undefined) {
          startXCmLokal -= (x0pxLokal - x0Vorher) / pxProCm;
          startYCmLokal -= (y0pxLokal - y0Vorher) / pxProCm;
        }
      }

      // Letzte, unbedingte Grenze: nie über den Bildrand hinaus. Für die
      // Referenzgröße (ratio=1) unwirksam (die bisherige Kontur-Klemme sitzt
      // immer innerhalb des Bildes); erst bei stark skalierten Größen
      // relevant, falls die hochskalierte Foto-Grenze rechnerisch über den
      // tatsächlichen Bildausschnitt hinausliefe.
      x0pxLokal = Math.max(x0pxLokal, 0);
      x1pxLokal = Math.min(x1pxLokal, w);
      y0pxLokal = Math.max(y0pxLokal, 0);
      y1pxLokal = Math.min(y1pxLokal, h);

      breiteCmLokal = Math.min(breiteCmLokal, (x1pxLokal - x0pxLokal) / pxProCm);
      hoeheNutzbarCmLokal = Math.min(hoeheNutzbarCmLokal, (y1pxLokal - y0pxLokal) / pxProCm);

      return {
        x0px: x0pxLokal,
        y0px: y0pxLokal,
        x1px: x1pxLokal,
        y1px: y1pxLokal,
        maxWidthCm: Number(breiteCmLokal.toFixed(1)),
        maxHeightCm: Number(hoeheNutzbarCmLokal.toFixed(1)),
        boxWidthCm: Number(((x1pxLokal - x0pxLokal) / pxProCm).toFixed(1)),
        boxHeightCm: Number(((y1pxLokal - y0pxLokal) / pxProCm).toFixed(1)),
        startXCm: startXCmLokal !== undefined ? Number(Math.max(0, startXCmLokal).toFixed(1)) : undefined,
        startYCm: startYCmLokal !== undefined ? Number(Math.max(0, startYCmLokal).toFixed(1)) : undefined,
      };
    }

    const referenzBox = berechneBox(mass);

    // ── Senkrechte Lage, Ärmel-Bewegungsbereich, Zeilen-Gegenprobe,
    // BEREICH_KORREKTUR und finale cm-Ableitung: siehe berechneBox() oben –
    // referenzBox trägt bereits das vollständige, für die Referenzgröße
    // (mass) berechnete Ergebnis.
    const proz = (v: number, g: number) => Number(((v / g) * 100).toFixed(1));

    // ── Größenabhängige Torsoflächen (front/back) ───────────────────────
    // Jede Größe der Maßtabelle bekommt ihre EIGENE Fläche (dieselbe
    // Berechnung wie referenzBox, nur mit den cm-Maßen dieser Größe statt
    // der Referenzgröße) – eine XL bekommt dadurch tatsächlich mehr nutzbare
    // Breite als eine S, eine S nie mehr, als ihr Schnitt hergibt. Ärmel
    // bleiben bewusst außen vor (die Prozessgrenze ist bereits
    // größenunabhängig, siehe Kommentar oben) – kein bySize für Ärmelansichten.
    let bySize: Record<string, GroessenBox> | undefined;
    if (!istAermel && sizeTabelle && sizeTabelle.length > 0) {
      bySize = {};
      for (const zeile of sizeTabelle) {
        const box = berechneBox(zeile);
        bySize[zeile.size] = {
          x0: proz(box.x0px, w),
          y0: proz(box.y0px, h),
          x1: proz(box.x1px, w),
          y1: proz(box.y1px, h),
          maxWidthCm: box.maxWidthCm,
          maxHeightCm: box.maxHeightCm,
          boxWidthCm: box.boxWidthCm,
          boxHeightCm: box.boxHeightCm,
        };
      }
    }

    proProdukt[view] = {
      // Ärmel: rein informativ inzwischen identisch zu maxWidthCm (siehe
      // referenzBox.maxWidthCm unten) – es gibt keinen separaten "Rohwert"
      // mehr, seit die Breite ausschließlich aus dem Bewegungsbereich
      // dieses Produkts abgeleitet wird (kein Rückgriff auf eine
      // Prozessgrenze für DTF).
      garmentWidthCm: Number((istAermel ? referenzBox.maxWidthCm : mass.breiteCm - 2 * ABSTAND.seitennaht).toFixed(1)),
      garmentHeightCm: Number((istAermel ? grenze.maxHeightCm : mass.hoeheCm - ABSTAND.kragen - ABSTAND.saum).toFixed(1)),
      x0: proz(referenzBox.x0px, w),
      y0: proz(referenzBox.y0px, h),
      x1: proz(referenzBox.x1px, w),
      y1: proz(referenzBox.y1px, h),
      imgW: w,
      imgH: h,
      maxWidthCm: referenzBox.maxWidthCm,
      maxHeightCm: referenzBox.maxHeightCm,
      boxWidthCm: referenzBox.boxWidthCm,
      boxHeightCm: referenzBox.boxHeightCm,
      ...(referenzBox.startXCm !== undefined && referenzBox.startYCm !== undefined
        ? { startXCm: referenzBox.startXCm, startYCm: referenzBox.startYCm }
        : {}),
      ...(bySize ? { bySize } : {}),
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
  '  /** Fläche je Konfektionsgröße – NUR Torso-Ansichten (front/back), aus',
  '   *  derselben Bildkontur wie oben, aber mit den cm-Maßen DIESER Größe',
  '   *  statt der Referenzgröße berechnet (siehe generatePrintAreaData.mts,',
  '   *  berechneBox()). Ärmelflächen sind größenunabhängig konstant, deshalb',
  '   *  hier nie gesetzt. Schlüssel = sizeGuide.measurements[].size. */',
  '  bySize?: Record<string, {',
  '    x0: number; y0: number; x1: number; y1: number;',
  '    maxWidthCm: number; maxHeightCm: number;',
  '    boxWidthCm: number; boxHeightCm: number;',
  '  }>;',
  '}',
  '',
  'export const PRINT_AREA_DATA: Record<string, Partial<Record<PrintView, GeneratedArea>>> = {',
];

function serialisiereBySize(bySize: Record<string, GroessenBox> | undefined): string {
  if (!bySize) return '';
  const eintraege = Object.entries(bySize)
    .map(([groesse, g]) => `'${groesse}': { x0: ${g.x0}, y0: ${g.y0}, x1: ${g.x1}, y1: ${g.y1}, maxWidthCm: ${g.maxWidthCm}, maxHeightCm: ${g.maxHeightCm}, boxWidthCm: ${g.boxWidthCm}, boxHeightCm: ${g.boxHeightCm} }`)
    .join(', ');
  return ` bySize: { ${eintraege} },`;
}

for (const [id, views] of Object.entries(ergebnis)) {
  zeilenAus.push(`  '${id}': {`);
  for (const [view, b] of Object.entries(views)) {
    zeilenAus.push(
      `    ${view}: { x0: ${b!.x0}, y0: ${b!.y0}, x1: ${b!.x1}, y1: ${b!.y1}, imgW: ${b!.imgW}, imgH: ${b!.imgH}, maxWidthCm: ${b!.maxWidthCm}, maxHeightCm: ${b!.maxHeightCm}, boxWidthCm: ${b!.boxWidthCm}, boxHeightCm: ${b!.boxHeightCm},${b!.startXCm !== undefined ? ` startXCm: ${b!.startXCm}, startYCm: ${b!.startYCm},` : ''} garmentWidthCm: ${b!.garmentWidthCm}, garmentHeightCm: ${b!.garmentHeightCm},${serialisiereBySize(b!.bySize)} },`
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
