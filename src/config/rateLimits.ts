/**
 * ═══════════════════════════════════════════════════════════════════════
 * RATE-LIMITS – alle Grenzen an einer Stelle
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Reine Konfiguration, keine Logik. Die Werte lassen sich ändern, ohne eine
 * einzige Zeile Berechnung anzufassen.
 *
 * Herleitung jedes Werts und die Restrisiken: docs/rate-limiting.md
 */

/** Womit ein Zugriff identifiziert wird. */
export type Merkmal =
  /** Nur die Adresse. Für Endpunkte ohne besseres Merkmal. */
  | 'ip'
  /**
   * Adresse UND ein fachliches Merkmal (E-Mail, Token). Trennt Personen
   * hinter derselben NAT-Adresse – Firmen und Mobilfunk werden dadurch
   * nicht benachteiligt.
   */
  | 'ip_und_merkmal';

export interface RateLimit {
  /** Kennung, erscheint im Schlüssel und im Protokoll. */
  id: string;
  /** Erlaubte Zugriffe je Fenster. */
  max: number;
  /** Fensterlänge in Sekunden. */
  fensterSekunden: number;
  merkmal: Merkmal;
  /** Warum dieser Wert – für die Nachvollziehbarkeit bei Änderungen. */
  begruendung: string;
}

const MINUTE = 60;
const STUNDE = 60 * 60;

export const RATE_LIMITS = {
  /**
   * Der wichtigste: Ohne Begrenzung lässt sich das Admin-Secret beliebig
   * oft raten, und wer es errät, sieht alle Bestellungen und Kundendaten.
   */
  adminLogin: {
    id: 'admin_login',
    max: 5,
    fensterSekunden: 15 * MINUTE,
    merkmal: 'ip',
    begruendung:
      'Ein Betreiber vertippt sich zwei-, dreimal. 20 Versuche je Stunde machen jedes Raten aussichtslos. ' +
      'NAT ist hier kein Thema – der Nutzerkreis besteht aus einer Person.',
  },

  /**
   * Der teuerste Pfad: Datei-Uploads, Vorschau-Rendering, Produktionsblatt
   * und zwei E-Mails je Vorgang.
   */
  bestellung: {
    id: 'bestellung',
    max: 10,
    fensterSekunden: STUNDE,
    merkmal: 'ip',
    begruendung:
      'Eine Person bestellt selten öfter. Großzügig genug für ein Büro hinter einer gemeinsamen Adresse, ' +
      'eng genug gegen automatisierte Wellen. Doppelbestellungen verhindert die Idempotenz, nicht dieses Limit.',
  },

  /** Unverbindlich und im Ablauf günstiger als eine Bestellung. */
  anfrage: {
    id: 'anfrage',
    max: 15,
    fensterSekunden: STUNDE,
    merkmal: 'ip',
    begruendung: 'Kein Zahlungsvorgang, geringerer Aufwand je Vorgang – darf höher liegen als die Bestellung.',
  },

  /** Übernimmt den bisher im Prozessspeicher gehaltenen Wert. */
  kontakt: {
    id: 'kontakt',
    max: 5,
    fensterSekunden: 10 * MINUTE,
    merkmal: 'ip_und_merkmal',
    begruendung:
      'Wert aus dem bisherigen In-Memory-Limit, hat sich bewährt. Mit der E-Mail-Adresse als zweitem Merkmal ' +
      'trifft es nicht mehr alle hinter derselben Firmenadresse gemeinsam.',
  },

  /**
   * Der Zahlungs-Webhook. Signaturgeprüft, aber jede Anfrage kostet eine
   * Signaturprüfung. Großzügig, weil Stripe bei einem Ausfall viele
   * Ereignisse in kurzer Folge nachliefern kann – das Limit soll echte
   * Zustellungen nicht aussperren, nur eine Flut gefälschter Anfragen bremsen.
   */
  webhook: {
    id: 'webhook',
    max: 120,
    fensterSekunden: MINUTE,
    merkmal: 'ip',
    begruendung:
      'Nach der Signaturprüfung gesetzt, nie davor – sonst könnte eine Flut gefälschter Anfragen echte ' +
      'Stripe-Zustellungen aussperren. 120/Minute liegt weit über normaler Zustellrate, bremst aber Missbrauch.',
  },

  /** Der Storno-Token ist geheim – wiederholte Fehlversuche deuten auf Raten. */
  stornierung: {
    id: 'stornierung',
    max: 10,
    fensterSekunden: STUNDE,
    merkmal: 'ip_und_merkmal',
    begruendung: 'Ein Token gehört zu genau einer Bestellung. Zehn Versuche je Stunde reichen für jeden echten Fall.',
  },
} as const satisfies Record<string, RateLimit>;

export type RateLimitName = keyof typeof RATE_LIMITS;
