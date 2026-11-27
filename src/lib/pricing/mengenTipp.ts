/**
 * Mengen-Tipp: „Mit 50 statt 48 Stück zahlst du genauso viel – und erhältst 2 Stück mehr.“
 *
 * Die Preisstaffeln (Grundpreis-Rabatt, DTF-Positionsstaffel) greifen als Stufenfunktion für die GESAMTE Bestellung. Damit eine größere
 * Bestellung nie weniger kostet als eine kleinere, deckelt `calculatePrice` den Gesamtpreis kurz VOR jeder Staffelgrenze auf den Preis der
 * Grenzmenge (Mengenpreis-Deckel, siehe dort): 47 bis 49 Stück kosten so viel wie 50. Diese Funktion macht das für die Kundschaft sichtbar –
 * wer in dieser Zone bestellt, kann für denselben Preis die Grenzmenge nehmen und erhält die fehlenden Stücke dazu.
 *
 * Bis 2026-11-26 galt das Gegenteil: An der Grenze wurde die größere Menge GÜNSTIGER als die kleinere (49 Stück 1.028,51 €, 50 Stück 949,50 €), und der
 * Tipp nannte die Ersparnis. Das ist mit dem Deckel nicht mehr möglich: Der Gesamtpreis sinkt mit der Menge jetzt nie mehr.
 *
 * Reine Anzeige-Hilfe: rechnet mit derselben `calculatePrice`-Funktion wie Konfigurator, Warenkorb und Server und ändert nie einen Preis.
 * Die Bestellung selbst wird mit der gewählten Menge berechnet.
 */
import type { ConfigElement, PricingRule } from '@/types';
import { calculatePrice } from './calculatePrice';

export interface MengenTipp {
  /** Die Menge, für die derselbe Gesamtpreis gilt (die Staffelgrenze über der gewählten Menge). */
  menge: number;
  /** Wie viele Stück mehr das sind. */
  mehrStueck: number;
  /** Betrag, um den der Gesamtpreis der gewählten Menge schon unter ihrer reinen Staffelrechnung liegt (positiv, auf Cent gerundet). */
  ersparnis: number;
  /** Gesamtpreis der gewählten Menge – und damit auch der der Grenzmenge. */
  gesamtpreis: number;
}

/** Kleinste Ersparnis durch den Deckel, die einen Hinweis lohnt – darunter wäre es Rauschen (1 Stück Unterschied bei wenigen Cent). */
export const MIN_ERSPARNIS_EUR = 1;

/** Wie weit der Tipp über die gewählte Menge hinausschauen darf: höchstens ein Viertel mehr, mindestens 10 Stück. */
export function suchfenster(menge: number): number {
  return Math.max(10, Math.ceil(menge * 0.25));
}

export interface NaechsteStufe {
  /** Kleinste Menge über der gewählten, ab der der Stückpreis sinkt. */
  menge: number;
  /** Wie viele Stück mehr das sind. */
  mehrStueck: number;
  /** Stückpreis ab dieser Menge (inkl. anteiliger Einrichtung, wie im Konfigurator angezeigt). */
  stueckpreis: number;
}

/** Kleinster Rückgang des Stückpreises (in Euro), den die Anzeige als „nächste Stufe“ meldet. */
export const MIN_STUECKPREIS_SCHRITT_EUR = 0.5;

/**
 * „Noch 2 Stück – dann nur noch 26,99 € pro Stück.“ Zeigt die Kundschaft die nächste Menge, ab der der STÜCKPREIS sinkt
 * (bei den Staffeln 3, 5, 10, 20, 50 und 100 Stück). Reine Anzeige-Hilfe auf Basis derselben `calculatePrice`-Funktion wie
 * der Warenkorb – ändert nie einen Preis. Sucht bis zur doppelten Menge (mindestens 60 Stück) voraus.
 *
 * Gesucht wird nach den REGULÄREN Stufenpreisen (ohne Mengenpreis-Deckel): Die Zone vor einer Staffelgrenze hat krumme Zwischenpreise
 * (Gesamtpreis ÷ Menge), die nicht „die nächste Stufe“ sind. Der genannte Stückpreis ist dagegen der echte Preis der Menge, wie ihn
 * Konfigurator und Warenkorb zeigen.
 */
export function findeNaechsteStufe(eingabe: {
  basePrice: number;
  quantity: number;
  elements: ConfigElement[];
  pricingRules: PricingRule[];
  echteMasse?: ReadonlyArray<{ breiteCm: number; hoeheCm: number } | undefined>;
  /** Preisaktion (config/aktion.ts), damit die genannten Preise die der Anzeige sind; die Suche selbst vergleicht reguläre Preise. */
  aktion?: { prozent: number } | null;
}): NaechsteStufe | null {
  const { basePrice, quantity, elements, pricingRules, echteMasse, aktion } = eingabe;
  if (!Number.isFinite(quantity) || quantity < 1 || pricingRules.length === 0) return null;

  const regulaer = (menge: number) =>
    calculatePrice({ basePrice, quantity: menge, elements, pricingRules, echteMasse, mengenDeckel: false }).unitPrice;
  const aktuell = regulaer(quantity);
  if (!(aktuell > 0)) return null;

  const ende = quantity + Math.max(60, quantity);
  for (let menge = quantity + 1; menge <= ende; menge++) {
    if (aktuell - regulaer(menge) >= MIN_STUECKPREIS_SCHRITT_EUR) {
      const echt = calculatePrice({ basePrice, quantity: menge, elements, pricingRules, echteMasse, aktion }).unitPrice;
      return { menge, mehrStueck: menge - quantity, stueckpreis: echt };
    }
  }
  return null;
}

export function findeMengenTipp(eingabe: {
  basePrice: number;
  quantity: number;
  elements: ConfigElement[];
  pricingRules: PricingRule[];
  echteMasse?: ReadonlyArray<{ breiteCm: number; hoeheCm: number } | undefined>;
  /** Preisaktion (config/aktion.ts), damit die genannten Preise die der Anzeige sind; die Suche selbst vergleicht reguläre Preise. */
  aktion?: { prozent: number } | null;
}): MengenTipp | null {
  const { basePrice, quantity, elements, pricingRules, echteMasse, aktion } = eingabe;
  if (!Number.isFinite(quantity) || quantity < 1 || pricingRules.length === 0) return null;

  const r = calculatePrice({ basePrice, quantity, elements, pricingRules, echteMasse, aktion });
  const grenze = r.breakdown.mengenDeckelAufMenge;
  if (grenze === null || !(r.totalPrice > 0)) return null;
  // Mit Aktion ist auch die Ersparnis durch den Deckel um den Aktionssatz kleiner (der Deckel selbst steht im Ergebnis vor der Aktion).
  const ersparnis = Math.round(-r.breakdown.mengenDeckelTotal * (1 - r.breakdown.aktionProzent / 100) * 100) / 100;
  const mehrStueck = grenze - quantity;
  if (ersparnis < MIN_ERSPARNIS_EUR || mehrStueck < 1 || mehrStueck > suchfenster(quantity)) return null;
  return { menge: grenze, mehrStueck, ersparnis, gesamtpreis: r.totalPrice };
}
