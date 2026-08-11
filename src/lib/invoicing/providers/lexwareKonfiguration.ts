/**
 * ═══════════════════════════════════════════════════════════════════════
 * KONFIGURATION DES LEXWARE-ADAPTERS
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Nach demselben Muster wie stripeKonfiguration.ts. Ein wichtiger
 * Unterschied: Lexware kennt (Stand Aug 2026) KEINEN Schlüsselpräfix, der
 * Test- von Produktivzugang unterscheidet, wie Stripes "sk_test_"/"sk_live_"
 * – es gibt nur EIN echtes Konto, keine Sandbox. Der Schutz gegen einen
 * versehentlichen echten Rechnungslauf im Testbetrieb liegt deshalb
 * VOLLSTÄNDIG beim Testmodus-Vorrang in registry.ts (istTestmodus() siegt
 * immer), nicht in dieser Datei – hier gibt es keine zweite Schutzschicht
 * zu bauen, weil Lexware selbst keine Grundlage dafür liefert.
 */

/** Fehlt oder ist unbrauchbar – mit Hinweis, was zu tun ist. */
export class LexwareKonfigurationFehlt extends Error {
  constructor(nachricht: string) {
    super(nachricht);
    this.name = 'LexwareKonfigurationFehlt';
  }
}

const VARIABLE_API_KEY = 'LEXWARE_API_KEY';

function leseVariable(name: string): string | null {
  const wert = process.env[name]?.trim();
  return wert ? wert : null;
}

/**
 * Persönlicher API-Schlüssel für Aufrufe an Lexware Office (`erstelle`).
 *
 * Wirft, wenn er fehlt. Der Aufrufer ist der Adapter; die Registry übersetzt
 * die Ausnahme in „Anbieter nicht eingerichtet".
 */
export function leseApiSchluessel(): string {
  const wert = leseVariable(VARIABLE_API_KEY);
  if (!wert) {
    throw new LexwareKonfigurationFehlt(
      `${VARIABLE_API_KEY} ist nicht gesetzt. Der Schlüssel wird unter ` +
        `app.lexware.de/addons/public-api erzeugt und als Bearer-Token bei jedem ` +
        `Aufruf an api.lexware.io mitgegeben.`
    );
  }
  return wert;
}

export interface LexwareKonfigurationsStand {
  /** Rechnungen können erstellt werden. */
  rechnungenMoeglich: boolean;
  /** Was noch fehlt. */
  offeneSchritte: string[];
}

/** Aktueller Stand der Einrichtung – für Diagnose und Startprotokoll.
 *  Wirft NICHT, siehe stripeKonfigurationsStand() für dieselbe Haltung. */
export function lexwareKonfigurationsStand(): LexwareKonfigurationsStand {
  const apiKey = leseVariable(VARIABLE_API_KEY);
  const offeneSchritte: string[] = [];
  if (!apiKey) offeneSchritte.push(`${VARIABLE_API_KEY} eintragen (app.lexware.de/addons/public-api)`);

  return {
    rechnungenMoeglich: Boolean(apiKey),
    offeneSchritte,
  };
}
