/**
 * Erklärsätze unter den Preisbeispielen (Anlass-, DTF- und Kategorieseiten).
 *
 * Warum: Zwei Effekte machen einen Beispielpreis ohne Erklärung missverständlich (Betreiberauftrag 2026-11-25: keine missverständlichen
 * Preisangaben):
 *   1. Bei 1–2 Stück steckt die einmalige Einrichtung im Stückpreis (Regel dtf-kleinauftrag, config/pricingRules.ts).
 *   2. Eine zweite bedruckte Position (Brust + Rücken) kommt je Stück zum Preis hinzu, deshalb kann eine größere Menge mit zwei
 *      Positionen mehr pro Stück kosten als eine kleinere Menge mit einer.
 * Betrag und Stückzahl-Grenze der Einrichtung kommen aus der Preisregel, nicht von Hand. Zwischen Zahl und Einheit stehen geschützte
 * Leerzeichen, damit „10 €“ und „2 Stück“ auf dem Handy nicht umbrechen.
 *
 * Textfreigabe: Wortlaut vom Betreiber am 2026-11-25 freigegeben (1 Stück, 2 Stück, zwei Positionen).
 */
import { KLEINAUFTRAG_MAX_STUECK, KLEINAUFTRAG_PAUSCHALE_EUR } from '@/config/pricingRules';
import { GROSSFORMAT_STUFEN } from '@/config/pricing/grossformat';

const NBSP = ' ';

/** Erklärung zur Einrichtung für eine Zeile mit `menge` Stück; `null`, wenn die Einrichtung dort nicht anfällt. */
export function einrichtungsHinweis(menge: number): string | null {
  if (menge < 1 || menge > KLEINAUFTRAG_MAX_STUECK) return null;
  const betrag = `${KLEINAUFTRAG_PAUSCHALE_EUR}${NBSP}€`;
  const grenze = `${KLEINAUFTRAG_MAX_STUECK}${NBSP}Stück`;
  const danach = `${KLEINAUFTRAG_MAX_STUECK + 1}${NBSP}Stück`;
  const schluss = `Die Einrichtung fällt nur bei bis zu ${grenze} an; ab ${danach} entfällt sie.`;
  if (menge === 1) return `Der Preis enthält die einmalige Einrichtung von ${betrag}. ${schluss}`;
  const jeStueck = Math.round((KLEINAUFTRAG_PAUSCHALE_EUR / menge) * 100) / 100;
  return `Der Preis enthält die einmalige Einrichtung von ${betrag}, auf die ${menge}${NBSP}Stück verteilt (${String(jeStueck).replace('.', ',')}${NBSP}€ je Stück). ${schluss}`;
}

/** Erklärung für Zeilen mit Brust- UND Rückenmotiv. */
export const HINWEIS_ZWEI_POSITIONEN = 'Das sind zwei bedruckte Positionen (Brust und Rücken); die zweite Position kommt je Stück hinzu.';

/**
 * Erklärung für ein großes Motiv: Über dem Standardformat kostet die Transferfolie mehr (Großformat-Zuschlag, config/pricing/grossformat.ts).
 * Der Betrag je Stück kommt aus der Preis-Engine (berechneBeispiele), die Formatgrenze aus der Stufentabelle.
 */
export function grossformatHinweis(zuschlagJeStueck: number): string | null {
  if (!(zuschlagJeStueck > 0)) return null;
  const grenze = GROSSFORMAT_STUFEN[0]?.beispiel.replace(/^bis /, '') ?? '';
  const betrag = zuschlagJeStueck.toFixed(2).replace('.', ',');
  return `Das große Motiv überschreitet das Standardformat (bis ${grenze}); dafür kommt ein Großformat-Zuschlag von ${betrag}${NBSP}€ je Stück hinzu.`;
}

/**
 * Alle Erklärsätze einer Beispielzeile. `eigener` ersetzt den Satz zu den Positionen, wenn die Seite die Zeile genauer erklärt
 * (z. B. „… zum Preis der Zeile darüber hinzu“).
 */
export function zeilenHinweise(zeile: { menge: number; positionen: number; eigener?: string; dtf?: boolean; grossformat?: number }): string[] {
  const hinweise: string[] = [];
  // Die Einrichtung gilt nur für DTF (Stickerei rechnet sie nicht).
  const einrichtung = zeile.dtf === false ? null : einrichtungsHinweis(zeile.menge);
  if (einrichtung) hinweise.push(einrichtung);
  if (zeile.eigener) hinweise.push(zeile.eigener);
  else if (zeile.positionen > 1) hinweise.push(HINWEIS_ZWEI_POSITIONEN);
  const gross = zeile.grossformat !== undefined ? grossformatHinweis(zeile.grossformat) : null;
  if (gross) hinweise.push(gross);
  return hinweise;
}
