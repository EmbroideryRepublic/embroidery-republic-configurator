/**
 * ═══════════════════════════════════════════════════════════════════════
 * TEST-VERSANDANBIETER – vollwertige Implementierung des Ports
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Nach demselben Muster wie payments/providers/testAnbieter.ts und
 * invoicing/providers/testAnbieter.ts.
 */
import { randomUUID } from 'node:crypto';
import { meldeAbgefangen } from '@/config/testmodus';
import type { VersandAnbieter, Versandauftrag, Versanderstellung } from '../types';

export const testVersandAnbieter: VersandAnbieter = {
  id: 'test',

  async erstelleSendung(auftrag: Versandauftrag): Promise<Versanderstellung> {
    const sendungsnummer = `TEST-DHL-${randomUUID().slice(0, 12).toUpperCase()}`;
    meldeAbgefangen('Versandlabel', `${auftrag.bestellnummer} → ${auftrag.empfaenger.ort} (${sendungsnummer})`);
    return {
      sendungsnummer,
      label: Buffer.from(`Testlabel ${sendungsnummer}`, 'utf8'),
    };
  },
};
