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
  'bundc-t-shirt-e150': ['101145'],
};

/**
 * Bytegleiche Bilder bei zwei BENANNTEN Farben – also keine Dublette, sondern
 * eine Fehlzuordnung: Eine der beiden Farben zeigt das Bild der anderen. Solche
 * Fälle werden NICHT ausgeblendet (das würde den Fehler verstecken), sondern
 * hier sichtbar gehalten, bis das richtige Bild beschafft ist.
 */
export const FARBGLEICHHEIT_OFFEN: readonly string[] = [

];
