export interface TextMetricsPx {
  widthPx: number;
  heightPx: number;
}

/**
 * Misst die TATSÄCHLICHE Breite/Höhe eines gerenderten Textes in Pixeln.
 *
 * WICHTIG: Verwendet dafür Konva selbst (nicht die Browser-Canvas-API wie
 * vorher). Grund: Konvas eigene Text-Engine kann geringfügig anders
 * messen als `canvas.measureText()` – diese Abweichung führte dazu, dass
 * die vorher per Browser-API berechnete Box knapp zu schmal war und
 * Konva den Text am Rand abschnitt. Da hier dieselbe Konva-Text-Klasse
 * zur Messung verwendet wird, die später auch tatsächlich zeichnet, kann
 * diese Diskrepanz jetzt nicht mehr auftreten.
 */
export function measureTextPx(
  content: string,
  fontFamily: string,
  fontSizePx: number,
  bold: boolean,
  italic: boolean
): TextMetricsPx {
  const safeContent = content.length > 0 ? content : ' ';
  const style = [bold ? 'bold' : '', italic ? 'italic' : ''].filter(Boolean).join(' ') || 'normal';

  if (typeof document === 'undefined') {
    // Serverseitiger Fallback – wird praktisch nie erreicht.
    return { widthPx: content.length * fontSizePx * 0.6, heightPx: fontSizePx * 1.3 };
  }

  try {
    // Lazy require, damit Konva nicht versehentlich serverseitig geladen wird.
    // eslint-disable-next-line
    const KonvaModule = require('konva');
    const Konva = KonvaModule.default ?? KonvaModule;
    const measurer = new Konva.Text({
      text: safeContent,
      fontSize: fontSizePx,
      fontFamily,
      fontStyle: style,
      // Bewusst KEIN width/height gesetzt -> Konva berechnet die
      // natürliche, ungekürzte Größe des Textes selbst.
    });
    const widthPx = measurer.width();
    const heightPx = measurer.height();
    measurer.destroy();

    // Kleiner Sicherheitsabstand, damit die Box nicht direkt an den
    // Buchstaben klebt (rein optisch, keine Notlösung mehr gegen Abschneiden).
    const paddingPx = fontSizePx * 0.15;
    return { widthPx: widthPx + paddingPx, heightPx: heightPx + paddingPx };
  } catch {
    // Fallback über die Browser-Canvas-API, falls Konva aus irgendeinem
    // Grund nicht verfügbar ist.
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return { widthPx: content.length * fontSizePx * 0.6, heightPx: fontSizePx * 1.3 };
    ctx.font = `${style} ${fontSizePx}px ${fontFamily}`.trim();
    const metrics = ctx.measureText(safeContent);
    const heightPx = fontSizePx * 1.3;
    return { widthPx: metrics.width * 1.3, heightPx };
  }
}

/**
 * Rendert den Text tatsächlich auf eine unsichtbare Canvas und misst, wie
 * viel Prozent der umgebenden Box wirklich von Buchstaben ("Tinte")
 * bedeckt ist – ein "hallo" füllt sein Auswahl-Rechteck z.B. nur zu
 * ca. 25–35%, der große Rest ist Leerraum um/zwischen den Buchstaben.
 *
 * Wird für die Preisberechnung genutzt: es soll nur die tatsächlich
 * bedruckte/bestickte Fläche bezahlt werden, nicht das komplette
 * Auswahl-Rechteck (siehe calculatePrice.ts).
 */
export function measureInkCoverageRatio(
  content: string,
  fontFamily: string,
  fontSizePx: number,
  bold: boolean,
  italic: boolean
): number {
  const FALLBACK_RATIO = 0.35; // grober Erfahrungswert, falls Messung nicht möglich ist
  if (typeof document === 'undefined' || !content.trim()) return FALLBACK_RATIO;

  const metrics = measureTextPx(content, fontFamily, fontSizePx, bold, italic);
  const canvasWidth = Math.max(1, Math.ceil(metrics.widthPx));
  const canvasHeight = Math.max(1, Math.ceil(metrics.heightPx));

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return FALLBACK_RATIO;

  const style = [bold ? 'bold' : '', italic ? 'italic' : ''].filter(Boolean).join(' ');
  ctx.font = `${style} ${fontSizePx}px ${fontFamily}`.trim();
  ctx.fillStyle = '#000000';
  ctx.textBaseline = 'middle';
  ctx.fillText(content, canvasWidth * 0.05, canvasHeight / 2);

  const { data } = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  let inkPixels = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 40) inkPixels++; // Alpha-Kanal: gerendertes Glyphen-Pixel
  }
  const totalPixels = canvasWidth * canvasHeight;
  const ratio = totalPixels > 0 ? inkPixels / totalPixels : FALLBACK_RATIO;

  // Sicherheitsspanne: nie 0 (sonst kostenlos) und nie über 0.9 (Buchstaben
  // haben immer etwas Zwischenraum).
  return Math.min(0.9, Math.max(0.1, ratio));
}
