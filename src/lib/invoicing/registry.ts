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
import { internerRechnungsAnbieter } from './providers/intern';
import type { RechnungsAnbieter, RechnungsAnbieterId } from './types';

const ANBIETER: Record<RechnungsAnbieterId, RechnungsAnbieter | null> = {
  test: testRechnungsAnbieter,
  lexware: lexwareAnbieter,
  intern: internerRechnungsAnbieter,
};

/** `intern` braucht keine externe Konfiguration – immer einsatzbereit. */
function istEinsatzbereit(id: RechnungsAnbieterId): boolean {
  if (!ANBIETER[id]) return false;
  if (id === 'lexware') return lexwareKonfigurationsStand().rechnungenMoeglich;
  return true;
}

/**
 * Ob überhaupt ein Rechnungsanbieter einsatzbereit ist – reine Vorabfrage,
 * wirft NICHT (im Unterschied zu waehleRechnungsAnbieter()).
 *
 * Existiert, damit orderCompletion.ts den Rechnungs-Anspruch (Migration
 * 0026, beanspruche_rechnungserstellung) erst gar nicht beansprucht, wenn
 * ohnehin kein Anbieter bereitsteht. Seit `intern` existiert (immer
 * einsatzbereit, siehe oben) liefert diese Funktion außerhalb wirklich
 * außergewöhnlicher Umstände `true` – der Rückfall auf `false` bleibt als
 * Sicherheitsnetz bestehen, falls `intern` selbst je eine Bedingung bekäme.
 */
export function istRechnungserstellungMoeglich(): boolean {
  if (istTestmodus()) return true;
  return istEinsatzbereit('lexware') || istEinsatzbereit('intern');
}

/**
 * Liefert den zu verwendenden Rechnungsanbieter.
 *
 * Der Testmodus hat Vorrang – IMMER (siehe Kopfkommentar der Nachbardatei
 * payments/registry.ts für dieselbe Überlegung).
 *
 * Standardanbieter seit der Lexware-Stilllegung (2026-08-18) ist `intern` –
 * die Website erzeugt ihre Rechnung selbst, unabhängig von jedem externen
 * Dienst. `INVOICING_PROVIDER=lexware` schaltet optional zurück auf
 * Lexware, aber NUR wenn es zusätzlich einsatzbereit ist (gültiger
 * `LEXWARE_API_KEY`) – fehlt das, fällt die Funktion automatisch (mit
 * Protokollzeile, nicht mit einem Fehler) auf `intern` zurück. Diese
 * Funktion wirft dadurch praktisch nie mehr – das war der eigentliche
 * Kernfehler, den dieser Anbieterwechsel behebt: die normale
 * Bestellabwicklung darf nie an einer externen Rechnungssoftware scheitern.
 */
export function waehleRechnungsAnbieter(): RechnungsAnbieter {
  if (istTestmodus()) return testRechnungsAnbieter;

  const gewuenscht = process.env.INVOICING_PROVIDER === 'lexware' ? 'lexware' : 'intern';
  if (gewuenscht === 'lexware') {
    if (istEinsatzbereit('lexware')) return lexwareAnbieter;
    console.warn(
      `[invoicing] INVOICING_PROVIDER=lexware angefordert, aber nicht einsatzbereit ` +
        `(${lexwareKonfigurationsStand().offeneSchritte.join('; ') || 'unbekannter Grund'}) – ` +
        `Rückfall auf den internen Rechnungsanbieter.`
    );
  }
  return internerRechnungsAnbieter;
}
