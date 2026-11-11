/**
 * Adressen der Stickdatei-Downloads im Adminbereich (app/api/admin/bestellungen/[id]/stickdatei/[elementId]).
 * Bewusst ohne Server-Importe: Auch Client-Komponenten dürfen sie laden.
 */

function basis(orderId: string, elementId: string): string {
  return `/api/admin/bestellungen/${encodeURIComponent(orderId)}/stickdatei/${encodeURIComponent(elementId)}`;
}

/** Die fertig digitalisierte Stickdatei zum Herunterladen: DST (Standard), PES (Brother) oder JEF (Janome). */
export function stickdateiHref(orderId: string, elementId: string, format: 'dst' | 'pes' | 'jef' = 'dst'): string {
  return format === 'dst' ? basis(orderId, elementId) : `${basis(orderId, elementId)}?format=${format}`;
}

/** Stickvorschau (PNG mit den Garnlinien) – zum Ansehen im Browser. */
export function stickvorschauHref(orderId: string, elementId: string): string {
  return `${basis(orderId, elementId)}?vorschau=1`;
}

/** Kennzahlen und Hinweise der Digitalisierung als JSON (Stiche, Größe, Farben, Grenzen des Motivs). */
export function stickinfoHref(orderId: string, elementId: string): string {
  return `${basis(orderId, elementId)}?info=1`;
}
