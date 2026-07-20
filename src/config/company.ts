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
  // Die tatsächlich existierende Firmendomain ist .com (per DNS verifiziert:
  // IONOS-Nameserver, aktive MX-Records, gültiger SPF). Die zuvor eingetragene
  // .de-Domain ist NICHT registriert – im Impressum wäre das ein Mangel.
  email: 'info@embroidery-republic.com',
  emailHref: 'mailto:info@embroidery-republic.com',
} as const;

/** Einzeilige Anschrift, z.B. für Fließtext. */
export const COMPANY_ADDRESS_LINE = `${COMPANY.street}, ${COMPANY.zip} ${COMPANY.city}`;

/** Zahlungsziel in Tagen ab Rechnungsdatum (ohne Abzug). */
export const PAYMENT_TERM_DAYS = 14;
