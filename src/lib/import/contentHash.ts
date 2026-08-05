/**
 * Content-Hash-Versionierung der Asset-Pipeline (ADR 0006).
 *
 * Die **Version** eines Assets ist der Hash SEINER BYTES: gleiche Bytes → gleiche
 * Version. Aktualisiert ein Hersteller ein Bild, ändert sich der Hash – die
 * Pipeline erkennt damit GENAU die betroffenen Assets und ersetzt nur diese, ohne
 * den restlichen Bestand anzufassen (Wunsch des Auftraggebers).
 *
 * Reine Funktionen (kein Dateisystem) – im Test-Gate abgesichert. Das Lesen der
 * Bilddatei erledigt die Pipeline und reicht die Bytes hier hinein.
 */
import { createHash } from 'node:crypto';

/** Voller Content-Hash (sha256, hex) der Bytes. */
export function hashHex(daten: Uint8Array | string): string {
  return createHash('sha256').update(daten).digest('hex');
}

/** Kurzform für Versions-Suffixe/Manifest (12 hex = 48 bit, kollisionsarm bei
 *  Tausenden Assets). */
export function kurzHash(daten: Uint8Array | string): string {
  return hashHex(daten).slice(0, 12);
}

/** Hat sich ein Asset gegenüber der bekannten Version geändert? (Änderungs-
 *  erkennung für den Re-Import: nur `true` → neu verarbeiten/ersetzen.) */
export function assetGeaendert(neueBytes: Uint8Array | string, bekannteVersion: string | undefined): boolean {
  if (!bekannteVersion) return true;
  return kurzHash(neueBytes) !== bekannteVersion;
}
