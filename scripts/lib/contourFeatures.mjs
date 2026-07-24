/**
 * Reproduzierbare Konturmerkmale eines Kleidungsstücks.
 *
 * Ersetzt die frühere Achselerkennung „größter Breitenrückgang". Die
 * funktionierte nur bei abstehenden Ärmeln (T-Shirt, Polo) und versagte bei
 * anliegenden (Hoodie, Sweatshirt, Longsleeve) – dort gibt es keinen Abfall.
 *
 * ── Das gemeinsame Merkmal ────────────────────────────────────────────
 * Von der Schulter abwärts nimmt die Silhouettenbreite zu, weil die Ärmel
 * hinzukommen. Auf Achselhöhe ist dieser Zuwachs abgeschlossen: Darunter
 * bleibt die Breite konstant (anliegende Ärmel) oder fällt ab (abstehende
 * Ärmel). Beide Fälle sind derselbe Übergang – ein KNICK im Breitenverlauf.
 *
 * Der Knick wird als stärkste negative Krümmung (zweite Ableitung) des
 * geglätteten Breitenprofils bestimmt. Das ist ein rein geometrisches
 * Merkmal, unabhängig von Schnitt, Marke und Bildausschnitt, und liefert für
 * abstehende wie anliegende Ärmel dieselbe Größe.
 */

/** Gleitender Mittelwert – dämpft Kompressionsrauschen der Kantenpixel. */
export function glaette(werte, fenster) {
  const halb = Math.max(1, Math.floor(fenster / 2));
  return werte.map((_, i) => {
    const von = Math.max(0, i - halb);
    const bis = Math.min(werte.length - 1, i + halb);
    let summe = 0;
    for (let j = von; j <= bis; j++) summe += werte[j];
    return summe / (bis - von + 1);
  });
}

/**
 * Findet Schulterlinie und Achselhöhe im Breitenprofil.
 *
 * @param zeilen  Zeilenprofil aus analyzeGarmentContour
 * @param yOben   erste Zeile mit Kleidungsstück
 * @param yUnten  letzte Zeile mit Kleidungsstück
 */
export function findeAermelansatz(zeilen, yOben, yUnten) {
  const hoehe = yUnten - yOben + 1;
  const roh = [];
  for (let y = yOben; y <= yUnten; y++) roh.push(zeilen[y].breite);

  // Fenster ~3 % der Höhe: genug Glättung, ohne den Knick zu verwischen.
  const fenster = Math.max(5, Math.round(hoehe * 0.03));
  const b = glaette(roh, fenster);

  // Erste Ableitung (Breitenzuwachs je Zeile).
  const d1 = b.map((v, i) => (i === 0 ? 0 : v - b[i - 1]));
  const d1g = glaette(d1, fenster);

  // Zweite Ableitung: der stärkste NEGATIVE Wert markiert den Übergang von
  // „wird schnell breiter" zu „bleibt gleich / wird schmaler" – die Achsel.
  const d2 = d1g.map((v, i) => (i === 0 ? 0 : v - d1g[i - 1]));

  // Suchfenster: 12 % bis 60 % der Höhe. Oberhalb liegt der Kragen, unterhalb
  // die Saumkante – beide erzeugen ebenfalls starke Krümmung und würden das
  // Ergebnis verfälschen.
  const von = Math.round(hoehe * 0.12);
  const bis = Math.round(hoehe * 0.6);

  let besteKruemmung = 0;
  let iAchsel = -1;
  for (let i = von; i <= bis; i++) {
    if (d2[i] < besteKruemmung) {
      besteKruemmung = d2[i];
      iAchsel = i;
    }
  }
  if (iAchsel < 0) return null;

  // Schulterlinie: oberhalb der Achsel die Zeile mit dem STÄRKSTEN
  // Breitenzuwachs. Dort beginnt der Ärmel seitlich auszuscheren. Robuster
  // als ein fester Prozentschwellwert, der bei schmalen Damenschnitten und
  // weiten Hoodies unterschiedlich früh anschlägt.
  let besterZuwachs = 0;
  let iSchulter = von;
  for (let i = Math.round(hoehe * 0.05); i < iAchsel; i++) {
    if (d1g[i] > besterZuwachs) {
      besterZuwachs = d1g[i];
      iSchulter = i;
    }
  }

  return {
    ySchulter: yOben + iSchulter,
    yAchsel: yOben + iAchsel,
    /** Stärke des Knicks – klein bedeutet unscharfer Übergang. */
    kruemmung: Math.abs(besteKruemmung),
    /** Breite auf Achselhöhe (geglättet). */
    breiteAchsel: b[iAchsel],
    /** Maximale Breite oberhalb der Achsel. */
    breiteMax: Math.max(...b.slice(0, iAchsel + 1)),
  };
}
