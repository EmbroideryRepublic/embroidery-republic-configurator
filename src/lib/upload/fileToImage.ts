'use client';

export interface UploadedImage {
  /** Data-URL, direkt als Konva-Image-Quelle nutzbar */
  dataUrl: string;
  width: number;
  height: number;
  fileName: string;
}

/**
 * Wandelt eine hochgeladene Datei (SVG, PNG, PDF) in ein anzeigbares Bild um.
 * SVG und PNG werden direkt als Data-URL gelesen. PDF wird serverlos im
 * Browser gerendert (erste Seite, via pdfjs-dist) und als PNG-Data-URL
 * zurückgegeben, damit der Konfigurator intern nur einen einzigen
 * Bildtyp verwalten muss.
 */
export async function fileToImage(file: File): Promise<UploadedImage> {
  if (file.type === 'image/png' || file.type === 'image/svg+xml') {
    return readAsImage(file);
  }
  if (file.type === 'application/pdf') {
    return renderPdfFirstPage(file);
  }
  throw new Error('Nicht unterstütztes Dateiformat. Erlaubt sind SVG, PNG und PDF.');
}

function readAsImage(file: File): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        // Manche SVGs ohne explizites width/height/viewBox melden 0×0 im
        // Browser. Ohne Fallback würden daraus NaN-Werte bei der
        // Seitenverhältnis-Berechnung entstehen (Absturzgefahr im Canvas).
        const width = img.naturalWidth || 300;
        const height = img.naturalHeight || 300;
        resolve({ dataUrl, width, height, fileName: file.name });
      };
      img.onerror = () => reject(new Error('Die Bilddatei konnte nicht gelesen werden.'));
      img.src = dataUrl;
    };
    reader.onerror = () => reject(new Error('Die Datei konnte nicht gelesen werden.'));
    reader.readAsDataURL(file);
  });
}

async function renderPdfFirstPage(file: File): Promise<UploadedImage> {
  // Dynamischer Import: pdfjs-dist ist groß und wird nur bei tatsächlichem
  // PDF-Upload geladen, nicht im initialen Bundle.
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);

  // Skalierung 2x für ausreichende Druckqualität bei Vergrößerung im Canvas
  const viewport = page.getViewport({ scale: 2 });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('PDF konnte nicht gerendert werden (Canvas nicht verfügbar).');
  }

  await page.render({ canvasContext: context, viewport }).promise;

  return {
    dataUrl: canvas.toDataURL('image/png'),
    width: canvas.width,
    height: canvas.height,
    fileName: file.name.replace(/\.pdf$/i, '.png'),
  };
}
