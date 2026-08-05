/**
 * Entscheidet anhand der ECHTEN Kleidungsfarbe, ob ein Motiv in der Vorschau
 * per „multiply" mit dem Textil verrechnet wird.
 *
 * ── Warum die Farbe und nicht das Foto ────────────────────────────────
 * Ein erster Versuch mittelte die Helligkeit des freigestellten Produktfotos.
 * Das ist unbrauchbar: Ein schwarzes Shirt-Foto mittelt wegen Glanzlichtern,
 * Falten und Etikett auf ~160 (also „mittel") – Schwarz und Navy wurden so
 * fälschlich als hell eingestuft und das Motiv per multiply abgedunkelt. Die
 * hinterlegte Farbe (Hex) ist eindeutig: Weiß 255, Schwarz nahe 0.
 *
 * ── Wirkung ───────────────────────────────────────────────────────────
 * Nur auf HELLEN Textilien ist „multiply" realistisch (der Druck nimmt die
 * Falten/Schatten des Stoffs an). Auf dunklen Textilien sitzt echter Druck mit
 * weißer Unterlage deckend obenauf – dort bleibt der normale Blend.
 */

/** Relative Helligkeit einer Hex-Farbe (0–255). Bei ungültigem Wert 0 (= dunkel,
 *  sicher: kein multiply, Motiv bleibt voll sichtbar). */
export function relativeHelligkeit(hex: string): number {
  const roh = hex.replace('#', '').trim();
  const v = roh.length === 3 ? roh.split('').map((c) => c + c).join('') : roh;
  if (v.length < 6) return 0;
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return 0;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Helles Textil (multiply sinnvoll) ab Luminanz > 150. Weiß/Naturweiß/helles
 *  Grau liegen deutlich darüber, Schwarz/Navy/Rot/Royal deutlich darunter. */
export function istHellesTextil(hex: string): boolean {
  return relativeHelligkeit(hex) > 150;
}
