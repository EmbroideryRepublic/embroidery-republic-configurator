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

  /**
   * Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG. Erscheint automatisch
   * im Impressum (impressum/page.tsx) und auf jeder Rechnung (lib/invoicing/,
   * lib/email/templates/InvoiceEmail.tsx) – eine einzige Quelle für alle drei
   * Stellen, wie der Rest dieser Datei.
   */
  vatId: 'DE459472292',
  /**
   * Betriebliche Steuernummer (Finanzamt). Nach § 14 Abs. 4 Nr. 2 UStG genügt
   * grundsätzlich EINE der beiden Angaben (Steuernummer ODER USt-IdNr.) – hier
   * sind beide hinterlegt und werden deshalb beide angezeigt. Diese Angabe
   * entfällt NICHT durch die Kleinunternehmerregelung (§19 UStG betrifft nur
   * den Steuerausweis, nicht diese Pflichtangabe).
   */
  steuernummer: '223/5065/4984',
} as const;

/**
 * Kleinunternehmer nach § 19 UStG: keine Umsatzsteuer auf eigene Umsätze.
 * Einzelner Schalter statt Einstellungstabelle – diese Website betreibt
 * genau eine Rechtsperson (siehe COMPANY oben), keine Mandantenfähigkeit
 * nötig. Wirkt auf die Steuerzeile in Rechnung/Rechnungs-E-Mail (siehe
 * lib/orders/orderCompletion.ts, lib/invoicing/providers/internRechnungPdf.tsx,
 * lib/email/templates/InvoiceEmail.tsx).
 */
export const IST_KLEINUNTERNEHMER = true as const;

/** Pflichthinweis auf einer Kleinunternehmer-Rechnung anstelle einer Steuerzeile. */
export const KLEINUNTERNEHMER_HINWEIS = 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet und ausgewiesen.';

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
