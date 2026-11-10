/**
 * Druckqualität eines hochgeladenen Logos (Ampel): Auflösung des Bildes im Verhältnis zur gewählten Druckgröße.
 *
 * Anlass (Stichprobentest 2026-11-10): Die Ampel stand nach dem Hochladen nur 1,8 Sekunden im Logo-Reiter und
 * war danach weg – auch ein 48-Pixel-Bild auf 14,6 cm bekam keinen bleibenden Hinweis. Die Berechnung liegt
 * jetzt hier, damit Upload UND die Anzeige im Design-Bereich (ElementToolbar) dieselben Regeln und Texte nutzen,
 * und der Hinweis dort mitwandert, wenn das Logo später größer gezogen wird.
 *
 * Vektordateien (SVG, PDF) lassen sich verlustfrei skalieren und bekommen nie eine Warnung.
 */

/** Unter diesem Wert ist der Druck zu unscharf (rot). */
export const MIN_DPI = 150;
/** Ab diesem Wert ist die Qualität optimal (grün); dazwischen "akzeptabel" (gelb). */
export const OK_DPI = 220;

export type QualityLevel = 'green' | 'yellow' | 'red';

export interface LogoQualitaet {
  level: QualityLevel;
  dpi: number;
}

const VEKTOR_ENDUNGEN = ['.svg', '.pdf'];

/** Rasterbild (PNG/JPG)? Nur dafür gibt es eine Auflösungsbewertung. */
export function istRasterDatei(fileName: string): boolean {
  const klein = fileName.trim().toLowerCase();
  return !VEKTOR_ENDUNGEN.some((endung) => klein.endsWith(endung));
}

/** Bildpunkte je Zoll bei der gewählten Breite; 0, wenn die Angaben unbrauchbar sind. */
export function berechneLogoDpi(inhaltsBreitePx: number, breiteCm: number): number {
  const zoll = breiteCm / 2.54;
  return zoll > 0 && inhaltsBreitePx > 0 ? inhaltsBreitePx / zoll : 0;
}

export function stufeFuerDpi(dpi: number): QualityLevel {
  if (dpi < MIN_DPI) return 'red';
  if (dpi < OK_DPI) return 'yellow';
  return 'green';
}

/** Bewertung eines Logos; null bei Vektordateien (immer in Ordnung) oder fehlenden Maßen. */
export function bewerteLogoQualitaet(logo: { fileName: string; originalWidthPx: number; widthCm: number }): LogoQualitaet | null {
  if (!istRasterDatei(logo.fileName)) return null;
  const dpi = berechneLogoDpi(logo.originalWidthPx, logo.widthCm);
  if (dpi <= 0) return null;
  return { level: stufeFuerDpi(dpi), dpi: Math.round(dpi) };
}

/** Der erklärende Text zur Stufe (derselbe Wortlaut wie bisher im Upload). */
export function logoQualitaetText(level: QualityLevel, dpi: number): string {
  if (level === 'red') {
    return `Auflösung zu niedrig für scharfen Druck (≈ ${Math.round(dpi)} dpi, empfohlen: ${MIN_DPI}+ dpi). Bitte kleiner platzieren, ein SVG verwenden oder eine höher aufgelöste Datei hochladen.`;
  }
  if (level === 'yellow') {
    return `Akzeptable Auflösung (≈ ${Math.round(dpi)} dpi), für sehr große Drucke aber eher knapp.`;
  }
  return 'Optimale Druckqualität bei dieser Größe.';
}
