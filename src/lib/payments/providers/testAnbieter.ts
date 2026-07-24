/**
 * ═══════════════════════════════════════════════════════════════════════
 * TEST-ZAHLUNGSANBIETER – vollwertige Implementierung des Ports
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Kein Platzhalter und kein Sonderweg, sondern der vierte Rand nach dem
 * bereits etablierten Muster (E-Mail, Dateien, Lieferanten – siehe
 * `src/config/testmodus.ts`). Der Bestellprozess spricht mit ihm über
 * denselben Port wie später mit Stripe und merkt keinen Unterschied.
 *
 * Damit lässt sich der gesamte Zahlungsablauf im End-to-End-Test
 * durchspielen, ohne ein fremdes Konto, ohne Netzverbindung und ohne dass
 * je Geld bewegt wird.
 *
 * ── Warum das kein „Mock" ist ─────────────────────────────────────────
 * Ein Mock ersetzt Verhalten im Test. Dieser Anbieter IST das Verhalten –
 * er wird über die reguläre Anbieterauswahl gewählt, durchläuft denselben
 * Code und erzeugt dieselben Ereignisse. Der Unterschied liegt allein darin,
 * dass die Gegenstelle wir selbst sind.
 */
import { randomUUID } from 'node:crypto';
import { meldeAbgefangen } from '@/config/testmodus';
import { formatiereGeld } from '@/lib/format';
import type {
  ZahlungsAnbieter,
  ZahlungsEreignis,
  ZahlungsEreignisArt,
  Zahlungsauftrag,
  Zahlungseroeffnung,
} from '../types';

/** Vorgänge dieses Laufs – nur zur Plausibilitätsprüfung beim Verwerfen. */
const offeneVorgaenge = new Map<string, { bestellId: string; betragCent: number }>();

/**
 * Erlaubte Ereignisarten. Wird beim Einlesen geprüft, damit ein Tippfehler
 * im Testaufruf nicht als gültiges Ereignis durchgeht.
 */
const ARTEN: readonly ZahlungsEreignisArt[] = ['bestaetigt', 'fehlgeschlagen', 'abgebrochen', 'abgelaufen'];

export const testAnbieter: ZahlungsAnbieter = {
  id: 'test',

  async eroeffne(auftrag: Zahlungsauftrag): Promise<Zahlungseroeffnung> {
    // Der Idempotenzschlüssel wird ernst genommen: Ein wiederholter Aufruf
    // mit demselben Schlüssel liefert denselben Vorgang zurück, statt einen
    // zweiten anzulegen. Genau das muss der echte Anbieter auch tun – ein
    // Testdoppel, das hier nachlässiger ist, würde einen Fehler verdecken.
    for (const [referenz, vorgang] of offeneVorgaenge) {
      if (referenz.endsWith(auftrag.idempotenzSchluessel)) {
        return { referenz, weiterleitungUrl: bezahlseite(referenz, auftrag) };
      }
    }

    const referenz = `test_${randomUUID()}_${auftrag.idempotenzSchluessel}`;
    offeneVorgaenge.set(referenz, { bestellId: auftrag.bestellId, betragCent: auftrag.betragCent });
    meldeAbgefangen(
      'Zahlung',
      `${auftrag.bestellnummer} über ${formatiereGeld(auftrag.betragCent / 100, auftrag.waehrung)} eröffnet (${referenz})`
    );
    return { referenz, weiterleitungUrl: bezahlseite(referenz, auftrag) };
  },

  /**
   * Liest ein Ereignis im Testformat.
   *
   * Die Signatur wird bewusst GEPRÜFT, obwohl es hier nichts zu fälschen
   * gibt: Der Aufrufer soll denselben Weg gehen wie beim echten Anbieter,
   * damit ein fehlender Signaturvergleich später auffällt und nicht erst im
   * Produktivbetrieb.
   */
  leseEreignis(rohBody: string, signatur: string | null): ZahlungsEreignis | null {
    if (signatur !== TEST_SIGNATUR) {
      console.warn('[zahlung:test] Ereignis mit ungültiger Signatur verworfen.');
      return null;
    }
    let roh: Record<string, unknown>;
    try {
      roh = JSON.parse(rohBody) as Record<string, unknown>;
    } catch {
      console.warn('[zahlung:test] Ereignis ist kein gültiges JSON.');
      return null;
    }

    const art = String(roh.art ?? '') as ZahlungsEreignisArt;
    if (!ARTEN.includes(art)) {
      console.warn(`[zahlung:test] Unbekannte Ereignisart „${roh.art}" verworfen.`);
      return null;
    }
    const bestellId = String(roh.bestellId ?? '');
    const referenz = String(roh.referenz ?? '');
    if (!bestellId || !referenz) {
      console.warn('[zahlung:test] Ereignis ohne bestellId/referenz verworfen.');
      return null;
    }

    return {
      ereignisId: String(roh.ereignisId ?? `test_evt_${randomUUID()}`),
      bestellId,
      referenz,
      art,
      betragCent: Number(roh.betragCent ?? 0),
      waehrung: String(roh.waehrung ?? 'EUR'),
      transaktionId: roh.transaktionId ? String(roh.transaktionId) : undefined,
      grund: roh.grund ? String(roh.grund) : undefined,
    };
  },

  async verwerfe(referenz: string): Promise<void> {
    // Kein Fehler, wenn der Vorgang unbekannt ist – der Port sagt
    // ausdrücklich zu, dass Verwerfen nicht wirft. Ein bereits abgelaufener
    // Vorgang ist der Normalfall, nicht die Ausnahme.
    if (offeneVorgaenge.delete(referenz)) {
      meldeAbgefangen('Zahlung', `Vorgang ${referenz} verworfen`);
    }
  },
};

/**
 * Signatur, die eingehende Testereignisse tragen müssen.
 *
 * Fest und offen im Quelltext – sie schützt nichts, sie erzwingt nur, dass
 * der Aufrufer den Signaturweg überhaupt beschreitet. Der echte Anbieter
 * bringt sein eigenes Verfahren mit.
 */
export const TEST_SIGNATUR = 'testmodus-signatur';

/**
 * Die „Bezahlseite" des Testanbieters: eine URL, die unmittelbar auf unsere
 * Rückkehradresse zeigt. Ein Testlauf durchläuft damit dieselbe
 * Weiterleitungskette wie eine echte Zahlung, nur ohne Gegenstelle.
 */
function bezahlseite(referenz: string, auftrag: Zahlungsauftrag): string {
  const url = new URL(auftrag.rueckkehrUrl);
  url.searchParams.set('zahlung', 'test');
  url.searchParams.set('referenz', referenz);
  return url.toString();
}

/** Nur für Tests: setzt den Zustand zwischen zwei Läufen zurück. */
export function _testAnbieterZuruecksetzen(): void {
  offeneVorgaenge.clear();
}
