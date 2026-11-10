/**
 * Sprachumschalter (DE/EN) im Seitenkopf.
 *
 * Ausgeblendet (Stand 2026-11-10): Die englische Fassung ist nur teilweise übersetzt – der Konfigurator
 * ist weitgehend englisch, die Startseite gemischt, Produktseiten und Rechtstexte bleiben deutsch, und
 * <html lang> und Seitentitel bleiben immer deutsch. Geliefert wird ohnehin nur nach Deutschland.
 * Eine halb übersetzte Oberfläche wirkt unfertig und ist für Screenreader falsch ausgezeichnet.
 *
 * Wieder einschalten: auf `true` setzen – sinnvoll erst, wenn alle Seiten vollständig übersetzt sind.
 * Solange er aus ist, gilt für ALLE Besucher Deutsch – auch für solche, die früher "EN" gewählt haben
 * (gespeicherte Wahl wird ignoriert, siehe stores/languageStore.ts::waehleSprache).
 */
export const SPRACHUMSCHALTER_AKTIV = false;
