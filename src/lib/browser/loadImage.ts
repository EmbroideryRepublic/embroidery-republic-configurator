'use client';

/**
 * Lädt eine Bildquelle (Data-URL oder URL) als HTMLImageElement.
 * Gemeinsam genutzt von allen Canvas-basierten Bildverarbeitungen
 * (Stichzahl-Schätzung, Logo-Analyse, Hintergrundentfernung).
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Bild konnte nicht geladen werden.'));
    img.src = src;
  });
}
