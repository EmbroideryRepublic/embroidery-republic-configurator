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

  /** Kundenkonto-Anmeldung: dasselbe Motiv wie adminLogin, nur mit vielen
   *  statt einer Person – deshalb mit E-Mail als zweitem Merkmal statt
   *  reinem IP-Limit, sonst träfe ein Angriff auf ein Konto alle hinter
   *  derselben Firmenadresse. */
  kontoAnmeldung: {
    id: 'konto_anmeldung',
    max: 8,
    fensterSekunden: 15 * MINUTE,
    merkmal: 'ip_und_merkmal',
    begruendung:
      'Acht Versuche je Viertelstunde je E-Mail+Adresse machen Passwort-Raten aussichtslos, ohne echte ' +
      'Tippfehler-Serien zu bestrafen.',
  },

  /** Registrierung: begrenzt automatisiertes Anlegen vieler Konten. */
  kontoRegistrierung: {
    id: 'konto_registrierung',
    max: 5,
    fensterSekunden: STUNDE,
    merkmal: 'ip',
    begruendung: 'Eine Person legt selten mehr als ein Konto je Stunde an. Bremst automatisiertes Massenanlegen.',
  },

  /** "Passwort vergessen": verhindert, dass sich der E-Mail-Versand als
   *  Belästigungsvektor gegen fremde Adressen missbrauchen lässt. */
  kontoPasswortVergessen: {
    id: 'konto_passwort_vergessen',
    max: 5,
    fensterSekunden: STUNDE,
    merkmal: 'ip_und_merkmal',
    begruendung:
      'Fünf Anforderungen je Stunde je Adresse genügen für jeden echten Fall und verhindern, dass die ' +
      'Funktion als E-Mail-Spam-Vektor gegen eine fremde Adresse missbraucht wird.',
  },

  /** Schreibende Kontoänderungen bei bereits angemeldeter Sitzung: die vier
   *  Adressbuch-Aktionen sowie Profil-, E-Mail- und Passwortwechsel. Ein
   *  gemeinsames Limit für alle sieben – dieselbe Sitzung ist das
   *  schützenswerte Gut, nicht das einzelne Feld. Merkmal ist die
   *  Kunden-ID: Begrenzt eine gekaperte oder automatisierte Sitzung, ohne
   *  eine Familie/Firma hinter derselben Adresse beim gemeinsamen Kontieren
   *  zu behindern. */
  kontoAenderung: {
    id: 'konto_aenderung',
    max: 20,
    fensterSekunden: STUNDE,
    merkmal: 'ip_und_merkmal',
    begruendung:
      'Zwanzig schreibende Änderungen je Stunde je Konto decken jede reale Nutzung ab (mehrere Adressen ' +
      'anlegen, Profil anpassen) und bremsen automatisiertes Schreiben über eine gekaperte Sitzung.',
  },
} as const satisfies Record<string, RateLimit>;

export type RateLimitName = keyof typeof RATE_LIMITS;
