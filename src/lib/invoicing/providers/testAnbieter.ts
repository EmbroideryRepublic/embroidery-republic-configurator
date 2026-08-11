/**
 * ═══════════════════════════════════════════════════════════════════════
 * TEST-RECHNUNGSANBIETER – vollwertige Implementierung des Ports
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Nach demselben Muster wie payments/providers/testAnbieter.ts. Hier
 * besonders wichtig: Lexware hat KEINE Sandbox – dieser Testanbieter ist die
 * EINZIGE Schutzschicht gegen einen versehentlichen echten Rechnungslauf
 * während eines Testdurchlaufs (siehe registry.ts, istTestmodus() siegt
 * immer).
 */
import { randomUUID } from 'node:crypto';
import { meldeAbgefangen } from '@/config/testmodus';
import { formatiereGeld } from '@/lib/format';
import type { RechnungsAnbieter, Rechnungsauftrag, Rechnungserstellung } from '../types';

export const testRechnungsAnbieter: RechnungsAnbieter = {
  id: 'test',

  async erstelle(auftrag: Rechnungsauftrag): Promise<Rechnungserstellung> {
    const rechnungsnummer = `TEST-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    meldeAbgefangen(
      'Rechnung',
      `${auftrag.bestellnummer} über ${formatiereGeld(auftrag.gesamtBruttoCent / 100, auftrag.waehrung)} erstellt (${rechnungsnummer})`
    );
    return {
      rechnungsId: `test_${randomUUID()}`,
      rechnungsnummer,
      // Kein PDF-Rendering im Testmodus nötig – nachgelagerte Schritte
      // (Upload, Anhang) brauchen nur einen gültigen Buffer, keinen echten
      // Inhalt.
      pdf: Buffer.from(`Testrechnung ${rechnungsnummer}`, 'utf8'),
    };
  },
};
