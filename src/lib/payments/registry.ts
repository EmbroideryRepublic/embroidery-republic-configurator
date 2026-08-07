/**
 * ═══════════════════════════════════════════════════════════════════════
 * ANBIETERAUSWAHL – die einzige Stelle, die konkrete Anbieter kennt
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Diese Datei ist bewusst die Ausnahme von der Reinheitsregel: Sie darf aus
 * `providers/` importieren, weil irgendwo die Verdrahtung stattfinden muss.
 * Alles andere unter `lib/payments/` bleibt frei davon (abgesichert durch
 * __tests__/architektur.test.ts).
 *
 * Wer eine Zahlung eröffnen will, ruft `waehleZahlungsAnbieter()` – und
 * bekommt einen `ZahlungsAnbieter`. Welcher es ist, geht ihn nichts an.
 */
import { istTestmodus } from '@/config/testmodus';
import { testAnbieter } from './providers/testAnbieter';
import { stripeAnbieter } from './providers/stripe';
import { stripeKonfigurationsStand, warneBeiProduktivSchluessel } from './providers/stripeKonfiguration';
import type { ZahlungsAnbieter, ZahlungsAnbieterId } from './types';

/**
 * Alle Anbieter, vollständig nach Kennung.
 *
 * Ein `Record` über den geschlossenen Union-Typ: Sobald `ZahlungsAnbieterId`
 * einen Wert bekommt, für den hier nichts steht, ist das ein
 * Übersetzungsfehler – nicht ein Absturz im Checkout. Dasselbe Vorgehen wie
 * bei den Preisregel-Handlern.
 *
 * `null` heißt „vorgesehen, aber noch nicht gebaut". Der Versuch, einen
 * solchen Anbieter zu nutzen, scheitert unten mit klarer Meldung statt mit
 * einem nichtssagenden Fehler.
 */
const ANBIETER: Record<ZahlungsAnbieterId, ZahlungsAnbieter | null> = {
  test: testAnbieter,
  stripe: stripeAnbieter,
};

/**
 * Ist ein Anbieter tatsächlich einsatzbereit?
 *
 * Der Stripe-Adapter EXISTIERT immer, funktioniert aber nur mit gültigem
 * Schlüssel. „Vorhanden" und „einsatzbereit" sind deshalb zweierlei: Ohne
 * Schlüssel gilt Stripe als nicht einsatzbereit, damit der Fehler HIER
 * auftritt (klare Meldung) und nicht erst tief im Checkout beim ersten
 * Stripe-Aufruf.
 */
function istEinsatzbereit(id: ZahlungsAnbieterId): boolean {
  if (!ANBIETER[id]) return false;
  if (id === 'stripe') return stripeKonfigurationsStand().zahlungenMoeglich;
  return true;
}

export class ZahlungsAnbieterFehlt extends Error {}

/**
 * Liefert den zu verwendenden Anbieter.
 *
 * ── Der Testmodus hat Vorrang ─────────────────────────────────────────
 * Läuft der Testmodus, wird IMMER der Testanbieter genommen – auch wenn
 * ausdrücklich ein anderer verlangt wird. Ohne diesen Vorrang könnte ein
 * Testlauf gegen eine Umgebung mit hinterlegten Zugangsdaten einen echten
 * Bezahlvorgang beim Anbieter anlegen. Dieselbe Überlegung wie bei der
 * Lieferantenautomatisierung, die der Testmodus ebenfalls überstimmt.
 *
 * @param gewuenscht Anbieter aus `orders.payment_provider`. Ohne Angabe gilt
 *                   der Standardanbieter.
 */
export function waehleZahlungsAnbieter(gewuenscht?: ZahlungsAnbieterId): ZahlungsAnbieter {
  if (istTestmodus()) return testAnbieter;

  // Vor jeder echten Verwendung prüfen: ein sk_live_-Schlüssel außerhalb des
  // Produktivbetriebs wäre der teuerste denkbare Konfigurationsfehler.
  warneBeiProduktivSchluessel();

  const id = gewuenscht ?? standardAnbieter();
  const anbieter = ANBIETER[id];
  if (!anbieter || !istEinsatzbereit(id)) {
    throw new ZahlungsAnbieterFehlt(
      `Zahlungsanbieter „${id}" ist nicht einsatzbereit. ` +
        `Einsatzbereit: ${(Object.keys(ANBIETER) as ZahlungsAnbieterId[]).filter(istEinsatzbereit).join(', ') || 'keiner'}.`
    );
  }
  return anbieter;
}

/**
 * Standardanbieter außerhalb des Testmodus.
 *
 * Solange Stripe nicht gebaut ist, gibt es produktiv keinen – und das soll
 * sich deutlich melden, statt still auf den Testanbieter auszuweichen. Ein
 * Testdoppel im Produktivbetrieb wäre der gefährlichste denkbare Fehler
 * dieser Datei: Bestellungen würden als bezahlt gelten, ohne dass Geld
 * geflossen ist.
 */
function standardAnbieter(): ZahlungsAnbieterId {
  return 'stripe';
}
