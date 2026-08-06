/* GENERIERT von scripts/generateFarbdubletten.mts – nicht von Hand ändern. */
/**
 * Farben, die eine ANDERE Farbe desselben Produkts bytegleich wiederholen.
 *
 * Ursache sind doppelte Katalogeinträge: dieselbe Herstellerfarbe einmal
 * benannt und einmal nur als Hexwert geführt. Der Kunde bekäme zwei Farbfelder
 * mit demselben Foto dahinter. Ausgeblendet wird die namenlose Dublette; die
 * Produktdefinition bleibt vollständig.
 */
export const FARBDUBLETTEN: Record<string, readonly string[]> = {
  'build-your-brand-ultra-heavy-cotton-box-hoody': ['e8e7e3'],
  'bundc-t-shirt-e150': ['101145'],
  'neutral-men-s-long-sleeve-t-shirt': ['b8b8b8'],
};

/**
 * Bytegleiche Bilder bei zwei BENANNTEN Farben – also keine Dublette, sondern
 * eine Fehlzuordnung: Eine der beiden Farben zeigt das Bild der anderen. Solche
 * Fälle werden NICHT ausgeblendet (das würde den Fehler verstecken), sondern
 * hier sichtbar gehalten, bis das richtige Bild beschafft ist.
 */
export const FARBGLEICHHEIT_OFFEN: readonly string[] = [
  'bundc-inspire-e150-t-shirt: navy-blue == navy',
  'stedman-clive-crew-neck: black-opal == blue-midnight',
  'sols-men-s-long-sleeve-t-shirt-imperial: charcoal-melange == deep-black',
];
