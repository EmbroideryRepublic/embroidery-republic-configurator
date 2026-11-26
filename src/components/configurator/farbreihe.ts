/**
 * Einzeilige Farbauswahl im Konfigurator.
 *
 * Bei vielen Farben (bis zu 30 je Produkt) brach die Farbleiste auf mehrere Zeilen um und schob die Vorschau nach unten. Jetzt
 * zeigt sie zunächst nur eine Zeile; der Kunde kann die übrigen Farben aufklappen. Diese Datei enthält die reine Auswahllogik
 * (ohne React), damit sie getestet werden kann.
 */

export interface EinzeiligeFarben<T> {
  /** Farben in der Reihenfolge, in der sie gezeigt werden. */
  liste: T[];
  /** Wie viele Farben im zugeklappten Zustand nicht in der ersten Zeile stehen. */
  versteckt: number;
}

/**
 * @param farben     alle wählbaren Farben in Katalogreihenfolge
 * @param aktivId    aktuell gewählte Farbe (bleibt im zugeklappten Zustand immer sichtbar)
 * @param sichtbar   so viele Farben passen in eine Zeile (gemessen); null = noch nicht gemessen
 * @param offen      Leiste aufgeklappt
 */
export function einzeiligeFarben<T extends { id: string }>(
  farben: readonly T[],
  aktivId: string | undefined,
  sichtbar: number | null,
  offen: boolean
): EinzeiligeFarben<T> {
  const alle = [...farben];
  if (sichtbar === null || sichtbar < 1 || sichtbar >= alle.length) return { liste: alle, versteckt: 0 };
  const versteckt = alle.length - sichtbar;
  if (offen) return { liste: alle, versteckt };
  // Zugeklappt: Die gewählte Farbe gehört in die erste Zeile. Steht sie weiter hinten, tauscht sie mit der letzten sichtbaren Farbe.
  const index = aktivId === undefined ? -1 : alle.findIndex((f) => f.id === aktivId);
  if (index >= sichtbar) {
    const platz = sichtbar - 1;
    const gewaehlt = alle[index]!;
    alle[index] = alle[platz]!;
    alle[platz] = gewaehlt;
  }
  return { liste: alle, versteckt };
}

/** Beschriftung des Knopfes: „+12 weitere Farben“ bzw. „Weniger Farben“. */
export function farbreiheKnopfText(versteckt: number, offen: boolean, mehr: string, weniger: string): string {
  return offen ? weniger : `+${versteckt} ${mehr}`;
}

/**
 * Misst, wie viele Farbpunkte in der ersten Zeile stehen: alle Kinder, deren obere Kante (offsetTop) der des ersten entspricht
 * (Toleranz 2 px wegen der leichten Vergrößerung der gewählten Farbe).
 */
export function ersteZeileAnzahl(oben: readonly number[]): number {
  if (oben.length === 0) return 0;
  const erste = oben[0]!;
  return oben.filter((o) => o <= erste + 2).length;
}
