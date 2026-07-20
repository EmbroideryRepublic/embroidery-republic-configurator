/**
 * Fehler der Übersetzungsschicht: eine angeforderte Variante konnte nicht
 * eindeutig aufgelöst werden – entweder weil die Farbe/Größe beim
 * Lieferanten gar nicht existiert (`unknown-color` / `unknown-size`) oder
 * weil der vorhandene Eintrag fehlerhaft ist (`invalid-variant`: leeres
 * Label oder eine deklarierte, aber leere stabile ID).
 *
 * Bewusst eine eigene, gut typisierte Fehlerklasse (nicht ein generischer
 * Error), damit
 *  - der Worker sie eindeutig von echten Laufzeitfehlern und von
 *    NotImplementedError (Adapter-Stub) unterscheiden kann,
 *  - Admin-UI und Logs den Grund strukturiert auswerten können
 *    (reason, supplierId, betroffener Wert, Produkt).
 *
 * Trägt eine klare, für Menschen lesbare Meldung – Anforderung:
 * "Falls nicht, soll ein klarer Fehler erzeugt werden."
 */
import type { SupplierId } from '../types';
import type { SupplierMappingErrorReason } from './types';

export class SupplierMappingError extends Error {
  readonly reason: SupplierMappingErrorReason;
  readonly supplierId: SupplierId;
  /** Der betroffene interne Schlüssel (colorId bzw. Größe). */
  readonly value: string;
  /** Betroffenes Katalog-Produkt (für Rückverfolgung), falls bekannt. */
  readonly productId?: string;

  constructor(params: {
    reason: SupplierMappingErrorReason;
    supplierId: SupplierId;
    value: string;
    productId?: string;
    /** Zusätzliche Erklärung, v.a. bei 'invalid-variant' (z.B. "leeres Label"). */
    detail?: string;
  }) {
    const scope = params.productId ? ` (Produkt "${params.productId}")` : '';
    let head: string;
    if (params.reason === 'unknown-color') {
      head = `Farbe "${params.value}" ist beim Lieferanten "${params.supplierId}" nicht verfügbar${scope}`;
    } else if (params.reason === 'unknown-size') {
      head = `Größe "${params.value}" ist beim Lieferanten "${params.supplierId}" nicht verfügbar${scope}`;
    } else {
      const why = params.detail ? `: ${params.detail}` : '';
      head = `Variante "${params.value}" beim Lieferanten "${params.supplierId}" ist ungültig${scope}${why}`;
    }
    super(
      `${head} – Position wird nicht automatisiert bestellt. ` +
        `Bitte im Mapping (mapping/tables/${params.supplierId}) korrigieren oder eine andere Variante wählen.`
    );
    this.name = 'SupplierMappingError';
    this.reason = params.reason;
    this.supplierId = params.supplierId;
    this.value = params.value;
    this.productId = params.productId;
  }
}
