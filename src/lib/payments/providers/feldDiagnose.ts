/**
 * ═══════════════════════════════════════════════════════════════════════
 * STRUKTUR-DIAGNOSE EINER UMGEBUNGSVARIABLEN – NIEMALS DER WERT SELBST
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Beantwortet "sieht dieser Wert plausibel aus?", ohne ihn preiszugeben:
 * vorhanden, Länge, ob er in Anführungszeichen eingeschlossen ist (häufigster
 * Copy-Paste-Fehler beim Eintragen in Vercel: der komplette Wert inkl. der
 * Anführungszeichen wird eingefügt), ob er führende/nachgestellte
 * Leerzeichen trägt, und ob er mit einem der erwarteten Präfixe beginnt
 * (z.B. "sk_" bei Stripe). Der Rückgabewert enthält an keiner Stelle den
 * Wert selbst, auch nicht gekürzt – dieselbe Zusage wie
 * stripeKonfiguration.ts/paypalKonfiguration.ts.
 *
 * Grundlage für lib/payments/registry.ts::zahlungsDiagnose(), aufgerufen aus
 * dem admin-geschützten /api/health?detail=1 (Fund vom 2026-08-31:
 * PayPal/Stripe zeigten sich im Checkout beide als nicht einsatzbereit,
 * obwohl `vercel env ls` alle Variablen als gesetzt auswies – ohne diese
 * Diagnose ließ sich das nur durch Ansehen der echten Werte klären, was der
 * Betreiber ausdrücklich vermeiden wollte).
 */

export interface FeldDiagnose {
  vorhanden: boolean;
  /** null, wenn die Variable gar nicht gesetzt ist. */
  laenge: number | null;
  hatFuehrendesOderNachgestelltesLeerzeichen: boolean;
  /** true, wenn der (getrimmte) Wert mit " oder ' beginnt UND damit endet –
   *  der Wert wurde vermutlich versehentlich MIT den Anführungszeichen
   *  kopiert, die eigentlich nur den Wert in der Quelle markierten. */
  inAnfuehrungszeichenEingeschlossen: boolean;
  /** Je erwartetem Präfix (z.B. "sk_"), ob der GETRIMMTE Wert damit beginnt.
   *  Leer, wenn keine Präfixe erwartet werden (z.B. PayPal-Client-ID/Secret
   *  haben kein festes Präfix-Schema). */
  beginntMitErwartetemPraefix: Record<string, boolean>;
}

/**
 * Liest `process.env[name]` NUR zur Strukturprüfung – der Wert verlässt
 * diese Funktion nie, außer als abgeleitete Booleans/Zahlen.
 */
export function diagnostiziereFeld(name: string, erwartetePraefixe: readonly string[] = []): FeldDiagnose {
  const roh = process.env[name];

  if (roh === undefined || roh === '') {
    return {
      vorhanden: false,
      laenge: roh === '' ? 0 : null,
      hatFuehrendesOderNachgestelltesLeerzeichen: false,
      inAnfuehrungszeichenEingeschlossen: false,
      beginntMitErwartetemPraefix: Object.fromEntries(erwartetePraefixe.map((p) => [p, false])),
    };
  }

  const getrimmt = roh.trim();
  const inAnfuehrungszeichen =
    getrimmt.length >= 2 &&
    ((getrimmt.startsWith('"') && getrimmt.endsWith('"')) || (getrimmt.startsWith("'") && getrimmt.endsWith("'")));

  return {
    vorhanden: true,
    laenge: roh.length,
    hatFuehrendesOderNachgestelltesLeerzeichen: roh !== getrimmt,
    inAnfuehrungszeichenEingeschlossen: inAnfuehrungszeichen,
    beginntMitErwartetemPraefix: Object.fromEntries(erwartetePraefixe.map((p) => [p, getrimmt.startsWith(p)])),
  };
}
