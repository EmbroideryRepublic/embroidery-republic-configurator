import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { imageSize } from 'image-size';
import { rasterPfad } from '@/lib/assets';
import { basisUrl } from '@/lib/seo/basisUrl';

/**
 * Liest eine Datei unter public/ – lokal von der Platte, mit einem
 * HTTP-Rückfall auf die eigene, öffentlich ausgelieferte Kopie.
 *
 * ── Warum der Rückfall nötig ist (Fund vom 2026-09-01, Go-Live-Abnahme) ──
 * Die frühere Annahme ("public/ ist zur Laufzeit immer lokal verfügbar,
 * auch in Serverless-Deployments") stimmte nicht: Next.js' Output File
 * Tracing erkennt nur STATISCH importierte Dateien – ein zur Laufzeit aus
 * einer Zeichenkette zusammengesetzter Pfad wie hier (products.ts kennt die
 * konkreten Produktfotos nicht als Import) wird NICHT automatisch ins
 * Server-Action-Bundle aufgenommen. `public/products/` allein ist über 1 GB
 * groß – zu groß, um pauschal in jede Funktion eingebunden zu werden
 * (Vercels Funktionsgrößenlimit). Lokal (Dev-Server, `next start`, Tests)
 * bleibt der schnelle Dateisystem-Pfad unverändert die Regel; nur wenn der
 * fehlschlägt, wird dieselbe Datei stattdessen über die eigene, ohnehin
 * öffentlich ausgelieferte URL nachgeladen (bestätigt: `/products/**`
 * antwortet mit 200 OK).
 */
async function leseAusPublicOrderHttp(relativePath: string): Promise<Buffer> {
  const filePath = path.join(process.cwd(), 'public', relativePath);
  try {
    return await readFile(filePath);
  } catch {
    const antwort = await fetch(`${basisUrl()}${relativePath}`);
    if (!antwort.ok) {
      throw new Error(`Weder lokal noch über ${basisUrl()}${relativePath} erreichbar (HTTP ${antwort.status}).`);
    }
    return Buffer.from(await antwort.arrayBuffer());
  }
}

interface SvgGarmentImageInfo {
  kind: 'svg';
  naturalWidth: number;
  naturalHeight: number;
  /** Rohes <svg>-Markup, wird als Inline-<svg>-Fragment eingebettet (kein
   *  Rasterisierungs-Umweg, schärfer als PNG). */
  svgMarkup: string;
}

interface RasterGarmentImageInfo {
  kind: 'raster';
  naturalWidth: number;
  naturalHeight: number;
  /** PNG-Bytes, werden als base64-<image> eingebettet. */
  pngBuffer: Buffer;
}

export type GarmentImageInfo = SvgGarmentImageInfo | RasterGarmentImageInfo;

/** Liest viewBox="minX minY width height" bzw. ersatzweise die
 *  width/height-Attribute eines <svg>-Wurzelelements – reine Regex-
 *  Auswertung, kein XML-Parser nötig für unsere einfachen, handgemachten
 *  Kleidungsstück-Umriss-SVGs (siehe public/products/*.svg). */
function parseSvgDimensions(svgMarkup: string): { width: number; height: number } {
  const viewBoxValue = svgMarkup.match(/viewBox=["']([^"']+)["']/)?.[1];
  if (viewBoxValue) {
    const parts = viewBoxValue.trim().split(/[\s,]+/).map(Number);
    const width = parts[2];
    const height = parts[3];
    if (parts.length === 4 && width !== undefined && height !== undefined && Number.isFinite(width) && Number.isFinite(height)) {
      return { width, height };
    }
  }
  const widthValue = svgMarkup.match(/\swidth=["'](\d+(?:\.\d+)?)["']/)?.[1];
  const heightValue = svgMarkup.match(/\sheight=["'](\d+(?:\.\d+)?)["']/)?.[1];
  if (widthValue !== undefined && heightValue !== undefined) {
    return { width: Number(widthValue), height: Number(heightValue) };
  }
  throw new Error(`Konnte Breite/Höhe nicht aus SVG-Markup ermitteln (weder viewBox noch width/height gefunden).`);
}

/**
 * Lädt die natürlichen Maße + Bilddaten eines Kleidungsstück-Bilds
 * (aus src/config/products.ts, z.B. "/products/hoodie-black/front.svg"),
 * ohne Browser/DOM – liest die Datei aus public/, mit HTTP-Rückfall auf die
 * eigene öffentliche URL, falls sie im Server-Action-Bundle fehlt (siehe
 * leseAusPublicOrderHttp() oben).
 *
 * .webp-Produktfotos werden zur Laufzeit NICHT unterstützt (resvg kann
 * eingebettete WebP-Bilder nicht dekodieren, siehe Testlauf) – dafür muss
 * vorab `scripts/convertGarmentWebpToPng.mjs` gelaufen sein, das PNG-
 * Geschwister neben jeder .webp-Datei erzeugt; dieser Pfad wird hier
 * automatisch abgeleitet (.webp -> .png), ohne dass products.ts geändert
 * werden muss.
 */
export async function loadGarmentImageInfo(publicRelativePath: string): Promise<GarmentImageInfo> {
  const ext = path.extname(publicRelativePath).toLowerCase();

  if (ext === '.svg') {
    const svgMarkup = (await leseAusPublicOrderHttp(publicRelativePath)).toString('utf-8');
    const { width, height } = parseSvgDimensions(svgMarkup);
    return { kind: 'svg', naturalWidth: width, naturalHeight: height, svgMarkup };
  }

  if (ext === '.webp') {
    const pngRelativePath = rasterPfad(publicRelativePath);
    let pngBuffer: Buffer;
    try {
      pngBuffer = await leseAusPublicOrderHttp(pngRelativePath);
    } catch {
      throw new Error(
        `PNG-Geschwister für "${publicRelativePath}" fehlt ("${pngRelativePath}") – bitte einmalig ` +
          `"node scripts/convertGarmentWebpToPng.mjs" ausführen (resvg kann WebP nicht direkt einbetten).`
      );
    }
    const dims = imageSize(pngBuffer);
    if (!dims.width || !dims.height) {
      throw new Error(`Konnte Bildmaße nicht aus "${pngRelativePath}" ermitteln.`);
    }
    return { kind: 'raster', naturalWidth: dims.width, naturalHeight: dims.height, pngBuffer };
  }

  if (ext === '.png') {
    const pngBuffer = await leseAusPublicOrderHttp(publicRelativePath);
    const dims = imageSize(pngBuffer);
    if (!dims.width || !dims.height) {
      throw new Error(`Konnte Bildmaße nicht aus "${publicRelativePath}" ermitteln.`);
    }
    return { kind: 'raster', naturalWidth: dims.width, naturalHeight: dims.height, pngBuffer };
  }

  throw new Error(`Nicht unterstütztes Kleidungsstück-Bildformat "${ext}" für "${publicRelativePath}".`);
}
