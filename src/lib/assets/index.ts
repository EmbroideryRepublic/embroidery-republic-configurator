/**
 * ═══════════════════════════════════════════════════════════════════════
 * ASSET-SCHICHT — der EINZIGE Ort, der die Bild-Ablagekonvention kennt.
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Siehe ADR 0004. Ziel: Produktdefinition, Lieferantendaten und Assets sind
 * getrennt; die Produktdefinition darf NICHT wissen, woher ein Bild stammt
 * (Pfad, Format, Store, Bezugsquelle). Bisher lag die Ordner-/Datei-/Format-
 * Konvention (`/products/<key>/<ansicht>.webp`, `.webp`↔`.png`-Geschwister,
 * neutraler Platzhalter) ~7-fach über Skripte, `colorHelpers`, Render-Loader
 * und Geometrie-Generator verstreut. Dieses Modul ist der Choke-Point.
 *
 * Dies ist Schritt 1 des Migrationspfads (ADR 0004): die Konvention wird hier
 * zentralisiert, byte-identisch zum Bestand. Der manifest-gestützte
 * `resolveAsset()`/`resolveColorImages()`-Resolver (der die Produktdef ganz von
 * Pfaden löst) und die Versionierung folgen in weiteren Schritten – ausdrücklich
 * OHNE dass Konsumenten die Konvention erneut selbst kodieren.
 */

import { ASSET_MANIFEST } from './assetManifest.generated';

/** Neutraler Übergangs-Platzhalter für Produkte ohne echte Fotos.
 *  AUSDRÜCKLICH TEMPORÄR – der echte Bildimport ersetzt ihn; er ist nie ein
 *  Endzustand und wird nie für ein echtes Foto gehalten. */
export const PLATZHALTER_BILD = '/products/_platzhalter/platzhalter.webp';

/**
 * Browser-Bildpfad einer Ansicht im Asset-Store aus der Ablage-Konvention.
 * `storageKey` ist die resolver-private Ablage-ID (heute: Ordnername = Produkt-ID
 * bzw. `${productId}-${colorId}`); die Produktdefinition kennt ihn nicht.
 * Ansichts-IDs werden zu Dateinamen mit Bindestrich (`sleeve_left` → `sleeve-left`).
 *
 * RESERVIERT (kein Laufzeit-Leser): Das Manifest führt bereits vollständige Pfade,
 * daher braucht heute niemand diese Konstruktion. Sie ist die **kanonische Ablage-
 * Konvention der ADR-0006-Bildimport-Pipeline** (Zielpfade
 * `public/products/<storageKey>/<view>.{webp,png}` beim Import) – bewusst behalten
 * als einzige Quelle dieser Konvention, kein toter Code.
 */
export function bildpfad(storageKey: string, view: string): string {
  return `/products/${storageKey}/${view.replace(/_/g, '-')}.webp`;
}

/**
 * Server-Render-Geschwister (PNG) zu einem Browser-Bildpfad (WebP). resvg kann
 * eingebettetes WebP nicht dekodieren; neben jeder `.webp` liegt eine `.png`
 * (erzeugt von scripts/convertGarmentWebpToPng.mjs). Die Ableitung lebt hier,
 * damit Render-Loader UND Geometrie-Generator NICHT je eigene Varianten bauen.
 */
export function rasterPfad(browserPfad: string): string {
  return browserPfad.replace(/\.webp$/i, '.png');
}

/**
 * Repräsentatives Bild einer Farbe (Kacheln, Produktkarten, OpenGraph, JSON-LD):
 * bevorzugt die Vorderansicht `front`, sonst die erste vorhandene Ansicht
 * (Produkte ohne klassische Vorderseite – Decke, Kissen, Tasche …), zuletzt der
 * neutrale Platzhalter. (Eine explizite `primaryView` je Produktgruppe folgt,
 * sobald ein Nicht-`front`-Produkt existiert – ADR 0002 M3.6b.)
 */
export function repraesentativesBild(images: Record<string, string>): string {
  return images.front ?? Object.values(images)[0] ?? PLATZHALTER_BILD;
}

// ── Manifest-Resolver (ADR 0004) ────────────────────────────────────────
// Die EINZIGE Auflösungsstelle für Produktbilder. Die Produktdefinition trägt
// keine Pfade mehr; alle Konsumenten fragen hier über (productId, colorId, view).

/** Alle Bildpfade einer Produktfarbe je Ansicht – aus dem Asset-Manifest. */
export function resolveColorImages(productId: string, colorId: string): Record<string, string> {
  return ASSET_MANIFEST[productId]?.[colorId]?.views ?? {};
}

/** Bildpfad einer einzelnen Ansicht einer Produktfarbe (oder undefined). */
export function bildFuerAnsicht(productId: string, colorId: string, view: string): string | undefined {
  return resolveColorImages(productId, colorId)[view];
}

/** Repräsentatives Bild einer Produktfarbe (Kacheln, Produktkarten, SEO). */
export function repraesentativBildVon(productId: string, colorId: string): string {
  return repraesentativesBild(resolveColorImages(productId, colorId));
}

/** Sind für dieses Produkt (bzw. diese Farbe) ECHTE Fotos vorhanden? Ersetzt das
 *  frühere produktseitige `bildStatus`/`hasRealPhotos`-Wissen. `fehlt` = nur
 *  Platzhalter (Bildimport noch offen). */
export function assetVerfuegbarkeit(productId: string, colorId?: string): 'vorhanden' | 'fehlt' {
  const prod = ASSET_MANIFEST[productId];
  if (!prod) return 'fehlt';
  const eintraege = colorId ? [prod[colorId]] : Object.values(prod);
  return eintraege.some((e) => e?.status === 'real') ? 'vorhanden' : 'fehlt';
}
