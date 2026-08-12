/**
 * ═══════════════════════════════════════════════════════════════════════
 * KONFIGURATION DER BUCHHALTUNGS-SYNCHRONISIERUNG
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Liest und prüft den API-Schlüssel für GET /api/accounting/v1/orders –
 * gleiches Muster wie stripeKonfiguration.ts/dhlKonfiguration.ts: eigene
 * Datei, einzige Stelle, die die Umgebungsvariable liest, kein stiller
 * Ausweichwert, kein Loggen des Werts.
 *
 * ── Kein stiller Ausweichweg ──────────────────────────────────────────
 * Ohne konfigurierten Schlüssel liefert der Endpunkt 503 (nicht
 * scharf geschaltet) statt eines geratenen/leeren Vergleichswerts – exakt
 * das Verhalten des bestehenden Cron-Endpunkts (CRON_SECRET).
 *
 * ── Schlüssel taucht NIEMALS im Protokoll auf ─────────────────────────
 * Keine Fehlermeldung dieser Datei enthält den Wert von ACCOUNTING_API_KEY,
 * auch nicht gekürzt.
 */

export class AccountingSyncKonfigurationFehlt extends Error {
  constructor(nachricht: string) {
    super(nachricht);
    this.name = 'AccountingSyncKonfigurationFehlt';
  }
}

const VARIABLE = 'ACCOUNTING_API_KEY';

/**
 * Der geheime Schlüssel, den die lokale Buchhaltungs-Anwendung als
 * `Authorization: Bearer <Schlüssel>` mitschickt.
 *
 * Wirft, wenn er fehlt. Der Aufrufer (die Route) übersetzt das in eine
 * 503-Antwort, dieselbe Behandlung wie beim Cron-Endpunkt.
 */
export function leseApiSchluessel(): string {
  const wert = process.env[VARIABLE]?.trim();
  if (!wert) {
    throw new AccountingSyncKonfigurationFehlt(
      `${VARIABLE} ist nicht gesetzt. Ohne diesen Schlüssel bleibt der Buchhaltungs-Sync-Endpunkt ` +
        `deaktiviert (503). Ein zufälliger, ausreichend langer Wert (mind. 32 Zeichen) muss hier ` +
        `UND in den Einstellungen der lokalen Buchhaltungs-Anwendung identisch hinterlegt werden.`
    );
  }
  return wert;
}

/** true, sobald ein Schlüssel hinterlegt ist – für Diagnose/Startprotokoll, wirft nie. */
export function accountingSyncIstKonfiguriert(): boolean {
  return Boolean(process.env[VARIABLE]?.trim());
}
