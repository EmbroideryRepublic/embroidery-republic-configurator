/**
 * Mengen-Tipp: „Mit 50 statt 49 Stück zahlen Sie insgesamt 79,01 € weniger.“
 *
 * Die Preisstaffeln (Grundpreis-Rabatt, DTF-Positionsstaffel) greifen als Stufenfunktion für die GESAMTE Bestellung. An den
 * Stufengrenzen kostet deshalb eine etwas größere Menge insgesamt WENIGER als die kleinere (49 Stück 1.028,51 €, 50 Stück
 * 949,50 €). Das ist gewollt – jede Stufe gilt für den ganzen Auftrag –, aber für die Kundschaft erst sichtbar, wenn man es ihr
 * zeigt. Diese Funktion findet die kleinste Menge knapp über der gewählten, bei der der Gesamtpreis tatsächlich sinkt.
 *
 * Reine Anzeige-Hilfe: rechnet mit derselben `calculatePrice`-Funktion wie Konfigurator, Warenkorb und Server und ändert nie
 * einen Preis. Die Bestellung selbst wird mit der gewählten Menge berechnet.
 */
import type { ConfigElement, PricingRule } from '@/types';
import { calculatePrice } from './calculatePrice';

export interface MengenTipp {
  /** Die günstigere Gesamtmenge. */
  menge: number;
  /** Wie viele Stück mehr das sind. */
  mehrStueck: number;
  /** Ersparnis beim Gesamtpreis in Euro (positiv, auf Cent gerundet). */
  ersparnis: number;
}

/** Kleinste Ersparnis, die einen Hinweis lohnt – darunter wäre es Rauschen. */
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
 */
export function findeNaechsteStufe(eingabe: {
  basePrice: number;
  quantity: number;
  elements: ConfigElement[];
  pricingRules: PricingRule[];
  echteMasse?: ReadonlyArray<{ breiteCm: number; hoeheCm: number } | undefined>;
}): NaechsteStufe | null {
  const { basePrice, quantity, elements, pricingRules, echteMasse } = eingabe;
  if (!Number.isFinite(quantity) || quantity < 1 || pricingRules.length === 0) return null;

  const stueckpreis = (menge: number) =>
    calculatePrice({ basePrice, quantity: menge, elements, pricingRules, echteMasse }).unitPrice;
  const aktuell = stueckpreis(quantity);
  if (!(aktuell > 0)) return null;

  const ende = quantity + Math.max(60, quantity);
  for (let menge = quantity + 1; menge <= ende; menge++) {
    const preis = stueckpreis(menge);
    if (aktuell - preis >= MIN_STUECKPREIS_SCHRITT_EUR) {
      return { menge, mehrStueck: menge - quantity, stueckpreis: preis };
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
}): MengenTipp | null {
  const { basePrice, quantity, elements, pricingRules, echteMasse } = eingabe;
  if (!Number.isFinite(quantity) || quantity < 1 || pricingRules.length === 0) return null;

  const gesamt = (menge: number) =>
    calculatePrice({ basePrice, quantity: menge, elements, pricingRules, echteMasse }).totalPrice;
  const aktuell = gesamt(quantity);
  if (!(aktuell > 0)) return null;

  const ende = quantity + suchfenster(quantity);
  for (let menge = quantity + 1; menge <= ende; menge++) {
    const preis = gesamt(menge);
    const ersparnis = Math.round((aktuell - preis) * 100) / 100;
    if (ersparnis >= MIN_ERSPARNIS_EUR) return { menge, mehrStueck: menge - quantity, ersparnis };
  }
  return null;
}
