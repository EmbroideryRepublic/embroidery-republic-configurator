/**
 * Konturbasierte Ermittlung der Veredelungsflächen aus den echten Produktfotos.
 *
 * Ersetzt die bisherige Logik „Bounding-Box minus pauschale 3 Prozentpunkte".
 * Statt eines generischen Rechtecks werden die drei Grenzen, die in der
 * Produktion wirklich zählen, einzeln aus dem Bild bestimmt:
 *
 *   OBEN   – Unterkante des Halsausschnitts. Erkennbar daran, dass die
 *            Halsöffnung ein LOCH in der Silhouette ist: In diesen Zeilen
 *            liegen weniger Kleidungspixel vor, als die Zeilenbreite hergibt.
 *            Die letzte solche Zeile ist die Kragenunterkante.
 *   SEITEN – Torsobreite unterhalb der Achsel. Die Achsel zeigt sich als
 *            deutlicher Breitensprung: oberhalb stehen die Ärmel seitlich ab
 *            (Maximalbreite), unterhalb bleibt nur der Rumpf.
 *   UNTEN  – Saumkante minus Sicherheitsabstand.
 *
 * Sicherheitsabstände werden in ZENTIMETERN angesetzt und über die bekannte
 * Kleidungsstückhöhe in Prozent umgerechnet – nicht als feste Prozentwerte.
 * Ein Damenshirt (64 cm) bekommt dadurch denselben realen Nahtabstand wie ein
 * Hoodie (72 cm), nicht denselben prozentualen.
 *
 * Aufruf: node scripts/computePrintAreas.mjs <bild> <referenzhoeheCm> [--json]
 */
import { zeilenProfil } from './analyzeGarmentContour.mjs';

/** Reale Sicherheitsabstände in cm – Werte aus der Veredelungspraxis. */
export const ABSTAND_CM = {
  kragen: 2.5, // unterhalb des Halsausschnitts
  seitennaht: 2.0, // zur Seitennaht
  saum: 3.0, // oberhalb des Saums
};

/**
 * Erkennt die Kragenunterkante über das Loch in der Silhouette.
 * Gibt die Bildzeile zurück, ab der die Halsöffnung geschlossen ist.
 */
function kragenUnterkante(zeilen, yOben, yUnten) {
  // Nur die oberen 30 % durchsuchen. Weiter unten erzeugen Falten und
  // Schattenkanten ebenfalls Lücken in der Maske – die erste Fassung hielt
  // eine solche Lücke auf 41 % Bildhöhe für den Kragen und schnitt damit
  // die komplette Brustfläche ab.
  const suchbereich = yOben + Math.round((yUnten - yOben) * 0.3);
  // Die obersten Zeilen sind Kantenglättung, kein Halsausschnitt.
  const start = yOben + Math.max(2, Math.round((yUnten - yOben) * 0.01));

  let letztesLoch = -1;
  for (let y = start; y <= suchbereich; y++) {
    const z = zeilen[y];
    if (z.breite === 0) continue;
    // Ein Loch liegt vor, wenn spürbar weniger Pixel gefüllt sind als die
    // Zeile breit ist. 8 % Toleranz deckt Kompressionsartefakte ab.
    if (z.anzahl < z.breite * 0.92) letztesLoch = y;
  }
  return letztesLoch;
}

/**
 * Bestimmt die Achselhöhe: die Zeile des stärksten Breitenrückgangs
 * unterhalb der breitesten Stelle. Liefert null, wenn es keinen klaren
 * Sprung gibt – dann liegen die Ärmel am Körper an (typisch für Hoodies und
 * Sweatshirts) und der Rumpf lässt sich NICHT aus der Kontur ableiten.
 */
function achselHoehe(zeilen, yOben, yUnten) {
  let yMax = yOben;
  let maxBreite = 0;
  const obereHaelfte = yOben + Math.round((yUnten - yOben) * 0.6);
  for (let y = yOben; y <= obereHaelfte; y++) {
    if (zeilen[y].breite > maxBreite) {
      maxBreite = zeilen[y].breite;
      yMax = y;
    }
  }

  // Ab der breitesten Stelle abwärts den größten Rückgang suchen.
  //
  // WICHTIG: Die Suche endet bei 65 % der Kleidungsstückhöhe. Sonst gewinnt
  // immer die SAUMKANTE – dort fällt die Breite vom vollen Torso auf null,
  // was jeden Achselsprung übertrifft. Genau daran ist die erste Fassung
  // gescheitert (yAchsel landete auf der untersten Bildzeile).
  const suchEnde = yOben + Math.round((yUnten - yOben) * 0.65);
  let besterAbfall = 0;
  let yAchsel = null;
  const fenster = Math.max(3, Math.round((yUnten - yOben) * 0.02));
  for (let y = yMax; y + fenster <= suchEnde; y++) {
    const abfall = zeilen[y].breite - zeilen[y + fenster].breite;
    if (abfall > besterAbfall) {
      besterAbfall = abfall;
      yAchsel = y + fenster;
    }
  }

  // Der Sprung muss substanziell sein (>15 % der Maximalbreite), sonst ist
  // es kein Achselübergang, sondern normale Silhouettenkrümmung.
  if (besterAbfall < maxBreite * 0.15) return { yAchsel: null, maxBreite, abfall: besterAbfall };
  return { yAchsel, maxBreite, abfall: besterAbfall };
}

/** Median – robuster gegen einzelne Ausreißerzeilen als der Mittelwert. */
function median(werte) {
  const s = [...werte].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

export async function berechneFlaeche(pfad, referenzHoeheCm) {
  const { w, h, zeilen } = await zeilenProfil(pfad);
  const belegt = zeilen.filter((z) => z.breite > 0);
  if (belegt.length === 0) return { ok: false, grund: 'kein-kleidungsstueck' };

  const yOben = belegt[0].y;
  const yUnten = belegt[belegt.length - 1].y;
  const hoehePx = yUnten - yOben + 1;
  const pxProCm = hoehePx / referenzHoeheCm;

  const yKragen = kragenUnterkante(zeilen, yOben, yUnten);
  const { yAchsel, maxBreite, abfall } = achselHoehe(zeilen, yOben, yUnten);

  // Torsobreite aus dem Bereich unterhalb der Achsel (Median über alle
  // Zeilen dort – unempfindlich gegen Falten und Schattenkanten).
  const torsoVon = yAchsel ?? yOben + Math.round(hoehePx * 0.55);
  const torsoBis = yUnten - Math.round(hoehePx * 0.05);
  const torsoZeilen = zeilen.slice(torsoVon, torsoBis + 1).filter((z) => z.breite > 0);
  if (torsoZeilen.length === 0) return { ok: false, grund: 'kein-torso' };

  const links = median(torsoZeilen.map((z) => z.links));
  const rechts = median(torsoZeilen.map((z) => z.rechts));

  // Sicherheitsabstände von cm in Pixel.
  const abstandSeite = ABSTAND_CM.seitennaht * pxProCm;
  const abstandSaum = ABSTAND_CM.saum * pxProCm;
  const abstandKragen = ABSTAND_CM.kragen * pxProCm;

  const x0 = links + abstandSeite;
  const x1 = rechts - abstandSeite;
  // Ohne erkannten Kragen (Rückansicht hat oft keine Öffnung) greift die
  // Schulterlinie plus Abstand.
  const y0 = (yKragen > 0 ? yKragen : yOben + hoehePx * 0.16) + abstandKragen;
  const y1 = yUnten - abstandSaum;

  const proz = (v, gesamt) => Number(((v / gesamt) * 100).toFixed(1));

  return {
    ok: true,
    // Ärmel liegen am Körper an -> Rumpf nicht aus der Kontur trennbar.
    torsoAusKontur: yAchsel !== null,
    diagnose: {
      pxProCm: Number(pxProCm.toFixed(2)),
      kragenErkannt: yKragen > 0,
      achselErkannt: yAchsel !== null,
      abfallAnteil: Number((abfall / maxBreite).toFixed(2)),
      torsoBreiteCm: Number(((rechts - links) / pxProCm).toFixed(1)),
      nutzbarBreiteCm: Number(((x1 - x0) / pxProCm).toFixed(1)),
      nutzbarHoeheCm: Number(((y1 - y0) / pxProCm).toFixed(1)),
    },
    box: { x0: proz(x0, w), y0: proz(y0, h), x1: proz(x1, w), y1: proz(y1, h), imgW: w, imgH: h },
  };
}

if (process.argv[1] && process.argv[1].endsWith('computePrintAreas.mjs')) {
  const pfad = process.argv[2];
  const hoehe = Number(process.argv[3] ?? 70);
  const r = await berechneFlaeche(pfad, hoehe);
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(r));
  } else if (!r.ok) {
    console.log(`FEHLER: ${r.grund}`);
  } else {
    console.log(`${pfad}  (Referenzhöhe ${hoehe} cm)`);
    console.log(`  Torso aus Kontur : ${r.torsoAusKontur ? 'ja' : 'NEIN – Ärmel liegen an'}`);
    console.log(`  Kragen erkannt   : ${r.diagnose.kragenErkannt ? 'ja' : 'nein'}`);
    console.log(`  Achselabfall     : ${(r.diagnose.abfallAnteil * 100).toFixed(0)}% der Maximalbreite`);
    console.log(`  Torsobreite      : ${r.diagnose.torsoBreiteCm} cm`);
    console.log(`  Nutzbar          : ${r.diagnose.nutzbarBreiteCm} x ${r.diagnose.nutzbarHoeheCm} cm`);
    console.log(`  Box              : ${JSON.stringify(r.box)}`);
  }
}
