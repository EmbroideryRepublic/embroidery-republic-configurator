/**
 * Stickparameter der automatischen Digitalisierung (Text/Logo → Stickdatei).
 *
 * ── Was hier steht und was nicht ───────────────────────────────────────
 * Die Werte sind übliche Richtwerte für Flachstickerei auf Textil (Tatami-Füllung, Satin-ähnliche Reihen bei dünnen
 * Strichen, Unterlage, Sicherungsstiche). Sie sind KEIN Ersatz für die Abstimmung auf Stoff, Garn und Maschine: Ein
 * dicker Hoodie-Fleece verträgt mehr Unterlage und eine höhere Zugkompensation als ein dünnes Polo. Wer eine Stickdatei
 * aus der Bestellung zieht, sollte sie vor der Serie einmal auf Probestoff sticken.
 *
 * Alle Längen in Millimetern. 1 Stichpunkt der Stickdatei = 0,1 mm (DST).
 */
export interface StickParameter {
  /** Rasterauflösung der Vorlage in Bildpunkten je Millimeter (10 = 0,1 mm, passt zur DST-Auflösung). */
  pxProMm: number;
  /** Abstand der Füllreihen (Stichdichte): 0,4 mm ist die gängige Dichte für Tatami. */
  fuellAbstandMm: number;
  /** Längster Einzelstich in Füllungen; längere Strecken werden mit versetzten Einstichen unterteilt. */
  maxStichMm: number;
  /** Abstand der Unterlage-Reihen (quer zur Füllung): grob, nur zum Stabilisieren. */
  untergrundAbstandMm: number;
  /** Zugkompensation: Die Fläche wird ringsum um so viel größer gestickt, weil sich der Stoff zusammenzieht. */
  zugKompensationMm: number;
  /** Einzug der Unterlage vom Rand, damit sie nicht unter der Kante hervorschaut. */
  untergrundEinzugMm: number;
  /** Höchstzahl der Garnfarben; mehr Farben im Logo werden zusammengefasst. */
  maxFarben: number;
  /** Teile, die kleiner sind (Staub, Bildrauschen), werden nicht gestickt. */
  minFlaecheMm2: number;
  /** Teile mit höchstens dieser Kantenlänge gelten als Punkt (i-Punkt, Umlautpunkt, Satzzeichen) und werden eigens gestickt. */
  punktMaxMm: number;
  /** Kürzere Reihenstücke werden nicht gestickt (Fadenbruch, Stichloch ohne Wirkung). */
  minLaufMm: number;
  /** Bis zu dieser Strecke wird innerhalb der Fläche direkt weitergestickt, darüber gesprungen. */
  maxVerbindungMm: number;
  /** Länge der Sicherungsstiche am Anfang und Ende jeder Nähsequenz. */
  sicherungMm: number;
  /** Ab dieser Sprunglänge werden vor und nach dem Sprung Sicherungsstiche gesetzt. */
  sprungSicherungAbMm: number;
  /** Mehr Stiche macht die automatische Erzeugung nicht (Schutz vor riesigen Dateien und Laufzeit). */
  maxStiche: number;
  /** Größere Motive (längste Kante) werden abgelehnt – so viel passt auf keinen Stickrahmen. */
  maxKanteMm: number;
}

export const STANDARD_PARAMETER: StickParameter = {
  pxProMm: 10,
  fuellAbstandMm: 0.4,
  maxStichMm: 3.5,
  untergrundAbstandMm: 2.0,
  zugKompensationMm: 0.15,
  untergrundEinzugMm: 0.5,
  maxFarben: 6,
  minFlaecheMm2: 0.5,
  punktMaxMm: 2.5,
  minLaufMm: 0.5,
  maxVerbindungMm: 3.5,
  sicherungMm: 0.6,
  sprungSicherungAbMm: 5,
  maxStiche: 150_000,
  maxKanteMm: 300,
};

/** DST kennt Stichversätze bis ±121 Einheiten à 0,1 mm: größere Wege werden in mehrere Sprünge/Stiche zerlegt. */
export const DST_MAX_SCHRITT_EINHEITEN = 121;
