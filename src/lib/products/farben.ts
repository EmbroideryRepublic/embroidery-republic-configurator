import { assetVerfuegbarkeit } from '@/lib/assets';
import { FARBDUBLETTEN } from '@/config/farbdubletten.generated';

/**
 * Farben, die dem Kunden zur AUSWAHL gestellt werden dürfen.
 *
 * Gegenstück zu `sichtbareAnsichten()`: Dort geht es um „welche Ansicht darf ich
 * zeigen", hier um „welche Farbe darf ich anbieten".
 *
 * Die Katalogpaletten führen bewusst ALLE Herstellerfarben – sie sind die
 * fachliche Wahrheit über das Produkt und werden nicht beschnitten (Bestell-
 * validierung, Lieferanten-Mapping und Facetten-Statistik hängen daran).
 * Anbieten dürfen wir aber nur, was wir auch zeigen können: Eine Farbe ohne
 * echtes Herstellerfoto führte im Konfigurator zur Platzhalter-Silhouette,
 * sobald der Kunde sie anklickte. Genau das soll es nicht mehr geben.
 *
 * Damit ist die Regel strukturell statt per gepflegter Ausschlussliste: Sobald
 * der Bildimport eine Farbe nachliefert, erscheint sie von selbst wieder. Farben,
 * für die nach der Recherche nirgends ein offizielles Foto existiert, bleiben
 * ausgeblendet und stehen in docs/bildimport-abschlussbericht.md.
 *
 * Notnagel: Hat ein Produkt für KEINE Farbe Fotos, werden alle Farben gezeigt –
 * eine leere Farbleiste wäre schlimmer als ein Platzhalter. Der Wächtertest in
 * farben.test.ts stellt sicher, dass dieser Fall im Katalog nicht vorkommt.
 */
export function waehlbareFarben<T extends { id: string }>(
  productId: string,
  colors: readonly T[]
): readonly T[] {
  // Zusätzlich fallen Farben weg, die eine andere Farbe desselben Produkts
  // bytegleich wiederholen (doppelte Katalogeinträge, siehe FARBDUBLETTEN) –
  // zwei Farbfelder mit demselben Foto dahinter sind für den Kunden ein Fehler.
  const doppelt = FARBDUBLETTEN[productId];
  const mitFoto = colors.filter(
    (c) => assetVerfuegbarkeit(productId, c.id) === 'vorhanden' && !doppelt?.includes(c.id)
  );
  return mitFoto.length ? mitFoto : colors;
}

/** Erkennt einen rohen 6-stelligen Hex-Code ohne führendes „#". */
const HEX_OHNE_RAUTE = /^[0-9A-Fa-f]{6}$/;

/**
 * Anzeigename einer Farbe.
 *
 * Für einige Katalogfarben liegt kein echter Herstellername vor (nicht
 * erfunden!) – der Katalog führt dann ersatzweise den rohen Hex-Code als
 * `name` (z.B. „555B66"). Unmarkiert sähe das für Kundin und Screenreader wie
 * ein beliebiger Farbname aus statt erkennbar wie ein Farbcode – deshalb hier
 * ein „#" voranstellen. Alle anderen Namen bleiben unverändert.
 */
export function formatiereFarbname(name: string): string {
  return HEX_OHNE_RAUTE.test(name) ? `#${name}` : name;
}
