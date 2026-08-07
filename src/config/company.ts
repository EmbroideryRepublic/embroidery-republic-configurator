/**
 * Firmen- und Kontaktdaten – einzige Quelle der Wahrheit.
 *
 * Impressum, Datenschutzerklärung, AGB, Kontaktseite und Footer beziehen ihre
 * Angaben ausschließlich von hier. Dadurch können sie nicht auseinanderlaufen,
 * und eine Änderung (z.B. neue Anschrift) wirkt sofort überall.
 */
export const COMPANY = {
  /** Marken-/Handelsname für Überschriften und Marketingtexte. */
  tradeName: 'Embroidery Republic Germany',
  /** Vollständige Rechtsform-Bezeichnung für Impressum, AGB & Rechnungen. */
  legalName: 'Embroidery Republic Germany – Ihsan Uzun & Enes Malkoc GbR',
  /** Vertretungsberechtigte Gesellschafter der GbR. */
  partners: ['Ihsan Uzun', 'Enes Malkoc'] as const,

  street: 'Ingendorferweg 81',
  zip: '50829',
  city: 'Köln',
  country: 'Deutschland',

  phone: '0173 7532910',
  phoneHref: 'tel:+491737532910',
  email: 'info@ergermany.de',
  emailHref: 'mailto:info@ergermany.de',
} as const;

/** Einzeilige Anschrift, z.B. für Fließtext. */
export const COMPANY_ADDRESS_LINE = `${COMPANY.street}, ${COMPANY.zip} ${COMPANY.city}`;

/** Zahlungsziel in Tagen ab Rechnungsdatum (ohne Abzug). */
export const PAYMENT_TERM_DAYS = 14;

/**
 * Reguläre Produktionszeit in Werktagen (ab Bestellfreigabe).
 *
 * Stand zuvor als Literal in Footer, Startseite, Produktseite und „Über uns" –
 * vier Stellen mit drei Schreibweisen („3–4 Werktage", „3 bis 4 Werktagen",
 * „3–4"). Ändert sich die Zusage, gehört sie an genau eine Stelle.
 *
 * Bewusst NICHT in AGB und FAQ eingesetzt: Das sind Rechts- und Fließtexte,
 * die als zusammenhängende Prosa gelesen und juristisch geprüft werden.
 * Variablen im Vertragstext erschweren diese Prüfung mehr, als sie nutzen.
 */
export const PRODUKTIONSTAGE = { von: 3, bis: 4 } as const;

/** Versanddauer in Werktagen nach abgeschlossener Produktion. */
export const VERSANDTAGE = { von: 1, bis: 2 } as const;

/** Einheitliche Schreibweise für die Oberfläche, z.B. „3–4 Werktage". */
export const PRODUKTIONSZEIT_TEXT = `${PRODUKTIONSTAGE.von}–${PRODUKTIONSTAGE.bis} Werktage`;
