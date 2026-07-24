/**
 * ═══════════════════════════════════════════════════════════════════════
 * TESTMODUS – vollständiger Bestellablauf ohne Wirkung nach außen
 * ═══════════════════════════════════════════════════════════════════════
 *
 * ── Warum es ihn gibt ─────────────────────────────────────────────────
 * Bis Juli 2026 prüfte die Abnahme nur die Browserseite: Die Prüfstrecke
 * fing alle Absende-Requests ab, damit keine echten Bestellungen entstehen.
 * Dadurch lief der SERVERPFAD nie mit – und blieb wochenlang unbemerkt
 * defekt, weil eine Migration nicht angewendet war. Jede Bestellung schlug
 * fehl, während die Abnahme „grün" meldete.
 *
 * Der Testmodus schließt genau diese Lücke: Der komplette Serverpfad läuft
 * ECHT – Validierung, Preispipeline, Datenbank, Rendering, Produktionsblatt.
 * Nur die Wirkung nach AUSSEN wird abgefangen.
 *
 * ── Was NICHT verändert wird ──────────────────────────────────────────
 * Es gibt keine zweite Fassung des Bestellprozesses. `orders.ts`,
 * `orderValidation.ts`, `serverPricing.ts`, `orderIntake.ts` und
 * `orderService.ts` kennen diesen Schalter überhaupt nicht. Umgeschaltet
 * wird ausschließlich an den drei Rändern, an denen das System die Welt
 * berührt:
 *
 *   1. E-Mail   (lib/email/sendEmail.ts, scheduledEmails.ts)
 *   2. Dateien  (lib/supabase/storage.ts)
 *   3. Lieferantenbestellungen (lib/suppliers/lifecycle/enqueue.ts)
 *
 * ── Unterdrücken vs. Ersetzen ─────────────────────────────────────────
 * E-Mails werden UNTERDRÜCKT: Sie haben keine Rückwirkung auf den weiteren
 * Ablauf, außer dass eine Nachrichten-ID zurückkommt. Die wird erzeugt,
 * damit der Erfolgszweig durchlaufen wird – ein `success: false` würde einen
 * anderen Pfad testen als den produktiven.
 *
 * Dateien werden ERSETZT (lokale Ablage statt Supabase Storage): Das
 * Druckvorschau-Rendering lädt hochgeladene Logos wieder HERUNTER. Würde man
 * den Upload nur unterdrücken, schlüge der Download fehl – und weil dieser
 * Schritt bewusst nicht-fatal ist, liefe der Test grün durch, während
 * Rendering und Produktionsblatt übersprungen würden. Also genau die Art
 * blinder Fleck, wegen der es den Testmodus überhaupt gibt.
 *
 * ── Sicherheit ────────────────────────────────────────────────────────
 * Der Schalter verlangt den exakten Wert "aktiv" – nicht "true" oder "1",
 * die versehentlich irgendwo gesetzt sein könnten. Er wird ausschließlich
 * aus der Umgebung gelesen, NIE aus einem Request: Käme er vom Client,
 * könnte jeder Besucher den E-Mail-Versand abschalten.
 */

/** Exakter Wert, der den Testmodus einschaltet. */
const SCHALTER = 'aktiv';

/**
 * true = externe Wirkungen werden abgefangen.
 *
 * Bewusst bei JEDEM Aufruf neu gelesen statt einmalig zwischengespeichert:
 * Ein zwischengespeicherter Wert würde beim Modultest je nach Ladereihenfolge
 * einfrieren und wäre dann nicht mehr umschaltbar.
 */
export function istTestmodus(): boolean {
  return process.env.E2E_TESTMODUS === SCHALTER;
}

/**
 * Kennzeichnung, die statt einer echten Nachrichten-ID zurückgegeben wird.
 *
 * Das Präfix ist der NACHWEIS im Testlauf: Es landet über die bestehende
 * Protokollierung in `order_events.detail.messageId`. Der End-to-End-Test
 * liest es von dort und kann damit belegen, dass die Bestätigungsmail
 * ausgelöst WURDE – und dass sie den Rechner nicht verlassen hat.
 */
export const TESTMODUS_PRAEFIX = 'testmodus:';

export function testmodusKennung(zweck: string): string {
  return `${TESTMODUS_PRAEFIX}${zweck}:${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Einheitlicher Protokolleintrag für eine abgefangene Wirkung.
 *
 * Bewusst `console.info` und nicht still: Wer die Serverausgabe eines
 * Testlaufs liest, muss auf einen Blick sehen, was NICHT hinausgegangen ist.
 */
export function meldeAbgefangen(bereich: string, beschreibung: string): void {
  console.info(`[testmodus] ${bereich} abgefangen: ${beschreibung}`);
}
