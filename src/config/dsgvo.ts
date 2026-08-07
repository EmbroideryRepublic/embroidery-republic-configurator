/**
 * DSGVO-Löschkonzept – Aufbewahrungsfristen als benannte Konstanten.
 *
 * Reine Konfiguration, keine Datenbank, keine Nebenwirkungen. Verwendet von
 * der Cron-Route (Anfragen/Anonymisierung, via die RPCs aus Migration 0022)
 * und von `scripts/dsgvoAltdateien.mts` (Motivdateien im Speicher).
 *
 * Ausführliche Begründung jeder Frist: docs/dsgvo-loeschkonzept.md. Die
 * beiden erstgenannten Werte sind zusätzlich WÖRTLICH in der
 * Datenschutzerklärung versprochen (src/app/datenschutz/page.tsx, Ziffer 10)
 * – eine Änderung hier verlangt zwingend, den Text dort mitzuziehen.
 */

/**
 * Anfragen (order_type = 'inquiry'), die nicht zu einem Vertrag führen,
 * werden nach dieser Frist HART gelöscht. Es besteht keine gesetzliche
 * Aufbewahrungspflicht – anders als bei echten Bestellungen.
 *
 * Zusage in der Datenschutzerklärung, Ziffer 10: "spätestens nach Ablauf
 * von sechs Monaten".
 */
export const ANFRAGE_LOESCHT_NACH_MONATEN = 6;

/**
 * Nach dieser Frist verlieren personenbezogene Felder EINER BESTELLUNG ihre
 * Rechtsgrundlage zur Aufbewahrung und werden anonymisiert (nicht: die
 * Zeile gelöscht – Positionen/Preise/Steuerdaten bleiben als Finanzarchiv
 * bestehen, siehe Migration 0022).
 *
 * § 147 AO / § 257 HGB: zehn Jahre für aufbewahrungspflichtige Unterlagen.
 * Zusage in der Datenschutzerklärung, Ziffer 10.
 */
export const BESTELLUNG_ANONYMISIERT_NACH_JAHREN = 10;

/**
 * Hochgeladene Kundenlogos/Motive und daraus gerenderte Druckvorschauen
 * sind NICHT Teil der aufbewahrungspflichtigen Rechnungsunterlage (§ 147
 * AO betrifft Buchungsbelege, nicht Werkdateien) und werden deutlich früher
 * aus dem Speicher entfernt als die Bestellung selbst anonymisiert wird.
 *
 * 24 Monate ab Abschluss (completed_at) bzw. Stornierung (cancelled_at):
 * lang genug, um eine Mängelrüge (AGB § 10, 7-Tage-Frist nach § 377 HGB ist
 * die untere Grenze, hier bewusst großzügiger) oder eine Nachbestellung mit
 * identischem Motiv zu bedienen; kurz genug, um eine echte
 * Datensparsamkeits-Maßnahme zu sein und nicht nur dem Namen nach zu
 * bestehen.
 *
 * Betrifft AUSSCHLIESSLICH den Dateispeicher (Supabase Storage). Die
 * Bestellzeile selbst bleibt unverändert bis zur Anonymisierung nach
 * `BESTELLUNG_ANONYMISIERT_NACH_JAHREN`.
 */
export const BESTELLDATEIEN_LOESCHEN_NACH_MONATEN = 24;
