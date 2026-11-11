/**
 * BESTELLWEG JE VEREDELUNGSART – die EINE Stelle, die entscheidet, was direkt
 * bestellt werden darf und was ausschließlich als Anfrage läuft.
 *
 * ── Stickerei gibt es nur auf Anfrage (Entscheidung des Betreibers) ──────
 * Bei Stickerei ist der angezeigte Preis eine Schätzung: Die tatsächliche
 * Stichzahl ergibt sich erst, wenn das Motiv digitalisiert ist. Deshalb darf
 * aus einer Stickerei-Konfiguration keine verbindliche Bestellung und keine
 * automatische Zahlung entstehen. Der Ablauf lautet stattdessen:
 *
 *   Anfrage → manuelle Prüfung → individuelles Angebot → Auftragsbestätigung
 *
 * Konfiguration und dynamische Preisberechnung bleiben unverändert – der Preis
 * wird nur als unverbindliche Kostenschätzung bezeichnet.
 *
 * ── Warum hier und nicht in den Oberflächen ──────────────────────────────
 * Dieselbe Frage („darf das bestellt werden?“) stellen Konfigurator,
 * Warenkorb und Server. Steht die Antwort an einer einzigen Stelle, können
 * sie nicht auseinanderlaufen; der Server (validateSubmission) erzwingt die
 * Regel unabhängig davon, was ein Browser sendet.
 *
 * Soll eine weitere Veredelungsart nur auf Anfrage laufen, genügt ein Eintrag
 * in NUR_AUF_ANFRAGE.
 */
import type { PrintMethod } from '@/types';

/** Veredelungsarten, die NICHT direkt bestellt, sondern nur angefragt werden. */
export const NUR_AUF_ANFRAGE: readonly PrintMethod[] = ['embroidery'];

/**
 * BETRIEBSSCHALTER – Veredelungsarten, die vorübergehend NICHT angeboten werden (Wartung, Umbau).
 *
 * Solange eine Art hier steht, gilt: Im Konfigurator ist sie ausgegraut und nicht wählbar, ein gespeicherter Stand
 * mit dieser Art fällt auf DTF zurück, ein Warenkorb mit solchen Positionen lässt sich weder bestellen noch als
 * Anfrage senden, und der Server nimmt weder Bestellung noch Anfrage damit an (validateSubmission, Code
 * `veredelung_pausiert`). Reine Kontaktaufnahme über das Kontaktformular bleibt möglich.
 *
 * Seit 2026-11-11: Stickerei pausiert (Wunsch des Betreibers, Wartungs- und Umbauarbeiten). WIEDER EINSCHALTEN: die
 * Liste leeren (`[]`) und neu ausliefern – dann gilt wieder die Regel „Stickerei nur auf Anfrage“ (NUR_AUF_ANFRAGE).
 *
 * Ein Objekt statt einer Konstante, damit Tests den Schalter umlegen können; Programmcode ändert ihn nie (siehe
 * stickereiPause.test.ts).
 */
export const BETRIEBSSCHALTER: { pausierteVeredelungen: PrintMethod[] } = {
  pausierteVeredelungen: ['embroidery'],
};

/** Wird diese Veredelungsart gerade angeboten? */
export function veredelungVerfuegbar(printMethod: PrintMethod): boolean {
  return !BETRIEBSSCHALTER.pausierteVeredelungen.includes(printMethod);
}

/** Die gewünschte Veredelungsart, wenn sie angeboten wird – sonst DTF (z. B. für gespeicherte Stände). */
export function erlaubteVeredelung(printMethod: PrintMethod): PrintMethod {
  return veredelungVerfuegbar(printMethod) ? printMethod : 'dtf';
}

/** Läuft diese Veredelungsart ausschließlich über eine Anfrage? */
export function istNurAufAnfrage(printMethod: PrintMethod): boolean {
  return NUR_AUF_ANFRAGE.includes(printMethod);
}

/**
 * Muss dieser Warenkorb als Anfrage gesendet werden?
 *
 * Genügt EINE Position mit Stickerei, gilt das für den ganzen Warenkorb:
 * Eine gemischte Bestellung würde sonst zur Hälfte verbindlich und zur Hälfte
 * unverbindlich ablaufen – das wäre für Kundschaft und Betrieb gleichermaßen
 * unklar.
 */
export function warenkorbNurAlsAnfrage(items: ReadonlyArray<{ printMethod: PrintMethod }>): boolean {
  return items.some((item) => istNurAufAnfrage(item.printMethod));
}

/**
 * Meldung an die Kundschaft, wenn ein Browser trotzdem eine Bestellung mit
 * Stickerei absendet (veralteter Stand, manipulierter oder ausgetrickster
 * Client). Die Oberfläche bietet diesen Weg gar nicht erst an – die Meldung
 * ist das Sicherheitsnetz.
 */
export const MELDUNG_STICKEREI_NUR_AUF_ANFRAGE =
  'Stickerei bestellen wir nicht direkt, sondern nur auf Anfrage. Bitte senden Sie Ihren Warenkorb als Anfrage – wir prüfen ihn persönlich und melden uns mit einem verbindlichen Angebot.';

/**
 * Meldung an die Kundschaft, wenn ein Browser trotzdem eine Bestellung oder Anfrage mit einer pausierten
 * Veredelungsart absendet (veralteter Stand im Browser, manipulierter Client). Die Oberfläche bietet diesen Weg gar
 * nicht erst an – die Meldung ist das Sicherheitsnetz.
 */
export const MELDUNG_STICKEREI_PAUSIERT =
  'Die Bestickung ist wegen Wartungs- und Umbauarbeiten vorübergehend nicht verfügbar. Bitte entfernen Sie die bestickten Positionen aus Ihrem Warenkorb oder wählen Sie DTF-Transferdruck.';
