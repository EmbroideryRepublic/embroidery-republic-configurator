/**
 * Adressen der Stickdatei-Downloads im Adminbereich (app/api/admin/bestellungen/[id]/stickdatei/[elementId]).
 * Bewusst ohne Server-Importe: Auch Client-Komponenten dürfen sie laden.
 */

function basis(orderId: string, elementId: string): string {
  return `/api/admin/bestellungen/${encodeURIComponent(orderId)}/stickdatei/${encodeURIComponent(elementId)}`;
}

/** Hängt die Abfrageparameter an; "hintergrund=aus" nur, wenn die Hintergrundentfernung (Standard: an) abgeschaltet ist. */
function mitParametern(pfad: string, parameter: string[], hintergrundEntfernen: boolean): string {
  const alle = hintergrundEntfernen ? parameter : [...parameter, 'hintergrund=aus'];
  return alle.length > 0 ? `${pfad}?${alle.join('&')}` : pfad;
}

/** Die fertig digitalisierte Stickdatei zum Herunterladen: DST (Standard), PES (Brother) oder JEF (Janome). */
export function stickdateiHref(orderId: string, elementId: string, format: 'dst' | 'pes' | 'jef' = 'dst', hintergrundEntfernen = true): string {
  return mitParametern(basis(orderId, elementId), format === 'dst' ? [] : [`format=${format}`], hintergrundEntfernen);
}

/** Stickvorschau (PNG mit den Garnlinien) – zum Ansehen im Browser. */
export function stickvorschauHref(orderId: string, elementId: string, hintergrundEntfernen = true): string {
  return mitParametern(basis(orderId, elementId), ['vorschau=1'], hintergrundEntfernen);
}

/** Kennzahlen und Hinweise der Digitalisierung als JSON (Stiche, Größe, Farben, Grenzen des Motivs). */
export function stickinfoHref(orderId: string, elementId: string, hintergrundEntfernen = true): string {
  return mitParametern(basis(orderId, elementId), ['info=1'], hintergrundEntfernen);
}
