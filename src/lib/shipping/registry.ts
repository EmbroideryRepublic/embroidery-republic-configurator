/**
 * ═══════════════════════════════════════════════════════════════════════
 * ANBIETERAUSWAHL – die einzige Stelle, die konkrete Versandanbieter kennt
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Nach exakt demselben Muster wie lib/payments/registry.ts und
 * lib/invoicing/registry.ts.
 */
import { istTestmodus } from '@/config/testmodus';
import { testVersandAnbieter } from './providers/testAnbieter';
import { dhlAnbieter } from './providers/dhl';
import { dhlKonfigurationsStand, warneBeiProduktivUmgebung } from './providers/dhlKonfiguration';
import type { VersandAnbieter, VersandAnbieterId } from './types';

const ANBIETER: Record<VersandAnbieterId, VersandAnbieter | null> = {
  test: testVersandAnbieter,
  dhl: dhlAnbieter,
};

function istEinsatzbereit(id: VersandAnbieterId): boolean {
  if (!ANBIETER[id]) return false;
  if (id === 'dhl') return dhlKonfigurationsStand().versandMoeglich;
  return true;
}

export class VersandAnbieterFehlt extends Error {}

/** Liefert den zu verwendenden Versandanbieter. Testmodus hat Vorrang,
 *  dieselbe Regel wie bei Zahlung und Rechnung. */
export function waehleVersandAnbieter(): VersandAnbieter {
  if (istTestmodus()) return testVersandAnbieter;

  warneBeiProduktivUmgebung();

  const anbieter = ANBIETER.dhl;
  if (!anbieter || !istEinsatzbereit('dhl')) {
    throw new VersandAnbieterFehlt(
      `Versandanbieter „dhl" ist nicht einsatzbereit: ${dhlKonfigurationsStand().offeneSchritte.join('; ') || 'unbekannter Grund'}.`
    );
  }
  return anbieter;
}
