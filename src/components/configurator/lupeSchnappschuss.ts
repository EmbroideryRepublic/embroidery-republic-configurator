/**
 * Zwischenspeicher der Lupe: ein einmal in hoher Auflösung gezeichnetes Bild der Konva-Vorschau.
 *
 * Warum nicht einfach die sichtbare Leinwand vergrößern? Die zeigt Produktfoto und Motive nur in 1×-Auflösung; ein
 * Hochskalieren davon wäre verwaschen. Konva kann dieselbe Szene aber mit höherem `pixelRatio` neu zeichnen
 * (`stage.toCanvas`) – Kanten von Logos, Schrift und Stoffstruktur sind dann wirklich scharf.
 *
 * In das Bild gehören nur Foto und Motive. Die Bedienelemente der Vorschau werden für die Aufnahme kurz ausgeblendet
 * und sofort (im selben Schritt, ohne dass der Browser dazwischen zeichnet) wieder eingeblendet:
 *  - der gestrichelte Druckflächen-Rahmen mit seiner Füllung (Name „print-area“),
 *  - alles mit dem Namen „steuerung“ (Beschriftung der Fläche, Sperrzonen, Mittig-Hilfslinien, Maß-Anzeige am Motiv),
 *  - die Transformer-Griffe der Auswahl,
 *  - der rote Warnrahmen eines Motivs außerhalb der Fläche (Name „motiv“, Strichfarbe Rot).
 *
 * Reine Anzeige: Der Zwischenspeicher wird nirgends exportiert oder gespeichert.
 */
import type Konva from 'konva';

/** Strichfarbe, mit der ConfiguratorCanvas ein Motiv außerhalb der Druckfläche warnt (siehe LogoNode/TextNode). */
export const WARNRAHMEN_FARBE = '#dc2626';

export type SchnappschussErgebnis =
  | { status: 'bereit'; canvas: HTMLCanvasElement }
  /** Ein Bild (Produktfoto oder Logo) ist noch nicht fertig geladen – später erneut versuchen. */
  | { status: 'wartet' }
  | { status: 'fehler' };

function istFertig(bild: unknown): boolean {
  if (!bild) return false;
  const b = bild as { complete?: boolean; naturalWidth?: number };
  // HTMLImageElement: erst fertig, wenn geladen UND dekodiert (naturalWidth > 0). Canvas-Quellen haben beides nicht.
  if (typeof b.complete === 'boolean') return b.complete && (b.naturalWidth ?? 0) > 0;
  return true;
}

/**
 * Zeichnet die Vorschau mit `pixelRatio` in ein neues Canvas.
 * @param erzwingen  true = auch zeichnen, wenn noch ein Bild fehlt (Logo defekt/zu langsam) – besser ein Bild ohne das
 *                   Logo als gar keine Lupe.
 */
export function erzeugeSchnappschuss(
  stage: Konva.Stage,
  optionen: { pixelRatio: number; erzwingen?: boolean }
): SchnappschussErgebnis {
  if (!optionen.erzwingen) {
    const bilder = stage.find('Image') as Konva.Image[];
    if (bilder.some((knoten) => !istFertig(knoten.image()))) return { status: 'wartet' };
  }

  const verborgen = (stage.find((knoten: Konva.Node) => knoten.hasName('print-area') || knoten.hasName('steuerung') || knoten.getClassName() === 'Transformer') as Konva.Node[]).filter(
    (knoten) => knoten.visible()
  );
  const rahmen = (stage.find((knoten: Konva.Node) => knoten.hasName('motiv')) as Konva.Shape[]).filter(
    (knoten) => knoten.stroke() === WARNRAHMEN_FARBE && knoten.strokeEnabled()
  );

  const aufnehmen = (pixelRatio: number) => stage.toCanvas({ pixelRatio });
  try {
    for (const knoten of verborgen) knoten.visible(false);
    for (const knoten of rahmen) knoten.strokeEnabled(false);
    try {
      return { status: 'bereit', canvas: aufnehmen(optionen.pixelRatio) };
    } catch {
      // Zu groß für den Speicher dieses Geräts: einmal mit halber Auflösung versuchen.
      return { status: 'bereit', canvas: aufnehmen(Math.max(1, optionen.pixelRatio / 2)) };
    }
  } catch {
    return { status: 'fehler' };
  } finally {
    // Immer wiederherstellen – auch wenn das Zeichnen fehlschlug, sonst bliebe der Druckbereich dauerhaft unsichtbar.
    for (const knoten of verborgen) knoten.visible(true);
    for (const knoten of rahmen) knoten.strokeEnabled(true);
  }
}
