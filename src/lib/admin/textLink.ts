/**
 * Kleine, reine Hilfen für die Admin-Oberfläche rund um den Text-Download
 * (JPG). Bewusst ohne Server-Importe: Auch Client-Komponenten dürfen sie laden.
 */

/** Adresse des JPG-Downloads eines Textes (app/api/admin/bestellungen/[id]/texte/[elementId]).
 *  `ansehen` zeigt das Bild im Browser an, statt es herunterzuladen. */
export function textJpgHref(orderId: string, elementId: string, ansehen = false): string {
  const pfad = `/api/admin/bestellungen/${encodeURIComponent(orderId)}/texte/${encodeURIComponent(elementId)}`;
  return ansehen ? `${pfad}?ansicht=1` : pfad;
}

/** Adresse des PNG-Downloads mit transparentem Hintergrund – die Datei für die DTF-Bestellung. */
export function textPngHref(orderId: string, elementId: string, ansehen = false): string {
  const pfad = `/api/admin/bestellungen/${encodeURIComponent(orderId)}/texte/${encodeURIComponent(elementId)}?format=png`;
  return ansehen ? `${pfad}&ansicht=1` : pfad;
}

/** Adresse des kleinen Vorschaubilds eines Textes (72 dpi, wird im Browser angezeigt) –
 *  für die Zeile in den Kundendateien. Die Download-Dateien haben 300 dpi. */
export function textVorschauHref(orderId: string, elementId: string): string {
  return `/api/admin/bestellungen/${encodeURIComponent(orderId)}/texte/${encodeURIComponent(elementId)}?vorschau=1`;
}

/** Anzahl der Zeilen eines Textes – ein Zeilenumbruch beginnt eine neue Zeile. */
export function zeilenAnzahl(inhalt: string): number {
  return inhalt.split(/\r\n|\r|\n/).length;
}
