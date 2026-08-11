/**
 * ═══════════════════════════════════════════════════════════════════════
 * ANBIETERAUSWAHL – die einzige Stelle, die konkrete Rechnungsanbieter kennt
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Nach exakt demselben Muster wie lib/payments/registry.ts. Der Testmodus-
 * Vorrang ist HIER besonders wichtig: Lexware hat keine Sandbox, ein
 * versehentlicher echter Aufruf im Testlauf würde eine echte, fortlaufende
 * Rechnungsnummer verbrauchen und einen echten Beleg im Buchhaltungskonto
 * hinterlassen.
 */
import { istTestmodus } from '@/config/testmodus';
import { testRechnungsAnbieter } from './providers/testAnbieter';
import { lexwareAnbieter } from './providers/lexware';
import { lexwareKonfigurationsStand } from './providers/lexwareKonfiguration';
import type { RechnungsAnbieter, RechnungsAnbieterId } from './types';

const ANBIETER: Record<RechnungsAnbieterId, RechnungsAnbieter | null> = {
  test: testRechnungsAnbieter,
  lexware: lexwareAnbieter,
};

function istEinsatzbereit(id: RechnungsAnbieterId): boolean {
  if (!ANBIETER[id]) return false;
  if (id === 'lexware') return lexwareKonfigurationsStand().rechnungenMoeglich;
  return true;
}

export class RechnungsAnbieterFehlt extends Error {}

/**
 * Liefert den zu verwendenden Rechnungsanbieter.
 *
 * Der Testmodus hat Vorrang – IMMER, auch wenn ein echter LEXWARE_API_KEY
 * hinterlegt ist (siehe Kopfkommentar). Dieselbe Regel wie bei
 * waehleZahlungsAnbieter, hier ohne die zusätzliche Schutzschicht eines
 * Schlüsselpräfix-Checks, weil Lexware selbst keine dafür geeignete
 * Unterscheidung anbietet.
 */
export function waehleRechnungsAnbieter(): RechnungsAnbieter {
  if (istTestmodus()) return testRechnungsAnbieter;

  const anbieter = ANBIETER.lexware;
  if (!anbieter || !istEinsatzbereit('lexware')) {
    throw new RechnungsAnbieterFehlt(
      `Rechnungsanbieter „lexware" ist nicht einsatzbereit: ${lexwareKonfigurationsStand().offeneSchritte.join('; ') || 'unbekannter Grund'}.`
    );
  }
  return anbieter;
}
