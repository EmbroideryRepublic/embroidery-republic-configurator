/**
 * Kürzt Text hart auf `maxLaenge`, bevorzugt an einer Wortgrenze, und hängt
 * bei tatsächlicher Kürzung ein „…" an. Einziger Ort für diese Regel, damit
 * Titel und Description dieselbe Kürzungslogik teilen.
 */
export function kuerzenAufLaenge(text: string, maxLaenge: number): string {
  if (text.length <= maxLaenge) return text;
  const budget = maxLaenge - 1; // Platz für das „…"
  const abschnitt = text.slice(0, budget);
  const letzteLeerstelle = abschnitt.lastIndexOf(' ');
  // Nur an der Wortgrenze abschneiden, wenn dabei nicht zu viel verloren geht.
  const gekuerzt = letzteLeerstelle > budget * 0.6 ? abschnitt.slice(0, letzteLeerstelle) : abschnitt;
  return `${gekuerzt.trimEnd()}…`;
}
